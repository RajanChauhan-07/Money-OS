/**
 * MONEY OS — Tax Engine Utility Functions
 * AY 2026-27 | Pure math helpers — no business logic.
 */

import { FY_2025_26, type TaxSlab, type AgeCategory } from './slabs'

// ── Slab-based tax computation ─────────────────────────────────────────────
export function computeTaxFromSlabs(taxableIncome: number, slabs: readonly TaxSlab[]): number {
  let tax = 0
  for (const slab of slabs) {
    if (taxableIncome <= slab.min) break
    const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min
    tax += taxableInSlab * slab.rate
  }
  return tax
}

// ── Get Old Regime slabs by age category ───────────────────────────────────
export function getOldRegimeSlabs(ageCategory: AgeCategory = 'below60'): readonly TaxSlab[] {
  return FY_2025_26.old.slabsByAge[ageCategory]
}

// ── Surcharge calculation (regime-specific) ────────────────────────────────
// Includes marginal relief logic per government rules
export function calculateSurcharge(
  taxableIncome: number,
  baseTax: number,
  regime: 'old' | 'new'
): number {
  const rules = FY_2025_26.surcharge[regime]
  // Pick the highest bracket that applies
  const rule = [...rules].reverse().find(r => taxableIncome > r.min)
  if (!rule) return 0

  const rawSurcharge = baseTax * rule.rate

  // Marginal relief: tax + surcharge should not exceed
  // tax on threshold + excess income over threshold
  const threshold = rule.min
  const thresholdTax = computeTaxFromSlabs(threshold,
    regime === 'new' ? FY_2025_26.new.slabs : FY_2025_26.old.slabs
  )
  const excessIncome = taxableIncome - threshold
  const maxTaxWithSurcharge = thresholdTax + excessIncome

  if (baseTax + rawSurcharge > maxTaxWithSurcharge) {
    // Apply marginal relief
    return Math.max(0, maxTaxWithSurcharge - baseTax)
  }

  return rawSurcharge
}

// ── Section 87A Rebate ────────────────────────────────────────────────────
// AY 2026-27:
//   New Regime: ₹60,000 rebate if taxable income ≤ ₹12,00,000
//              with marginal relief up to ~₹12,75,000
//   Old Regime: ₹12,500 rebate if taxable income ≤ ₹5,00,000
export function calculate87ARebate(
  taxableIncome: number,
  taxBeforeRebate: number,
  regime: 'old' | 'new'
): number {
  const rule = FY_2025_26[regime].rebate87A

  // Above the marginal relief ceiling — no rebate at all
  if (taxableIncome > rule.marginalReliefLimit) return 0

  // Below the hard limit — full rebate (capped at tax itself)
  if (taxableIncome <= rule.limit) {
    return Math.min(taxBeforeRebate, rule.rebate)
  }

  // Marginal Relief zone (income between limit and marginalReliefLimit)
  // Ensures tax never exceeds the extra income over the rebate limit
  const excessIncomeOverLimit = taxableIncome - rule.limit
  // Tax should not exceed the extra income earned above the limit
  if (taxBeforeRebate > excessIncomeOverLimit) {
    return taxBeforeRebate - excessIncomeOverLimit
  }

  return 0
}

// ── Income Tax rounding (IT Act: round to nearest ₹10) ──────────────────────
export function roundTax(amount: number): number {
  return Math.round(amount / 10) * 10
}

// ── Format number with Indian comma system ─────────────────────────────────
export function formatAuditAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

// ── Marginal tax rate from slab ────────────────────────────────────────────
export function getMarginalRate(
  taxableIncome: number,
  regime: 'old' | 'new',
  ageCategory: AgeCategory = 'below60'
): number {
  const slabs = regime === 'new'
    ? FY_2025_26.new.slabs
    : FY_2025_26.old.slabsByAge[ageCategory]
  const slab = [...slabs].reverse().find(s => taxableIncome > s.min)
  return slab ? slab.rate * 100 : 0
}
