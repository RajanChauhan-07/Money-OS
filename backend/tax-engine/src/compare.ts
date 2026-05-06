/**
 * MONEY OS — Scenario & Comparison Engine
 * The brain of the system.
 * 
 * Modes:
 *  1. current   — exact user input, both regimes
 *  2. optimized — maximum deductions filled, both regimes
 *  3. custom    — user-defined slider state, both regimes (what-if)
 * 
 * Each mode returns a full TaxComparisonResult with:
 *  - regime comparison
 *  - recommendation
 *  - insights
 *  - deduction breakdown
 *  - switch strategy
 *  - break-even monthly investment
 */

import type { TaxInput, TaxComparisonResult, ScenarioEngineResult, WhatIfState } from '@money-os/types'
import { computeOldRegime, computeDeductions } from './old-regime'
import { computeNewRegime } from './new-regime'
import { optimizeInput } from './planner'
import { generateInsights } from './insights'
import { generateRecommendations, computeBreakEvenMonthlyInvestment } from './recommendations'

function rupees(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`
  return `₹${Math.round(n)}`
}

// ── Core comparison for a given TaxInput state ─────────────────────────────
function buildComparison(
  input: TaxInput,
  scenarioMode: 'current' | 'optimized' | 'custom',
  // Needed for loss-meter: the min possible tax (computed once at the top)
  absoluteMinTax?: number,
  taxWithZeroDeds?: number,
): TaxComparisonResult {
  const old = computeOldRegime(input)
  const newR = computeNewRegime(input)
  const { deductions } = computeDeductions(input)

  const recommended = old.totalTax <= newR.totalTax ? 'old' : 'new'
  const savings = Math.abs(old.totalTax - newR.totalTax)
  const currentBestTax = Math.min(old.totalTax, newR.totalTax)

  // Loss Meter: how much more than theoretical minimum are we paying?
  const lossMeter = absoluteMinTax !== undefined
    ? Math.max(0, currentBestTax - absoluteMinTax)
    : 0

  // Tax Efficiency Score (0-100)
  let taxEfficiencyScore = 100
  if (taxWithZeroDeds !== undefined && absoluteMinTax !== undefined) {
    const maxPossibleSaving = Math.max(1, taxWithZeroDeds - absoluteMinTax)
    const currentSaving = taxWithZeroDeds - currentBestTax
    taxEfficiencyScore = Math.min(100, Math.max(0, Math.round((currentSaving / maxPossibleSaving) * 100)))
  }

  // Build switch strategy message
  const switchStrategy = buildSwitchStrategy(old, newR, savings, input)

  // Break-even monthly investment (only compute for current mode — expensive)
  const breakEvenMonthlyInvestment = scenarioMode === 'current'
    ? computeBreakEvenMonthlyInvestment(input)
    : 0

  // Build reasoning (human-readable)
  const { deductions: ded } = computeDeductions(input)
  const reasons: string[] = []
  if (ded.hraExemption > 50000) reasons.push(`HRA exemption of ${rupees(ded.hraExemption)}`)
  if (ded.section80C >= 100000) reasons.push(`80C investments of ${rupees(ded.section80C)}`)
  if (ded.section80CCD1B > 0) reasons.push(`NPS deduction of ${rupees(ded.section80CCD1B)}`)
  if (ded.section24b > 0) reasons.push(`home loan interest of ${rupees(ded.section24b)}`)

  const reasonText = reasons.length > 0 ? reasons.join(', ') : 'your overall deductions'
  const reasoning = recommended === 'old'
    ? `Old Regime saves you ${rupees(savings)} because your ${reasonText} exceed the flat benefit of the New Regime's lower slab rates.`
    : `New Regime saves you ${rupees(savings)}. Your current deductions (${rupees(ded.section80C + ded.hraExemption + ded.section80CCD1B)}) are not enough to beat the lower slab rates.`

  const result: Omit<TaxComparisonResult, 'insights' | 'recommendations'> = {
    old,
    new: newR,
    recommendedRegime: recommended,
    savingsWithRecommended: savings,
    deductions: ded,
    reasoning,
    taxEfficiencyScore,
    lossMeter,
    switchStrategy,
    breakEvenMonthlyInvestment,
  }

  // Insights and recommendations need the full result object
  // We pass a partial result and it generates dynamically
  const partialResult = result as TaxComparisonResult
  const insights = generateInsights(input, partialResult)

  return {
    ...result,
    insights,
    recommendations: [], // Will be filled by runScenarioEngine
  }
}

