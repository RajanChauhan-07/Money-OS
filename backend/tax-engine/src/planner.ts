/**
 * MONEY OS — Investment Planner & Optimizer
 * 
 * Converts tax gaps into actionable monthly investment plans.
 * Respects cash flow constraints and prioritizes highest-impact actions.
 */

import type { TaxInput, TaxComparisonResult, AllocationItem, MonthlyPlan, InvestmentPlan } from '@money-os/types'
import { computeDeductions } from './old-regime'
import { FY_2025_26 } from './slabs'

// ── optimizeInput: fill all deduction gaps ─────────────────────────────────
// Creates a "perfect scenario" input by maxing out all eligible deductions.
export function optimizeInput(input: TaxInput): TaxInput {
  const optimized: TaxInput = JSON.parse(JSON.stringify(input))
  const currentDed = computeDeductions(input).deductions
  const limits = FY_2025_26.deductionLimits

  // Fill 80C gap
  const gap80C = Math.max(0, limits.section80C - currentDed.section80C)
  optimized.investments.otherSection80C = (optimized.investments.otherSection80C || 0) + gap80C

  // Fill 80D gap — self
  const gap80D_self = Math.max(0, limits.section80D_self - (input.life.selfHealthPremium + input.life.familyHealthPremium))
  optimized.life.selfHealthPremium = (optimized.life.selfHealthPremium || 0) + gap80D_self

  // Fill 80D gap — parents
  const parentMax = input.life.hasSeniorParents ? limits.section80D_parents_senior : limits.section80D_parents
  const gap80D_parents = Math.max(0, parentMax - (input.life.parentHealthPremium || 0))
  optimized.life.parentHealthPremium = (optimized.life.parentHealthPremium || 0) + gap80D_parents

  // Fill NPS 80CCD(1B) gap
  const gapNPS = Math.max(0, limits.section80CCD1B - currentDed.section80CCD1B)
  optimized.investments.npsEmployee = (optimized.investments.npsEmployee || 0) + gapNPS

  // Ensure HRA is claimed if component exists
  if (optimized.structure.hra > 0 && !optimized.life.isRenting) {
    // Don't force rent — we can't know what they'd pay
    // Just flag in insights
  }

  return optimized
}

// ── Months remaining in current Indian FY ─────────────────────────────────
// Indian FY: April 1 – March 31
function monthsRemainingInFY(fromDate: Date = new Date()): number {
  const month = fromDate.getMonth() // 0=Jan, 3=Apr
  // FY ends March 31. Current month in FY terms: Apr=0, May=1, ... Mar=11
  const fyMonth = month >= 3 ? month - 3 : month + 9  // 0-based FY month
  return Math.max(1, 12 - fyMonth)
}

