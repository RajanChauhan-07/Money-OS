/**
 * MONEY OS — Old Regime Tax Engine
 * AY 2026-27 | Clean pipeline: Gross → Exemptions → Deductions → Taxable → Slabs → Rebate → Cess
 *
 * Supports ALL deduction sections per government source:
 * 80C/80CCC/80CCD(1), 80CCD(1B), 80CCD(2), 80D, 80DD, 80DDB, 80E, 80EE, 80EEA,
 * 80EEB, 80G, 80GG, 80TTA, 80TTB, 80U, 24b, HRA, LTA, Standard Deduction, Professional Tax
 *
 * Age-based slabs: below60, senior (60-80), superSenior (80+)
 */

import type { TaxInput, RegimeResult, TaxDeductions, DeductionItem, AuditStep } from '@money-os/types'
import { FY_2025_26 } from './slabs'
import type { AgeCategory } from './slabs'
import { computeTaxFromSlabs, getOldRegimeSlabs, calculateSurcharge, calculate87ARebate, roundTax, getMarginalRate, formatAuditAmount } from './utils'

// ── Step 1a: HRA Exemption ─────────────────────────────────────────────────
// Actual exemption = MIN(HRA received, Rent paid - 10% of basic, 50%/40% of basic)
export function computeHRAExemption(input: TaxInput): number {
  const { structure, life } = input
  if (!life.isRenting || structure.monthlyRent <= 0 || structure.hra <= 0) return 0

  const annualRent = structure.monthlyRent * 12
  const annualBasic = structure.basicSalary * 12
  const annualHRA = structure.hra * 12
  const metroPercent = structure.isMetroCity ? 0.50 : 0.40

  const rentMinusTenPercent = Math.max(0, annualRent - annualBasic * 0.10)

  return Math.min(annualHRA, rentMinusTenPercent, annualBasic * metroPercent)
}

// ── Step 1b: LTA Exemption ─────────────────────────────────────────────────
export function computeLTAExemption(input: TaxInput): number {
  if (!input.ltaClaimed || input.structure.lta <= 0) return 0
  return input.structure.lta * 12
}

// ── Step 2: Professional Tax ───────────────────────────────────────────────
export function computeProfessionalTax(input: TaxInput): number {
  return (input.structure.professionalTaxMonthly || 0) * 12
}

