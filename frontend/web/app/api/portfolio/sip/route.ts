import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// GET — List active SIP mandates
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { data, error } = await supabase
      .from('sip_mandates')
      .select(`*, mf_funds(scheme_name, amc_name, nav, category)`)
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })

    if (error) return apiError('Failed to fetch SIP mandates', 500)
    return apiResponse(data || [])
  } catch (error) {
    console.error('SIP GET error:', error)
    return apiError('Internal server error', 500)
  }
}

// POST — Create SIP mandate
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { scheme_code, amount, sip_date, frequency, goal_id } = body
    const ip = getClientIP(request)

    if (!scheme_code || !amount || !sip_date) {
      return apiError('scheme_code, amount, and sip_date are required', 400)
    }

    if (amount < 500) {
      return apiError('Minimum SIP amount is ₹500', 400)
    }

    if (sip_date < 1 || sip_date > 28) {
      return apiError('SIP date must be between 1 and 28', 400)
    }

    // Verify fund exists
    const { data: fund } = await supabase
      .from('mf_funds')
      .select('scheme_code, scheme_name, min_sip_amount')
      .eq('scheme_code', scheme_code)
      .eq('is_active', true)
      .single()

    if (!fund) return apiError('Fund not found or inactive', 404)

    if (amount < Number(fund.min_sip_amount || 500)) {
      return apiError(`Minimum SIP for this fund is ₹${fund.min_sip_amount}`, 400)
    }

    // Create mandate
    const startDate = new Date()
    const nextDebit = new Date(startDate.getFullYear(), startDate.getMonth() + 1, sip_date)

    const { data, error } = await supabase
      .from('sip_mandates')
      .insert({
        user_id: user.id,
        scheme_code,
        amount,
        frequency: frequency || 'monthly',
        sip_date,
        start_date: startDate.toISOString().split('T')[0],
        next_debit_date: nextDebit.toISOString().split('T')[0],
        status: 'active',
        goal_id: goal_id || null,
      })
      .select()
      .single()

    if (error) return apiError('Failed to create SIP mandate', 500)

    await writeAuditLog({
      userId: user.id,
      action: 'sip.created',
      resourceType: 'sip_mandates',
      resourceId: data.id,
      ipAddress: ip,
      metadata: { scheme_code, amount, sip_date },
    })

    return apiResponse(data, 201)
  } catch (error) {
    console.error('SIP POST error:', error)
    return apiError('Internal server error', 500)
  }
}

// PATCH — Pause / modify / cancel SIP
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { id, action, amount } = body

    if (!id || !action) {
      return apiError('id and action (pause/resume/cancel/modify) required', 400)
    }

    const updates: Record<string, unknown> = {}

    switch (action) {
      case 'pause':
        updates.status = 'paused'
        break
      case 'resume':
        updates.status = 'active'
        break
      case 'cancel':
        updates.status = 'cancelled'
        break
      case 'modify':
        if (amount && amount >= 500) updates.amount = amount
        break
      default:
        return apiError('Invalid action', 400)
    }

    const { data, error } = await supabase
      .from('sip_mandates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return apiError('Failed to update SIP mandate', 500)

    await writeAuditLog({
      userId: user.id,
      action: `sip.${action}`,
      resourceType: 'sip_mandates',
      resourceId: id,
      ipAddress: getClientIP(request),
      metadata: { action, ...updates },
    })

    return apiResponse(data)
  } catch (error) {
    console.error('SIP PATCH error:', error)
    return apiError('Internal server error', 500)
  }
}
