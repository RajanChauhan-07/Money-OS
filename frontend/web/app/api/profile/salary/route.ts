import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getCurrentFY, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// GET — Get active salary profile for current FY
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const fy = getCurrentFY()
    const { data, error } = await supabase
      .from('salary_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      return apiError('Failed to fetch salary profile', 500)
    }

    return apiResponse(data)
  } catch (error) {
    console.error('Salary GET error:', error)
    return apiError('Internal server error', 500)
  }
}

// POST — Create or update salary profile, triggers tax recalculation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const fy = body.financial_year || getCurrentFY()
    const ip = getClientIP(request)

    // Check if profile already exists for this FY
    const { data: existing } = await supabase
      .from('salary_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .eq('is_active', true)
      .single()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('salary_profiles')
        .update({
          annual_ctc: body.annual_ctc,
          basic_salary: body.basic_salary || 0,
          hra_monthly: body.hra_monthly || 0,
          lta_annual: body.lta_annual || 0,
          special_allowance: body.special_allowance || 0,
          other_allowances: body.other_allowances || 0,
          variable_pay_pct: body.variable_pay_pct || 0,
          is_metro_city: body.is_metro_city || false,
          city_name: body.city_name || '',
          monthly_rent: body.monthly_rent || 0,
          epf_employee_pct: body.epf_employee_pct ?? 12,
          epf_employer_pct: body.epf_employer_pct ?? 12,
          has_employer_nps: body.has_employer_nps || false,
          employer_nps_pct: body.employer_nps_pct || 0,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return apiError('Failed to update salary profile', 500)
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('salary_profiles')
        .insert({
          user_id: user.id,
          financial_year: fy,
          annual_ctc: body.annual_ctc,
          basic_salary: body.basic_salary || 0,
          hra_monthly: body.hra_monthly || 0,
          lta_annual: body.lta_annual || 0,
          special_allowance: body.special_allowance || 0,
          other_allowances: body.other_allowances || 0,
          variable_pay_pct: body.variable_pay_pct || 0,
          is_metro_city: body.is_metro_city || false,
          city_name: body.city_name || '',
          monthly_rent: body.monthly_rent || 0,
          epf_employee_pct: body.epf_employee_pct ?? 12,
          epf_employer_pct: body.epf_employer_pct ?? 12,
          has_employer_nps: body.has_employer_nps || false,
          employer_nps_pct: body.employer_nps_pct || 0,
        })
        .select()
        .single()

      if (error) return apiError('Failed to create salary profile', 500)
      result = data
    }

    // Update onboarding step
    await supabase
      .from('users')
      .update({ onboarding_step: Math.max(5, body.onboarding_step || 0) })
      .eq('id', user.id)

    // Audit log
    await writeAuditLog({
      userId: user.id,
      action: existing ? 'salary.updated' : 'salary.created',
      resourceType: 'salary_profiles',
      resourceId: result.id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    // Trigger tax recalculation in background
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      fetch(`${baseUrl}/api/tax/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({ trigger_reason: 'salary_update' }),
      }).catch(() => {}) // Fire and forget
    } catch {} // Non-critical

    return apiResponse(result, existing ? 200 : 201)
  } catch (error) {
    console.error('Salary POST error:', error)
    return apiError('Internal server error', 500)
  }
}