// ── Step 3: All Chapter VI-A Deductions ───────────────────────────────────
export function computeDeductions(input: TaxInput): {
  deductions: TaxDeductions
  breakdown: DeductionItem[]
} {
  const { investments, life, employer, salary, structure } = input
  const limits = FY_2025_26.deductionLimits
  const ageCategory: AgeCategory = input.ageCategory || 'below60'
  const isSenior = ageCategory === 'senior' || ageCategory === 'superSenior'

  // ── Section 80C — all eligible investments, capped at ₹1.5L ──────────
  const raw80C = (investments.ppfAnnual || 0) +
    (investments.licPremiumAnnual || 0) +
    (investments.elssAnnual || 0) +
    (investments.nscAnnual || 0) +
    (investments.taxSavingFDAnnual || 0) +
    (investments.scssAnnual || 0) +
    (investments.ssyAnnual || 0) +
    (investments.tuitionFees || 0) +
    (investments.epfEmployee || 0) +
    (investments.otherSection80C || 0) +
    (life.homeLoanPrincipalAnnual || 0)
  const section80C = Math.min(raw80C, limits.section80C)

  // ── Section 80D — Health Insurance ────────────────────────────────────
  const selfLimit = isSenior ? limits.section80D_self_senior : limits.section80D_self
  const self80DRaw = (life.selfHealthPremium || 0) + (life.familyHealthPremium || 0)
  const self80D = Math.min(self80DRaw, selfLimit)
  const parentLimit = life.hasSeniorParents ? limits.section80D_parents_senior : limits.section80D_parents
  const parent80D = Math.min(life.parentHealthPremium || 0, parentLimit)

  // ── Section 80CCD(1B) — Extra NPS ────────────────────────────────────
  const section80CCD1B = Math.min(investments.npsEmployee || 0, limits.section80CCD1B)

  // ── Section 80CCD(2) — Employer NPS ──────────────────────────────────
  let section80CCD2 = 0
  if (employer.hasEmployerNPS && structure.basicSalary > 0) {
    const annualBasic = structure.basicSalary * 12
    const employerContribution = employer.employerNPSMonthly 
      ? employer.employerNPSMonthly * 12 
      : annualBasic * ((employer.employerNPSPercent || 0) / 100)
    
    const maxAllowed = annualBasic * limits.section80CCD2_pct
    section80CCD2 = Math.min(employerContribution, maxAllowed)
  }

  // ── Section 24b — Home Loan Interest ──────────────────────────────────
  const interestCap = life.propertyType === 'Let-out' ? limits.section24b_letout : limits.section24b
  const section24b = life.propertyType === 'Under construction' ? 0 : Math.min(life.homeLoanInterestAnnual || 0, interestCap)

  // ── Section 80DD — Disabled Dependent ─────────────────────────────────
  let section80DD = 0
  if (life.hasDisabledDependent) {
    section80DD = life.disabilityType === 'severe' ? limits.section80DD_severe : limits.section80DD
  }

  // ── Section 80DDB — Medical Treatment ─────────────────────────────────
  let section80DDB = 0
  if (life.medicalTreatmentExpense && life.medicalTreatmentExpense > 0) {
    const ddbLimit = isSenior ? limits.section80DDB_senior : limits.section80DDB
    section80DDB = Math.min(life.medicalTreatmentExpense, ddbLimit)
  }

  // ── Section 80E — Education Loan Interest ─────────────────────────────
  const section80E = life.educationLoanInterest || 0 // No upper limit

  // ── Section 80EE — Housing Loan Interest (2016-17 sanctions) ──────────
  const section80EE = Math.min(life.section80EEInterest || 0, limits.section80EE)

  // ── Section 80EEA — Housing Loan Interest (2019-22 sanctions) ─────────
  const section80EEA = Math.min(life.section80EEAInterest || 0, limits.section80EEA)

  // ── Section 80EEB — EV Loan Interest ──────────────────────────────────
  const section80EEB = Math.min(life.evLoanInterest || 0, limits.section80EEB)

  // ── Section 80G — Donations ───────────────────────────────────────────
  const donations100 = life.donations100pct || 0
  const donations50 = Math.round((life.donations50pct || 0) * 0.5) // 50% deduction
  const section80G = donations100 + donations50

  // ── Section 80GG — Rent (no HRA in salary) ────────────────────────────
  let section80GG = 0
  if (life.section80GGRent && life.section80GGRent > 0 && structure.hra <= 0) {
    const gross = salary.annualCTC
    const rentPaid = life.section80GGRent * 12
    const option1 = Math.max(0, rentPaid - gross * 0.10) // rent - 10% of total income
    const option2 = limits.section80GG_monthly * 12 // ₹5,000/month = ₹60,000/year
    const option3 = gross * limits.section80GG_pct // 25% of total income
    section80GG = Math.min(option1, option2, option3)
  }

  // ── Section 80TTA — Savings Interest (non-senior) ─────────────────────
  let section80TTA = 0
  if (!isSenior && life.savingsInterest && life.savingsInterest > 0) {
    section80TTA = Math.min(life.savingsInterest, limits.section80TTA)
  }

  // ── Section 80TTB — Deposit Interest (senior only) ────────────────────
  let section80TTB = 0
  if (isSenior && life.depositInterest && life.depositInterest > 0) {
    section80TTB = Math.min(life.depositInterest, limits.section80TTB)
  }

  // ── Section 80U — Self Disability ─────────────────────────────────────
  let section80U = 0
  if (life.hasSelfDisability) {
    section80U = life.selfDisabilityType === 'severe' ? limits.section80U_severe : limits.section80U
  }

  // ── HRA Exemption ────────────────────────────────────────────────────
  const hraExemption = computeHRAExemption(input)

  // ── LTA Exemption ────────────────────────────────────────────────────
  const ltaExemption = computeLTAExemption(input)

  // ── Standard Deduction (old regime: ₹50K) ────────────────────────────
  const standardDeduction = FY_2025_26.old.standardDeduction

  // ── Professional Tax ─────────────────────────────────────────────────
  const professionalTax = computeProfessionalTax(input)

  const deductions: TaxDeductions = {
    section80C,
    section80CMax: limits.section80C,
    section80D_self: self80D,
    section80D_parents: parent80D,
    section80D_max_self: selfLimit,
    section80D_max_parents: parentLimit,
    section80CCD1B,
    section80CCD2,
    hraExemption,
    ltaExemption,
    section24b,
    professionalTax,
    standardDeduction,
    section80DD,
    section80DDB,
    section80E,
    section80EE,
    section80EEA,
    section80EEB,
    section80G,
    section80GG,
    section80TTA,
    section80TTB,
    section80U,
    otherDeductions: 0,
  }

  // Build per-section breakdown with headroom
  const breakdown: DeductionItem[] = []

  if (hraExemption > 0 || structure.hra > 0) {
    breakdown.push({
      section: 'HRA',
      label: 'House Rent Allowance Exemption',
      amount: hraExemption,
      limit: structure.hra * 12,
      headroom: Math.max(0, structure.hra * 12 - hraExemption),
      confidence: hraExemption > 0 ? 'declared' : 'eligible',
    })
  }

  if (ltaExemption > 0) {
    breakdown.push({
      section: 'LTA',
      label: 'Leave Travel Allowance',
      amount: ltaExemption,
      limit: structure.lta * 12,
      headroom: 0,
      confidence: 'declared',
    })
  }

  breakdown.push({
    section: 'Standard Deduction',
    label: 'Standard Deduction (Old Regime)',
    amount: standardDeduction,
    limit: standardDeduction,
    headroom: 0,
    confidence: 'declared',
  })

  breakdown.push({
    section: 'Professional Tax',
    label: 'Professional Tax (u/s 16(iii))',
    amount: professionalTax,
    limit: limits.professionalTax,
    headroom: 0,
    confidence: 'assumed',
  })

  breakdown.push({
    section: '80C',
    label: buildSection80CLabel(investments, life),
    amount: section80C,
    limit: limits.section80C,
    headroom: Math.max(0, limits.section80C - section80C),
    confidence: raw80C > 0 ? 'declared' : 'eligible',
  })

  if (self80D > 0 || self80DRaw === 0) {
    breakdown.push({
      section: '80D (Self)',
      label: 'Health Insurance — Self & Family',
      amount: self80D,
      limit: selfLimit,
      headroom: Math.max(0, selfLimit - self80D),
      confidence: self80D > 0 ? 'declared' : 'eligible',
    })
  }

  if (life.hasSeniorParents || parent80D > 0) {
    breakdown.push({
      section: '80D (Parents)',
      label: `Health Insurance — Parents${life.hasSeniorParents ? ' (Senior Citizens)' : ''}`,
      amount: parent80D,
      limit: parentLimit,
      headroom: Math.max(0, parentLimit - parent80D),
      confidence: parent80D > 0 ? 'declared' : 'eligible',
    })
  }

  if (section80CCD1B > 0 || investments.npsEmployee === 0) {
    breakdown.push({
      section: '80CCD(1B)',
      label: 'Employee NPS Contribution (Extra ₹50K)',
      amount: section80CCD1B,
      limit: limits.section80CCD1B,
      headroom: Math.max(0, limits.section80CCD1B - section80CCD1B),
      confidence: section80CCD1B > 0 ? 'declared' : 'eligible',
    })
  }

  if (employer.hasEmployerNPS || section80CCD2 > 0) {
    const maxCCD2 = structure.basicSalary * 12 * limits.section80CCD2_pct
    breakdown.push({
      section: '80CCD(2)',
      label: 'Employer NPS Contribution',
      amount: section80CCD2,
      limit: maxCCD2,
      headroom: Math.max(0, maxCCD2 - section80CCD2),
      confidence: 'declared',
    })
  }

  if (life.hasHomeLoan || section24b > 0) {
    breakdown.push({
      section: '24b',
      label: 'Home Loan Interest',
      amount: section24b,
      limit: limits.section24b,
      headroom: Math.max(0, limits.section24b - section24b),
      confidence: section24b > 0 ? 'declared' : 'eligible',
    })
  }

  // ── Additional sections ──────────────────────────────────────────────
  if (section80DD > 0) {
    breakdown.push({ section: '80DD', label: `Disabled Dependent${life.disabilityType === 'severe' ? ' (Severe)' : ''}`, amount: section80DD, limit: life.disabilityType === 'severe' ? limits.section80DD_severe : limits.section80DD, headroom: 0, confidence: 'declared' })
  }
  if (section80DDB > 0) {
    breakdown.push({ section: '80DDB', label: 'Medical Treatment (Specified Diseases)', amount: section80DDB, limit: isSenior ? limits.section80DDB_senior : limits.section80DDB, headroom: Math.max(0, (isSenior ? limits.section80DDB_senior : limits.section80DDB) - section80DDB), confidence: 'declared' })
  }
  if (section80E > 0) {
    breakdown.push({ section: '80E', label: 'Education Loan Interest', amount: section80E, limit: Infinity, headroom: 0, confidence: 'declared' })
  }
  if (section80EE > 0) {
    breakdown.push({ section: '80EE', label: 'Housing Loan Interest (u/s 80EE)', amount: section80EE, limit: limits.section80EE, headroom: Math.max(0, limits.section80EE - section80EE), confidence: 'declared' })
  }
  if (section80EEA > 0) {
    breakdown.push({ section: '80EEA', label: 'Housing Loan Interest — First-time Buyer', amount: section80EEA, limit: limits.section80EEA, headroom: Math.max(0, limits.section80EEA - section80EEA), confidence: 'declared' })
  }
  if (section80EEB > 0) {
    breakdown.push({ section: '80EEB', label: 'Electric Vehicle Loan Interest', amount: section80EEB, limit: limits.section80EEB, headroom: Math.max(0, limits.section80EEB - section80EEB), confidence: 'declared' })
  }
  if (section80G > 0) {
    breakdown.push({ section: '80G', label: 'Donations to Charitable Institutions', amount: section80G, limit: Infinity, headroom: 0, confidence: 'declared' })
  }
  if (section80GG > 0) {
    breakdown.push({ section: '80GG', label: 'Rent Paid (No HRA in salary)', amount: section80GG, limit: limits.section80GG_monthly * 12, headroom: Math.max(0, limits.section80GG_monthly * 12 - section80GG), confidence: 'declared' })
  }
  if (section80TTA > 0) {
    breakdown.push({ section: '80TTA', label: 'Savings Bank Interest', amount: section80TTA, limit: limits.section80TTA, headroom: Math.max(0, limits.section80TTA - section80TTA), confidence: 'declared' })
  }
  if (section80TTB > 0) {
    breakdown.push({ section: '80TTB', label: 'Deposit Interest (Senior Citizen)', amount: section80TTB, limit: limits.section80TTB, headroom: Math.max(0, limits.section80TTB - section80TTB), confidence: 'declared' })
  }
  if (section80U > 0) {
    breakdown.push({ section: '80U', label: `Self Disability${life.selfDisabilityType === 'severe' ? ' (Severe)' : ''}`, amount: section80U, limit: life.selfDisabilityType === 'severe' ? limits.section80U_severe : limits.section80U, headroom: 0, confidence: 'declared' })
  }

  return { deductions, breakdown }
}

