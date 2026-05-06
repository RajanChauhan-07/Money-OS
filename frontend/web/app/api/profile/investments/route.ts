import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getCurrentFY, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// GET — Get existing investments for current FY
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const fy = getCurrentFY()
    const { data, error } = await supabase
      .from('existing_investments')
      .select('*')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .single()

    if (error && error.code !== 'PGRST116') {
      return apiError('Failed to fetch investments', 500)
    }

    return apiResponse(data)
  } catch (error) {
    console.error('Investments GET error:', error)
    return apiError('Internal server error', 500)
  }
}

// POST — Create or update existing investments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const fy = body.financial_year || getCurrentFY()
    const ip = getClientIP(request)

    const payload = {
      ppf_annual: body.ppf_annual || 0,
      lic_premium_annual: body.lic_premium_annual || 0,
      elss_annual: body.elss_annual || 0,
      nsc_annual: body.nsc_annual || 0,
      ssy_annual: body.ssy_annual || 0,
      tuition_fees: body.tuition_fees || 0,
      nps_employee_annual: body.nps_employee_annual || 0,
      other_80c_annual: body.other_80c_annual || 0,
    }

    const { data: existing } = await supabase
      .from('existing_investments')
      .select('id')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .single()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('existing_investments')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) return apiError('Failed to update investments', 500)
      result = data
    } else {
      const { data, error } = await supabase
        .from('existing_investments')
        .insert({ user_id: user.id, financial_year: fy, ...payload })
        .select()
        .single()
      if (error) return apiError('Failed to create investments', 500)
      result = data
    }

    await writeAuditLog({
      userId: user.id,
      action: existing ? 'investments.updated' : 'investments.created',
      resourceType: 'existing_investments',
      resourceId: result.id,
      ipAddress: ip,
    })

    return apiResponse(result, existing ? 200 : 201)
  } catch (error) {
    console.error('Investments POST error:', error)
    return apiError('Internal server error', 500)
  }
}