function buildSwitchStrategy(
  oldResult: ReturnType<typeof computeOldRegime>,
  newResult: ReturnType<typeof computeNewRegime>,
  savings: number,
  input: TaxInput,
): string {
  if (oldResult.totalTax <= newResult.totalTax) {
    return `Stay in Old Regime. Your deductions are strong enough to save ${rupees(savings)} vs New Regime.`
  }
  const breakEven = computeBreakEvenMonthlyInvestment(input)
  if (breakEven === 0 || breakEven > 25000) {
    return `New Regime is clearly better. You'd need very high investments to justify switching.`
  }
  return `Stay in New Regime unless you can invest ${rupees(breakEven)}/month in 80C — then Old Regime becomes better by ${rupees(savings)}.`
}

// ── Build a "zero deductions" baseline for efficiency scoring ─────────────
function buildZeroDeductionsInput(input: TaxInput): TaxInput {
  return {
    ...input,
    investments: {
      ppfAnnual: 0,
      licPremiumAnnual: 0,
      elssAnnual: 0,
      nscAnnual: 0,
      ssyAnnual: 0,
      tuitionFees: 0,
      epfEmployee: 0,
      npsEmployee: 0,
      otherSection80C: 0,
    },
    life: {
      ...input.life,
      selfHealthPremium: 0,
      familyHealthPremium: 0,
      parentHealthPremium: 0,
      hasHomeLoan: false,
      isRenting: false,
      hasDisabledDependent: false,
      medicalTreatmentExpense: 0,
      educationLoanInterest: 0,
      section80EEInterest: 0,
      section80EEAInterest: 0,
      evLoanInterest: 0,
      donations100pct: 0,
      donations50pct: 0,
      section80GGRent: 0,
      savingsInterest: 0,
      depositInterest: 0,
      hasSelfDisability: false,
    },
    ltaClaimed: false,
  }
}

// ── Main Scenario Engine ───────────────────────────────────────────────────
export function runScenarioEngine(input: TaxInput): ScenarioEngineResult {
  // Pre-compute baselines for loss meter & efficiency score
  const optimizedInput = optimizeInput(input)
  const optOld = computeOldRegime(optimizedInput)
  const optNew = computeNewRegime(optimizedInput)
  const absoluteMinTax = Math.min(optOld.totalTax, optNew.totalTax)

  const zeroDedInput = buildZeroDeductionsInput(input)
  const zeroOld = computeOldRegime(zeroDedInput)
  const zeroNew = computeNewRegime(zeroDedInput)
  const taxWithZeroDeds = Math.min(zeroOld.totalTax, zeroNew.totalTax)

  // Run all 3 scenarios
  const current = buildComparison(input, 'current', absoluteMinTax, taxWithZeroDeds)
  const optimized = buildComparison(optimizedInput, 'optimized', absoluteMinTax, taxWithZeroDeds)

  // Recommendations use both current + optimized together
  const recommendations = generateRecommendations(input, { current, optimized, bestScenario: 'current' })
  current.recommendations = recommendations
  optimized.recommendations = recommendations

  const bestScenario: 'current' | 'optimized' = current.lossMeter > 500 ? 'optimized' : 'current'

  return { current, optimized, bestScenario }
}

// ── What-If Scenario (custom slider state) ────────────────────────────────
export function runWhatIfScenario(input: TaxInput, whatIf: WhatIfState): TaxComparisonResult {
  // Merge what-if values into the input
  const modifiedInput: TaxInput = {
    ...input,
    investments: {
      ...input.investments,
      otherSection80C: Math.max(0, whatIf.section80C - (
        (input.investments.epfEmployee || 0) +
        (input.investments.elssAnnual || 0) +
        (input.investments.ppfAnnual || 0) +
        (input.investments.licPremiumAnnual || 0) +
        (input.investments.nscAnnual || 0) +
        (input.investments.tuitionFees || 0) +
        (input.investments.otherSection80C || 0)
      )),
      npsEmployee: whatIf.nps,
    },
    structure: {
      ...input.structure,
      monthlyRent: whatIf.monthlyRent,
    },
    life: {
      ...input.life,
      selfHealthPremium: whatIf.section80D_self,
      parentHealthPremium: whatIf.section80D_parents,
      homeLoanInterestAnnual: whatIf.homeLoanInterest,
      isRenting: whatIf.monthlyRent > 0,
    },
  }

  return buildComparison(modifiedInput, 'custom')
}

// ── Legacy compareTaxRegimes (kept for backward compat) ───────────────────
export function compareTaxRegimes(input: TaxInput): TaxComparisonResult {
  return buildComparison(input, 'current')
}