// ── Generate Investment Plan ───────────────────────────────────────────────
export function generateInvestmentPlan(
  result: TaxComparisonResult,
  monthlyAffordabilityCap?: number,  // Optional: max monthly investment user can afford
): InvestmentPlan {
  const allocations: AllocationItem[] = []
  const { deductions } = result
  const limits = FY_2025_26.deductionLimits

  const now = new Date()
  const monthsLeft = monthsRemainingInFY(now)

  // Recommended regime drives the marginal rate for tax-saving calculations
  const marginalRatePct = result.recommendedRegime === 'old' ? result.old.marginalRate : result.new.marginalRate
  const marginalRate = marginalRatePct / 100
  const cessMultiplier = 1 + FY_2025_26.cessRate // 1.04

  let priority = 1

  // Only recommend old-regime deductions if it's the recommended regime
  if (result.recommendedRegime === 'old') {
    // ── 1. 80C Gap — ELSS (highest priority, best returns) ─────────────
    const gap80C = Math.max(0, limits.section80C - deductions.section80C)
    if (gap80C > 500) {
      const monthlyRaw = gap80C / monthsLeft
      const monthly = Math.ceil(monthlyRaw / 100) * 100 // round up to nearest ₹100
      const taxSaving = Math.round(gap80C * marginalRate * cessMultiplier)
      allocations.push({
        instrument: 'ELSS Mutual Funds',
        section: '80C',
        annualAmount: gap80C,
        monthlyAmount: monthly,
        risk: 'high',
        lockIn: 3,
        expectedReturn: 12,
        taxSaving,
        priority: priority++,
      })
    }

    // ── 2. NPS 80CCD(1B) — extra ₹50K above 80C limit ──────────────────
    const gapNPS = Math.max(0, limits.section80CCD1B - deductions.section80CCD1B)
    if (gapNPS > 500) {
      const monthly = Math.ceil((gapNPS / monthsLeft) / 100) * 100
      const taxSaving = Math.round(gapNPS * marginalRate * cessMultiplier)
      allocations.push({
        instrument: 'NPS Tier 1',
        section: 'NPS',
        annualAmount: gapNPS,
        monthlyAmount: monthly,
        risk: 'medium',
        lockIn: 25,
        expectedReturn: 10,
        taxSaving,
        priority: priority++,
      })
    }

    // ── 3. 80D — Self & Family Health Insurance ──────────────────────────
    const gap80D_self = Math.max(0, limits.section80D_self - (deductions.section80D_self + deductions.section80D_parents))
    if (gap80D_self > 1000) {
      const monthly = Math.ceil((gap80D_self / monthsLeft) / 100) * 100
      const taxSaving = Math.round(gap80D_self * marginalRate * cessMultiplier)
      allocations.push({
        instrument: 'Health Insurance',
        section: '80D',
        annualAmount: gap80D_self,
        monthlyAmount: monthly,
        risk: 'low',
        lockIn: 0,
        expectedReturn: 0,
        taxSaving,
        priority: priority++,
      })
    }
  }

  // Apply monthly affordability cap if provided
  let cappedAllocations = allocations
  if (monthlyAffordabilityCap && monthlyAffordabilityCap > 0) {
    let totalMonthly = 0
    cappedAllocations = []
    for (const alloc of allocations.sort((a, b) => a.priority - b.priority)) {
      if (totalMonthly + alloc.monthlyAmount <= monthlyAffordabilityCap) {
        cappedAllocations.push(alloc)
        totalMonthly += alloc.monthlyAmount
      } else {
        // Include partial allocation up to cap
        const remaining = monthlyAffordabilityCap - totalMonthly
        if (remaining >= 500) {
          cappedAllocations.push({
            ...alloc,
            monthlyAmount: remaining,
            annualAmount: remaining * monthsLeft,
            taxSaving: Math.round(remaining * monthsLeft * marginalRate * cessMultiplier),
          })
          totalMonthly += remaining
        }
        break
      }
    }
  }

  const totalMonthlyInvestment = cappedAllocations.reduce((s, a) => s + a.monthlyAmount, 0)
  const totalAnnualInvestment = cappedAllocations.reduce((s, a) => s + a.annualAmount, 0)
  const projectedTaxSaving = cappedAllocations.reduce((s, a) => s + a.taxSaving, 0)

  // Monthly income for affordability assessment
  const monthlyIncome = result.recommendedRegime === 'old'
    ? result.old.monthlyTakeHome
    : result.new.monthlyTakeHome

  const sipPct = monthlyIncome > 0 ? (totalMonthlyInvestment / monthlyIncome) * 100 : 100
  const feasibility: 'easy' | 'moderate' | 'stretch' =
    sipPct <= 15 ? 'easy' : sipPct <= 30 ? 'moderate' : 'stretch'

  // Build monthly plan for the rest of FY
  const monthlyPlan: MonthlyPlan[] = []
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  for (let i = 0; i < monthsLeft; i++) {
    const date = new Date(currentYear, currentMonth + i, 1)
    const isLumpsum = i === monthsLeft - 1 && monthsLeft < 12 // March lumpsum if FY ending soon
    monthlyPlan.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      income: monthlyIncome,
      fixedOutflows: 0,
      investableAmount: totalMonthlyInvestment,
      sipDebitDate: 5,
      isLumpsumMonth: isLumpsum,
      remainingAfterSIP: Math.max(0, monthlyIncome - totalMonthlyInvestment),
    })
  }

  return {
    allocations: cappedAllocations,
    totalAnnualInvestment,
    section80CUsed: Math.min(deductions.section80C + (cappedAllocations.find(a => a.section === '80C')?.annualAmount || 0), limits.section80C),
    section80DUsed: deductions.section80D_self + deductions.section80D_parents,
    npsUsed: Math.min(deductions.section80CCD1B + (cappedAllocations.find(a => a.section === 'NPS')?.annualAmount || 0), limits.section80CCD1B),
    projectedTaxSaving,
    monthlyPlan,
    feasibility,
    monthlyAffordability: Math.min(totalMonthlyInvestment, Math.round(monthlyIncome * 0.30)),
    generatedAt: now.toISOString(),
  }
}