function buildSection80CLabel(investments: TaxInput['investments'], life: TaxInput['life']): string {
  const parts: string[] = []
  if ((investments.epfEmployee || 0) > 0) parts.push('EPF')
  if ((investments.elssAnnual || 0) > 0) parts.push('ELSS')
  if ((investments.ppfAnnual || 0) > 0) parts.push('PPF')
  if ((investments.licPremiumAnnual || 0) > 0) parts.push('LIC')
  if ((investments.nscAnnual || 0) > 0) parts.push('NSC')
  if ((investments.tuitionFees || 0) > 0) parts.push('Tuition Fees')
  if ((life.homeLoanPrincipalAnnual || 0) > 0) parts.push('Home Loan Principal')
  if ((investments.otherSection80C || 0) > 0) parts.push('Other')
  return parts.length > 0 ? parts.join(' + ') : '80C Investments'
}

// ── Build Audit Trail ──────────────────────────────────────────────────────
function buildAuditTrail(
  gross: number,
  deductions: TaxDeductions,
  taxable: number,
  baseTax: number,
  surcharge: number,
  rebate: number,
  cess: number,
  totalTax: number,
): AuditStep[] {
  const trail: AuditStep[] = []
  let running = gross
  let step = 1

  const add = (label: string, amount: number, isDeduction: boolean) => {
    if (amount <= 0) return
    const prev = running
    running = isDeduction ? running - amount : running + amount
    trail.push({
      step: step++,
      label,
      amount,
      running,
      formula: `${formatAuditAmount(prev)} ${isDeduction ? '−' : '+'} ${formatAuditAmount(amount)} = ${formatAuditAmount(running)}`,
      isDeduction,
    })
  }

  trail.push({ step: step++, label: 'Gross Salary (CTC)', amount: gross, running, formula: formatAuditAmount(gross), isDeduction: false })

  // Exemptions
  add('Less: HRA Exemption [u/s 10(13A)]', deductions.hraExemption, true)
  add('Less: LTA Exemption [u/s 10(5)]', deductions.ltaExemption, true)
  add('Less: Standard Deduction [u/s 16(ia)]', deductions.standardDeduction, true)
  add('Less: Professional Tax [u/s 16(iii)]', deductions.professionalTax, true)

  // Chapter VI-A
  add('Less: Section 80C (ELSS/PPF/EPF etc.)', deductions.section80C, true)
  add('Less: Section 80D (Self & Family Health)', deductions.section80D_self, true)
  add('Less: Section 80D (Parents Health)', deductions.section80D_parents, true)
  add('Less: Section 80CCD(1B) — Employee NPS', deductions.section80CCD1B, true)
  add('Less: Section 80CCD(2) — Employer NPS', deductions.section80CCD2, true)
  add('Less: Section 24b — Home Loan Interest', deductions.section24b, true)
  add('Less: Section 80DD — Disabled Dependent', deductions.section80DD, true)
  add('Less: Section 80DDB — Medical Treatment', deductions.section80DDB, true)
  add('Less: Section 80E — Education Loan Interest', deductions.section80E, true)
  add('Less: Section 80EE — Housing Loan Interest', deductions.section80EE, true)
  add('Less: Section 80EEA — First-time Home Buyer', deductions.section80EEA, true)
  add('Less: Section 80EEB — EV Loan Interest', deductions.section80EEB, true)
  add('Less: Section 80G — Donations', deductions.section80G, true)
  add('Less: Section 80GG — Rent (No HRA)', deductions.section80GG, true)
  add('Less: Section 80TTA — Savings Interest', deductions.section80TTA, true)
  add('Less: Section 80TTB — Deposit Interest (Senior)', deductions.section80TTB, true)
  add('Less: Section 80U — Self Disability', deductions.section80U, true)

  running = taxable
  trail.push({ step: step++, label: 'Net Taxable Income', amount: taxable, running, formula: formatAuditAmount(taxable), isDeduction: false })
  trail.push({ step: step++, label: 'Income Tax (Old Regime slabs)', amount: baseTax, running: baseTax, formula: formatAuditAmount(baseTax), isDeduction: false })

  if (surcharge > 0) {
    running = baseTax + surcharge
    trail.push({ step: step++, label: 'Add: Surcharge', amount: surcharge, running, formula: `${formatAuditAmount(baseTax)} + ${formatAuditAmount(surcharge)} = ${formatAuditAmount(running)}`, isDeduction: false })
  }
  if (rebate > 0) {
    running = (baseTax + surcharge) - rebate
    trail.push({ step: step++, label: 'Less: Section 87A Rebate', amount: rebate, running, formula: formatAuditAmount(running), isDeduction: true })
  }
  const taxBeforeCess = baseTax + surcharge - rebate
  running = taxBeforeCess
  trail.push({ step: step++, label: 'Add: Health & Education Cess (4%)', amount: cess, running: taxBeforeCess + cess, formula: `${formatAuditAmount(taxBeforeCess)} × 4% = ${formatAuditAmount(cess)}`, isDeduction: false })
  trail.push({ step: step++, label: '★ Total Tax Payable', amount: totalTax, running: totalTax, formula: formatAuditAmount(totalTax), isDeduction: false })

  return trail
}

