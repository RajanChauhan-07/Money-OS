/**
 * MONEY OS — New Regime Tax Engine
 * AY 2026-27 (FY 2025-26) | Clean pipeline with full audit trail.
 *
 * New regime rules (u/s 115BAC):
 *  - Standard Deduction: ₹75,000
 *  - Employer NPS 80CCD(2): capped at 14% of basic salary
 *  - 80CCH (Agnipath): fully deductible
 *  - ALL other deductions: NOT allowed (no 80C, 80D, HRA, 24b, etc.)
 *  - 87A Rebate: up to ₹12L taxable income, ₹60,000 rebate (with marginal relief)
 *  - Surcharge: capped at 25% (not 37%)
 *  - Same slabs for ALL age groups
 */

import type { TaxInput, RegimeResult, DeductionItem, AuditStep } from '@money-os/types'
import { FY_2025_26 } from './slabs'
import { computeTaxFromSlabs, calculateSurcharge, calculate87ARebate, roundTax, getMarginalRate, formatAuditAmount } from './utils'

export function computeNewRegime(input: TaxInput): RegimeResult {
  const gross = input.salary.annualCTC
  const { structure, employer } = input
  const limits = FY_2025_26.deductionLimits

  // Standard Deduction — only allowed deduction for employees (₹75,000)
  const standardDeduction = FY_2025_26.new.standardDeduction

  // 80CCD(2) — Employer NPS ONLY (capped at 14% of basic salary)
  let employer80CCD2 = 0
  if (employer.hasEmployerNPS && employer.employerNPSPercent > 0 && structure.basicSalary > 0) {
    const annualBasic = structure.basicSalary * 12
    const employerContribution = annualBasic * (employer.employerNPSPercent / 100)
    const maxAllowed = annualBasic * limits.section80CCD2_pct // 14% of basic
    employer80CCD2 = Math.min(employerContribution, maxAllowed)
  }

  const totalDed = standardDeduction + employer80CCD2
  const taxable = Math.max(0, gross - totalDed)

  // Pipeline:
  // 1. Base Tax (slab-wise — new regime AY 2026-27 slabs)
  const baseTax = computeTaxFromSlabs(taxable, FY_2025_26.new.slabs)

  // 2. Surcharge (capped at 25% for new regime)
  const surcharge = calculateSurcharge(taxable, baseTax, 'new')
  const taxAfterSurcharge = baseTax + surcharge

  // 3. Section 87A Rebate (limit: ₹12L, rebate: ₹60K, with marginal relief)
  const rebate = calculate87ARebate(taxable, taxAfterSurcharge, 'new')
  const taxAfterRebate = Math.max(0, taxAfterSurcharge - rebate)

  // 4. Health & Education Cess (4%)
  const cess = taxAfterRebate * FY_2025_26.cessRate

  // 5. Total (rounded to nearest ₹10)
  const total = roundTax(taxAfterRebate + cess)

  // Build deduction breakdown (minimal — only 2 items)
  const breakdown: DeductionItem[] = [
    {
      section: 'Standard Deduction',
      label: 'Standard Deduction (New Regime)',
      amount: standardDeduction,
      limit: standardDeduction,
      headroom: 0,
      confidence: 'declared',
    },
  ]
  if (employer.hasEmployerNPS) {
    const maxCCD2 = structure.basicSalary * 12 * limits.section80CCD2_pct
    breakdown.push({
      section: '80CCD(2)',
      label: 'Employer NPS Contribution [u/s 80CCD(2)]',
      amount: employer80CCD2,
      limit: maxCCD2,
      headroom: Math.max(0, maxCCD2 - employer80CCD2),
      confidence: 'declared',
    })
  }

  // Build audit trail
  const auditTrail: AuditStep[] = buildNewRegimeAuditTrail(
    gross, standardDeduction, employer80CCD2, taxable,
    baseTax, surcharge, rebate, cess, total
  )

  return {
    regime: 'new',
    grossIncome: gross,
    totalDeductions: totalDed,
    taxableIncome: taxable,
    taxBeforeSurcharge: baseTax,
    surcharge,
    taxBeforeRebate: taxAfterSurcharge,
    rebate87A: rebate,
    taxBeforeCess: taxAfterRebate,
    cess,
    totalTax: total,
    monthlyTDS: Math.round(total / 12),
    annualTakeHome: gross - total,
    monthlyTakeHome: Math.round((gross - total) / 12),
    effectiveTaxRate: gross > 0 ? (total / gross) * 100 : 0,
    marginalRate: getMarginalRate(taxable, 'new'),
    deductionBreakdown: breakdown,
    auditTrail,
  }
}

function buildNewRegimeAuditTrail(
  gross: number,
  standardDeduction: number,
  employer80CCD2: number,
  taxable: number,
  baseTax: number,
  surcharge: number,
  rebate: number,
  cess: number,
  totalTax: number,
): AuditStep[] {
  const trail: AuditStep[] = []
  let step = 1
  let running = gross

  trail.push({ step: step++, label: 'Gross Salary (CTC)', amount: gross, running, formula: formatAuditAmount(gross), isDeduction: false })

  const prevStd = running
  running -= standardDeduction
  trail.push({ step: step++, label: 'Less: Standard Deduction [u/s 16(ia)]', amount: standardDeduction, running, formula: `${formatAuditAmount(prevStd)} − ${formatAuditAmount(standardDeduction)} = ${formatAuditAmount(running)}`, isDeduction: true })

  if (employer80CCD2 > 0) {
    const prev = running
    running -= employer80CCD2
    trail.push({ step: step++, label: 'Less: Employer NPS [u/s 80CCD(2)]', amount: employer80CCD2, running, formula: `${formatAuditAmount(prev)} − ${formatAuditAmount(employer80CCD2)} = ${formatAuditAmount(running)}`, isDeduction: true })
  }

  running = taxable
  trail.push({ step: step++, label: 'Net Taxable Income', amount: taxable, running, formula: formatAuditAmount(taxable), isDeduction: false })
  trail.push({
    step: step++,
    label: 'Income Tax (New Regime slabs)',
    amount: baseTax,
    running: baseTax,
    formula: formatAuditAmount(baseTax),
    isDeduction: false
  })

  if (surcharge > 0) {
    running = baseTax + surcharge
    trail.push({ step: step++, label: 'Add: Surcharge (max 25% in New Regime)', amount: surcharge, running, formula: `${formatAuditAmount(baseTax)} + ${formatAuditAmount(surcharge)}`, isDeduction: false })
  }
  if (rebate > 0) {
    running = baseTax + surcharge - rebate
    trail.push({ step: step++, label: 'Less: Section 87A Rebate (≤ ₹12L income, max ₹60K)', amount: rebate, running, formula: formatAuditAmount(running), isDeduction: true })
  }
  const taxBeforeCess = baseTax + surcharge - rebate
  trail.push({ step: step++, label: 'Add: Health & Education Cess (4%)', amount: cess, running: taxBeforeCess + cess, formula: `${formatAuditAmount(taxBeforeCess)} × 4% = ${formatAuditAmount(cess)}`, isDeduction: false })
  trail.push({ step: step++, label: '★ Total Tax Payable', amount: totalTax, running: totalTax, formula: formatAuditAmount(totalTax), isDeduction: false })

  return trail
}
