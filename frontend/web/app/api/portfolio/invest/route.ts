import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'
import crypto from 'crypto'

// POST — Place lumpsum investment order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { scheme_code, amount, goal_id, section } = body
    const ip = getClientIP(request)

    if (!scheme_code || !amount) {
      return apiError('scheme_code and amount are required', 400)
    }

    // Verify fund
    const { data: fund } = await supabase
      .from('mf_funds')
      .select('scheme_code, scheme_name, nav, min_lumpsum, is_elss')
      .eq('scheme_code', scheme_code)
      .eq('is_active', true)
      .single()

    if (!fund) return apiError('Fund not found or inactive', 404)

    if (amount < Number(fund.min_lumpsum || 1000)) {
      return apiError(`Minimum lumpsum for this fund is ₹${fund.min_lumpsum}`, 400)
    }

    // Generate order ID
    const orderId = `MOS-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // Create transaction
    const { data: txn, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        scheme_code,
        type: 'Lumpsum',
        amount,
        nav: Number(fund.nav),
        units: Math.round((amount / Number(fund.nav)) * 10000) / 10000,
        status: 'processing',
        order_id: orderId,
        transacted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return apiError('Failed to create investment order', 500)

    // Upsert holdings (add to existing or create new)
    const { data: existingHolding } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', user.id)
      .eq('scheme_code', scheme_code)
      .single()

    const allottedUnits = txn.units || 0
    const allottedNav = Number(fund.nav)

    if (existingHolding) {
      const newUnits = Number(existingHolding.units) + allottedUnits
      const newInvested = Number(existingHolding.invested_amount) + amount
      const newAvgNav = newInvested / newUnits

      await supabase
        .from('holdings')
        .update({
          units: newUnits,
          avg_nav: Math.round(newAvgNav * 10000) / 10000,
          invested_amount: newInvested,
        })
        .eq('id', existingHolding.id)
    } else {
      await supabase.from('holdings').insert({
        user_id: user.id,
        scheme_code,
        units: allottedUnits,
        avg_nav: allottedNav,
        invested_amount: amount,
        goal_id: goal_id || null,
        section: fund.is_elss ? '80C' : (section || 'Other'),
      })
    }

    // Mark transaction as allotted
    await supabase
      .from('transactions')
      .update({ status: 'allotted' })
      .eq('id', txn.id)

    await writeAuditLog({
      userId: user.id,
      action: 'investment.lumpsum',
      resourceType: 'transactions',
      resourceId: txn.id,
      ipAddress: ip,
      metadata: { scheme_code, amount, units: allottedUnits, nav: allottedNav, order_id: orderId },
    })

    return apiResponse({
      transaction_id: txn.id,
      order_id: orderId,
      status: 'allotted',
      units: allottedUnits,
      nav: allottedNav,
    }, 201)
  } catch (error) {
    console.error('Invest POST error:', error)
    return apiError('Internal server error', 500)
  }
}
