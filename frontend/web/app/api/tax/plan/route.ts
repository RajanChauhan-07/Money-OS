import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getCurrentFY } from '@/lib/api-helpers'
import { generateInvestmentPlan } from '@money-os/tax-engine'
import { NextRequest } from 'next/server'

// GET — Get current investment plan
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const fy = getCurrentFY()

    const { data, error } = await supabase
      .from('investment_plans')
      .select('*, tax_calculations(*)')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .eq('is_current', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      return apiError('Failed to fetch investment plan', 500)
    }

    return apiResponse(data)
  } catch (error) {
    console.error('Plan GET error:', error)
    return apiError('Internal server error', 500)
  }
}

// POST — Save new tax plan and generate investment suggestions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { taxResult, derivedProfile } = body

    if (!taxResult || !derivedProfile) {
      return apiError('Missing required data', 400)
    }

    const fy = getCurrentFY()

    // 1. Generate investment plan
    const { allocations, monthlyPlan } = generateInvestmentPlan(taxResult)

    // 2. Transactional save (using Supabase client)
    // First, invalidate previous records
    await supabase
      .from('tax_calculations')
      .update({ is_current: false })
      .eq('user_id', user.id)
      .eq('financial_year', fy)

    await supabase
      .from('investment_plans')
      .update({ is_current: false })
      .eq('user_id', user.id)
      .eq('financial_year', fy)

    // Save tax calculation
    const { data: taxData, error: taxError } = await supabase
      .from('tax_calculations')
      .insert({
        user_id: user.id,
        financial_year: fy,
        is_current: true,
        inputs_snapshot: derivedProfile,
        old_regime_result: taxResult.old,
        new_regime_result: taxResult.new,
        recommended_regime: taxResult.recommendedRegime,
        savings_delta: taxResult.savingsWithRecommended,
        deductions_detail: taxResult.deductions,
      })
      .select()
      .single()

    if (taxError) {
      console.error('Tax save error:', taxError)
      return apiError('Failed to save tax calculation', 500)
    }

    // Save investment plan
    const { data: planData, error: planError } = await supabase
      .from('investment_plans')
      .insert({
        user_id: user.id,
        tax_calculation_id: taxData.id,
        financial_year: fy,
        is_current: true,
        allocations,
        monthly_plan: monthlyPlan,
        total_annual_investment: allocations.reduce((sum: number, a: any) => sum + a.annualAmount, 0),
        projected_tax_saving: taxResult.savingsWithRecommended,
        section_80c_used: taxResult.deductions.section80C,
        section_80d_used: taxResult.deductions.section80D_self + taxResult.deductions.section80D_parents,
        nps_used: taxResult.deductions.section80CCD1B,
      })
      .select()
      .single()

    if (planError) {
      console.error('Plan save error:', planError)
      return apiError('Failed to save investment plan', 500)
    }

    return apiResponse({
      taxCalculation: taxData,
      investmentPlan: planData
    })
  } catch (error) {
    console.error('Plan POST error:', error)
    return apiError('Internal server error', 500)
  }
}
