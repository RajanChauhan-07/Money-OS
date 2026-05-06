import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getCurrentFY, getClientIP, writeAuditLog } from '@/lib/api-helpers'
import { compareTaxRegimes } from '@money-os/tax-engine'
import type { TaxInput, TaxComparisonResult } from '@money-os/types'

// POST — Trigger full tax calculation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const fy = body.financial_year || getCurrentFY()
    const triggerReason = body.trigger_reason || 'manual'
    const ip = getClientIP(request)

    // Fetch all profile data from DB
    const [salaryRes, lifeRes, investRes] = await Promise.all([
      supabase
        .from('salary_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('financial_year', fy)
        .eq('is_active', true)
        .single(),
      supabase
        .from('life_situations')
        .select('*')
        .eq('user_id', user.id)
        .eq('financial_year', fy)
        .single(),
      supabase
        .from('existing_investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('financial_year', fy)
        .single(),
    ])

    const salary = salaryRes.data
    const life = lifeRes.data
    const investments = investRes.data

    if (!salary) {
      return apiError('Salary profile required for tax calculation', 400)
    }

    // Build TaxInput from DB data
    const taxInput: TaxInput = {
      salary: {
        annualCTC: Number(salary.annual_ctc),
        inHandMonthly: 0, // computed by engine
        variablePayPercent: Number(salary.variable_pay_pct || 0),
        payFrequency: 'monthly',
      },
      structure: {
        basicSalary: Number(salary.basic_salary || 0),
        hra: Number(salary.hra_monthly || 0),
        lta: Number(salary.lta_annual || 0),
        specialAllowance: Number(salary.special_allowance || 0),
        otherAllowances: Number(salary.other_allowances || 0),
        isMetroCity: salary.is_metro_city || false,
        cityName: salary.city_name || '',
        monthlyRent: Number(salary.monthly_rent || 0),
      },
      employer: {
        epfEmployeePercent: Number(salary.epf_employee_pct ?? 12),
        epfEmployerPercent: Number(salary.epf_employer_pct ?? 12),
        hasEmployerNPS: salary.has_employer_nps || false,
        employerNPSPercent: Number(salary.employer_nps_pct || 0),
        companyName: '',
      },
      life: {
        isRenting: life?.is_renting || false,
        hasHomeLoan: life?.has_home_loan || false,
        homeLoanEMI: 0,
        homeLoanOutstanding: 0,
        homeLoanInterestAnnual: Number(life?.home_loan_interest_annual || 0),
        homeLoanPrincipalAnnual: Number(life?.home_loan_principal_annual || 0),
        dependentChildren: life?.dependent_children || 0,
        hasSeniorParents: life?.has_senior_parents || false,
        parentAge: life?.has_senior_parents ? 65 : 55,
        selfHealthPremium: Number(life?.self_health_premium || 0),
        familyHealthPremium: Number(life?.family_health_premium || 0),
        parentHealthPremium: Number(life?.parent_health_premium || 0),
      },
      investments: {
        ppfAnnual: Number(investments?.ppf_annual || 0),
        licPremiumAnnual: Number(investments?.lic_premium_annual || 0),
        elssAnnual: Number(investments?.elss_annual || 0),
        nscAnnual: Number(investments?.nsc_annual || 0),
        ssyAnnual: Number(investments?.ssy_annual || 0),
        tuitionFees: Number(investments?.tuition_fees || 0),
        epfEmployee: Math.round(
          Number(salary.annual_ctc) * Number(salary.epf_employee_pct || 12) / 100 / 12
        ) * 12, // annual EPF employee
        npsEmployee: Number(investments?.nps_employee_annual || 0),
        otherSection80C: Number(investments?.other_80c_annual || 0),
      },
      financialYear: `FY ${fy}`,
    }

    // Run tax engine
    const result: TaxComparisonResult = compareTaxRegimes(taxInput)

    // Store canonical result
    const { data: taxCalc, error: calcError } = await supabase
      .from('tax_calculations')
      .insert({
        user_id: user.id,
        financial_year: fy,
        inputs_snapshot: taxInput,
        old_regime_result: result.old,
        new_regime_result: result.new,
        recommended_regime: result.recommendedRegime,
        savings_delta: result.savingsWithRecommended,
        deductions_detail: result.deductions,
        tax_law_version: 'FY2025-26-v1',
        trigger_reason: triggerReason,
      })
      .select()
      .single()

    if (calcError) {
      console.error('Tax calc insert error:', calcError)
      return apiError('Failed to store tax calculation', 500)
    }

    // Generate investment plan based on deductions
    const deductions = result.deductions
    const section80CHeadroom = 150000 - deductions.section80C
    const section80DHeadroom = 25000 - deductions.section80D_self

    const allocations = []

    // EPF (auto)
    if (taxInput.investments.epfEmployee > 0) {
      allocations.push({
        instrument: 'EPF (Employee)',
        section: '80C',
        annualAmount: taxInput.investments.epfEmployee,
        monthlyAmount: Math.round(taxInput.investments.epfEmployee / 12),
        risk: 'low',
        lockIn: 0,
        expectedReturn: 8.1,
      })
    }

    // ELSS if headroom
    if (section80CHeadroom > 0) {
      const elssAmount = Math.min(section80CHeadroom, 60000)
      allocations.push({
        instrument: 'ELSS Tax Saver Fund',
        section: '80C',
        annualAmount: elssAmount,
        monthlyAmount: Math.round(elssAmount / 12),
        risk: 'high',
        lockIn: 3,
        expectedReturn: 12.5,
      })
    }

    // Health insurance
    if (deductions.section80D_self > 0) {
      allocations.push({
        instrument: 'Health Insurance Premium',
        section: '80D',
        annualAmount: deductions.section80D_self,
        monthlyAmount: Math.round(deductions.section80D_self / 12),
        risk: 'low',
        lockIn: 1,
        expectedReturn: 0,
      })
    }

    // NPS if available
    if (deductions.section80CCD1B > 0) {
      allocations.push({
        instrument: 'NPS (Employee)',
        section: 'NPS',
        annualAmount: deductions.section80CCD1B,
        monthlyAmount: Math.round(deductions.section80CCD1B / 12),
        risk: 'medium',
        lockIn: 0,
        expectedReturn: 10.0,
      })
    }

    const totalAnnual = allocations.reduce((s, a) => s + a.annualAmount, 0)

    // Insert investment plan
    await supabase.from('investment_plans').insert({
      user_id: user.id,
      tax_calculation_id: taxCalc.id,
      financial_year: fy,
      allocations,
      monthly_plan: [],
      total_annual_investment: totalAnnual,
      projected_tax_saving: result.savingsWithRecommended,
      section_80c_used: deductions.section80C,
      section_80d_used: deductions.section80D_self + deductions.section80D_parents,
      nps_used: deductions.section80CCD1B,
    })

    // Audit log
    await writeAuditLog({
      userId: user.id,
      action: 'tax.calculated',
      resourceType: 'tax_calculations',
      resourceId: taxCalc.id,
      ipAddress: ip,
      metadata: {
        version: taxCalc.version,
        recommended: result.recommendedRegime,
        savings: result.savingsWithRecommended,
        trigger: triggerReason,
      },
    })

    return apiResponse({
      ...result,
      version: taxCalc.version,
      calculated_at: taxCalc.calculated_at,
    })
  } catch (error) {
    console.error('Tax calculate error:', error)
    return apiError('Internal server error', 500)
  }
}
