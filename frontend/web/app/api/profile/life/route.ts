import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getCurrentFY, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// GET — Get life situation for current FY
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const fy = getCurrentFY()
    const { data, error } = await supabase
      .from('life_situations')
      .select('*')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .single()

    if (error && error.code !== 'PGRST116') {
      return apiError('Failed to fetch life situation', 500)
    }

    return apiResponse(data)
  } catch (error) {
    console.error('Life GET error:', error)
    return apiError('Internal server error', 500)
  }
}

// POST — Create or update life situation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const fy = body.financial_year || getCurrentFY()
    const ip = getClientIP(request)

    const payload = {
      is_renting: body.is_renting || false,
      has_home_loan: body.has_home_loan || false,
      home_loan_interest_annual: body.home_loan_interest_annual || 0,
      home_loan_principal_annual: body.home_loan_principal_annual || 0,
      dependent_children: body.dependent_children || 0,
      has_senior_parents: body.has_senior_parents || false,
      self_health_premium: body.self_health_premium || 0,
      family_health_premium: body.family_health_premium || 0,
      parent_health_premium: body.parent_health_premium || 0,
    }

    const { data: existing } = await supabase
      .from('life_situations')
      .select('id')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .single()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('life_situations')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return apiError('Failed to update life situation', 500)
      result = data
    } else {
      const { data, error } = await supabase
        .from('life_situations')
        .insert({ user_id: user.id, financial_year: fy, ...payload })
        .select()
        .single()
      if (error) return apiError('Failed to create life situation', 500)
      result = data
    }

    await writeAuditLog({
      userId: user.id,
      action: existing ? 'life.updated' : 'life.created',
      resourceType: 'life_situations',
      resourceId: result.id,
      ipAddress: ip,
    })

    // Trigger recalculation
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/tax/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
        body: JSON.stringify({ trigger_reason: 'profile_update' }),
      }).catch(() => {})
    } catch {}

    return apiResponse(result, existing ? 200 : 201)
  } catch (error) {
    console.error('Life POST error:', error)
    return apiError('Internal server error', 500)
  }
}