// ── Main: Compute Old Regime ───────────────────────────────────────────────
export function computeOldRegime(input: TaxInput): RegimeResult {
  const { salary, structure } = input
  const gross = salary.annualCTC + (structure.bonusAnnual || 0) + ((structure.otherAllowancesMonthly || 0) * 12)
  const ageCategory: AgeCategory = input.ageCategory || 'below60'

  const { deductions, breakdown } = computeDeductions(input)

  const totalDed =
    deductions.hraExemption +
    deductions.ltaExemption +
    deductions.standardDeduction +
    deductions.professionalTax +
    deductions.section80C +
    deductions.section80D_self +
    deductions.section80D_parents +
    deductions.section80CCD1B +
    deductions.section80CCD2 +
    deductions.section24b +
    deductions.section80DD +
    deductions.section80DDB +
    deductions.section80E +
    deductions.section80EE +
    deductions.section80EEA +
    deductions.section80EEB +
    deductions.section80G +
    deductions.section80GG +
    deductions.section80TTA +
    deductions.section80TTB +
    deductions.section80U +
    deductions.otherDeductions

  const taxable = Math.max(0, gross - totalDed)

  // Use age-based slabs
  const slabs = getOldRegimeSlabs(ageCategory)

  // Pipeline:
  // 1. Base Tax (slab-wise — age-appropriate)
  const baseTax = computeTaxFromSlabs(taxable, slabs)

  // 2. Surcharge (regime-specific brackets)
  const surcharge = calculateSurcharge(taxable, baseTax, 'old')
  const taxAfterSurcharge = baseTax + surcharge

  // 3. Section 87A Rebate (with marginal relief logic in utils)
  const rebate = calculate87ARebate(taxable, taxAfterSurcharge, 'old')
  const taxAfterRebate = Math.max(0, taxAfterSurcharge - rebate)

  // 4. Health & Education Cess (4%)
  const cess = taxAfterRebate * FY_2025_26.cessRate

  // 5. Total (rounded to nearest ₹10)
  const total = roundTax(taxAfterRebate + cess)

  const auditTrail = buildAuditTrail(
    gross, deductions, taxable, baseTax, surcharge, rebate, cess, total
  )

  return {
    regime: 'old',
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
    marginalRate: getMarginalRate(taxable, 'old', ageCategory),
    deductionBreakdown: breakdown,
    auditTrail,
  }
}
