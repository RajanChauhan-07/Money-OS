// supabase/functions/tax-calculate/index.ts
// Deno Edge Function — server-side tax calculation with versioning

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaxSlab {
  min: number
  max: number
  rate: number
}

const FY_2025_26 = {
  old: {
    slabs: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: Infinity, rate: 0.30 },
    ] as TaxSlab[],
    standardDeduction: 50000,
    rebate87A: { limit: 500000, rebate: 12500 },
  },
  new: {
    slabs: [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 700000, rate: 0.05 },
      { min: 700000, max: 1000000, rate: 0.10 },
      { min: 1000000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: Infinity, rate: 0.30 },
    ] as TaxSlab[],
    standardDeduction: 75000,
    rebate87A: { limit: 700000, rebate: 25000 },
  },
  cessRate: 0.04,
}

function computeTaxFromSlabs(taxableIncome: number, slabs: TaxSlab[]): number {
  let tax = 0
  for (const slab of slabs) {
    if (taxableIncome <= slab.min) break
    const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min
    tax += taxableInSlab * slab.rate
  }
  return tax
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { user_id, financial_year, trigger_reason, inputs } = await req.json()

    if (!user_id || !financial_year) {
      return new Response(
        JSON.stringify({ error: 'user_id and financial_year required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use provided inputs or fetch from DB
    let taxInputs = inputs
    if (!taxInputs) {
      const [salaryRes, lifeRes, investRes] = await Promise.all([
        supabase.from('salary_profiles').select('*').eq('user_id', user_id).eq('financial_year', financial_year).eq('is_active', true).single(),
        supabase.from('life_situations').select('*').eq('user_id', user_id).eq('financial_year', financial_year).single(),
        supabase.from('existing_investments').select('*').eq('user_id', user_id).eq('financial_year', financial_year).single(),
      ])

      const salary = salaryRes.data
      if (!salary) {
        return new Response(
          JSON.stringify({ error: 'No salary profile found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const life = lifeRes.data
      const inv = investRes.data

      taxInputs = {
        annualCTC: Number(salary.annual_ctc),
        basicSalary: Number(salary.basic_salary || 0),
        hra: Number(salary.hra_monthly || 0),
        monthlyRent: Number(salary.monthly_rent || 0),
        isMetroCity: salary.is_metro_city || false,
        lta: Number(salary.lta_annual || 0),
        epfEmployeePct: Number(salary.epf_employee_pct || 12),
        hasEmployerNPS: salary.has_employer_nps || false,
        employerNPSPct: Number(salary.employer_nps_pct || 0),
        isRenting: life?.is_renting || false,
        homeLoanInterest: Number(life?.home_loan_interest_annual || 0),
        homeLoanPrincipal: Number(life?.home_loan_principal_annual || 0),
        hasSeniorParents: life?.has_senior_parents || false,
        selfHealthPremium: Number(life?.self_health_premium || 0),
        familyHealthPremium: Number(life?.family_health_premium || 0),
        parentHealthPremium: Number(life?.parent_health_premium || 0),
        ppf: Number(inv?.ppf_annual || 0),
        lic: Number(inv?.lic_premium_annual || 0),
        elss: Number(inv?.elss_annual || 0),
        nsc: Number(inv?.nsc_annual || 0),
        ssy: Number(inv?.ssy_annual || 0),
        tuition: Number(inv?.tuition_fees || 0),
        nps: Number(inv?.nps_employee_annual || 0),
        other80C: Number(inv?.other_80c_annual || 0),
      }
    }

    // Compute OLD regime
    const gross = taxInputs.annualCTC
    const epfAnnual = Math.round(gross * (taxInputs.epfEmployeePct || 12) / 100)
    const section80C = Math.min(
      (taxInputs.ppf || 0) + (taxInputs.lic || 0) + (taxInputs.elss || 0) +
      (taxInputs.nsc || 0) + (taxInputs.ssy || 0) + (taxInputs.tuition || 0) +
      epfAnnual + (taxInputs.other80C || 0) + (taxInputs.homeLoanPrincipal || 0),
      150000
    )

    // HRA exemption
    let hraExemption = 0
    if (taxInputs.isRenting && taxInputs.monthlyRent > 0) {
      const annualRent = taxInputs.monthlyRent * 12
      const basic = taxInputs.basicSalary * 12
      const hra = taxInputs.hra * 12
      const metroPercent = taxInputs.isMetroCity ? 0.50 : 0.40
      hraExemption = Math.min(hra, Math.max(0, annualRent - basic * 0.10), basic * metroPercent)
    }

    const self80D = Math.min((taxInputs.selfHealthPremium || 0) + (taxInputs.familyHealthPremium || 0), 25000)
    const parent80D = Math.min(taxInputs.parentHealthPremium || 0, taxInputs.hasSeniorParents ? 50000 : 25000)
    const nps80CCD1B = Math.min(taxInputs.nps || 0, 50000)
    const section24b = Math.min(taxInputs.homeLoanInterest || 0, 200000)

    const oldTotalDed = section80C + self80D + parent80D + nps80CCD1B + hraExemption + section24b + FY_2025_26.old.standardDeduction
    const oldTaxable = Math.max(0, gross - oldTotalDed)
    let oldTax = computeTaxFromSlabs(oldTaxable, FY_2025_26.old.slabs)
    if (oldTaxable <= FY_2025_26.old.rebate87A.limit) oldTax = Math.max(0, oldTax - FY_2025_26.old.rebate87A.rebate)
    const oldCess = oldTax * FY_2025_26.cessRate
    const oldTotal = oldTax + oldCess

    // NEW regime
    const employer80CCD2 = taxInputs.hasEmployerNPS ? Math.min(Math.floor(gross * taxInputs.employerNPSPct / 100), Math.floor(gross * 0.14)) : 0
    const newTotalDed = FY_2025_26.new.standardDeduction + employer80CCD2
    const newTaxable = Math.max(0, gross - newTotalDed)
    let newTax = computeTaxFromSlabs(newTaxable, FY_2025_26.new.slabs)
    if (newTaxable <= FY_2025_26.new.rebate87A.limit) newTax = Math.max(0, newTax - FY_2025_26.new.rebate87A.rebate)
    const newCess = newTax * FY_2025_26.cessRate
    const newTotal = newTax + newCess

    const recommended = oldTotal <= newTotal ? 'old' : 'new'
    const savingsDelta = Math.abs(oldTotal - newTotal)

    const oldResult = {
      regime: 'old', grossIncome: gross, totalDeductions: oldTotalDed,
      taxableIncome: oldTaxable, taxBeforeCess: oldTax, cess: oldCess,
      totalTax: oldTotal, monthlyTDS: Math.round(oldTotal / 12),
    }
    const newResult = {
      regime: 'new', grossIncome: gross, totalDeductions: newTotalDed,
      taxableIncome: newTaxable, taxBeforeCess: newTax, cess: newCess,
      totalTax: newTotal, monthlyTDS: Math.round(newTotal / 12),
    }

    const deductions = {
      section80C, self80D, parent80D, nps80CCD1B, hraExemption, section24b,
      standardDeduction: FY_2025_26.old.standardDeduction,
    }

    // Insert into tax_calculations (trigger handles versioning)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: taxCalc, error: calcError } = await serviceClient
      .from('tax_calculations')
      .insert({
        user_id,
        financial_year,
        inputs_snapshot: taxInputs,
        old_regime_result: oldResult,
        new_regime_result: newResult,
        recommended_regime: recommended,
        savings_delta: savingsDelta,
        deductions_detail: deductions,
        tax_law_version: 'FY2025-26-v1',
        trigger_reason: trigger_reason || 'initial',
      })
      .select()
      .single()

    if (calcError) {
      console.error('Tax calc insert error:', calcError)
      return new Response(
        JSON.stringify({ error: 'Failed to store calculation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate investment plan
    const allocations = []
    if (epfAnnual > 0) allocations.push({ instrument: 'EPF', section: '80C', annualAmount: epfAnnual, monthlyAmount: Math.round(epfAnnual / 12), risk: 'low', lockIn: 0, expectedReturn: 8.1 })
    const headroom80C = 150000 - section80C
    if (headroom80C > 0) allocations.push({ instrument: 'ELSS Tax Saver', section: '80C', annualAmount: Math.min(headroom80C, 60000), monthlyAmount: Math.round(Math.min(headroom80C, 60000) / 12), risk: 'high', lockIn: 3, expectedReturn: 12.5 })
    if (self80D > 0) allocations.push({ instrument: 'Health Insurance', section: '80D', annualAmount: self80D, monthlyAmount: Math.round(self80D / 12), risk: 'low', lockIn: 1, expectedReturn: 0 })

    const totalAnnual = allocations.reduce((s, a) => s + a.annualAmount, 0)

    await serviceClient.from('investment_plans').insert({
      user_id,
      tax_calculation_id: taxCalc.id,
      financial_year,
      allocations,
      monthly_plan: [],
      total_annual_investment: totalAnnual,
      projected_tax_saving: savingsDelta,
      section_80c_used: section80C,
      section_80d_used: self80D + parent80D,
      nps_used: nps80CCD1B,
    })

    // Audit log
    await serviceClient.from('audit_log').insert({
      user_id,
      action: 'tax.calculated',
      resource_type: 'tax_calculations',
      resource_id: taxCalc.id,
      metadata: { version: taxCalc.version, recommended, savings: savingsDelta, trigger: trigger_reason },
    })

    return new Response(
      JSON.stringify({
        data: { old: oldResult, new: newResult, recommended, savings_delta: savingsDelta, deductions, version: taxCalc.version },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Tax calculate error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
