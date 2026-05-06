/**
 * MONEY OS — Recommendation Engine
 * Generates strategy-level advice: plain-English recommendations about what to DO.
 * 
 * Unlike insights (which describe problems), recommendations tell users:
 *  - What to invest
 *  - How much per month
 *  - What changes as a result
 *  - Whether to switch regime
 */

import type { TaxInput, TaxComparisonResult, ScenarioEngineResult, Recommendation } from '@money-os/types'
import { FY_2025_26 } from './slabs'
import { computeOldRegime } from './old-regime'
import { computeNewRegime } from './new-regime'
import { computeDeductions } from './old-regime'

function rupees(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`
  return `₹${Math.round(n)}`
}

function feasibility(monthlyAmount: number, monthlyIncome: number): 'easy' | 'moderate' | 'stretch' {
  const pct = monthlyIncome > 0 ? (monthlyAmount / monthlyIncome) * 100 : 100
  if (pct <= 15) return 'easy'
  if (pct <= 30) return 'moderate'
  return 'stretch'
}

export function generateRecommendations(
  input: TaxInput,
  scenarios: ScenarioEngineResult,
): Recommendation[] {
  const recs: Recommendation[] = []
  const { current, optimized } = scenarios
  const limits = FY_2025_26.deductionLimits

  const monthlyIncome = current.recommendedRegime === 'old'
    ? current.old.monthlyTakeHome
    : current.new.monthlyTakeHome

  const { deductions } = current
  const marginalRate = (current.recommendedRegime === 'old' ? current.old.marginalRate : current.new.marginalRate) / 100

  let priority = 1

  // ── Rec 1: Maximize 80C ───────────────────────────────────────────────
  const gap80C = Math.max(0, limits.section80C - deductions.section80C)
  if (gap80C > 5000) {
    const monthly = Math.ceil(gap80C / 12 / 500) * 500 // round up to nearest 500
    const taxSaving = Math.round(gap80C * marginalRate * 1.04)
    recs.push({
      id: 'fill-80c',
      title: `Invest ${rupees(monthly)}/month in ELSS to fill your 80C`,
      body: `You have ${rupees(gap80C)} of unused 80C capacity. Starting an ELSS SIP of ${rupees(monthly)}/month will save you ${rupees(taxSaving)} in tax this year. ELSS also gives equity market returns with a 3-year lock-in.`,
      impact: taxSaving,
      investmentRequired: gap80C,
      monthlyAmount: monthly,
      switchRegime: false,
      priority: priority++,
      feasibility: feasibility(monthly, monthlyIncome),
    })
  }

  // ── Rec 2: Add NPS 80CCD(1B) ──────────────────────────────────────────
  const gapNPS = Math.max(0, limits.section80CCD1B - deductions.section80CCD1B)
  if (gapNPS > 1000 && current.recommendedRegime === 'old') {
    const monthly = Math.ceil(gapNPS / 12 / 500) * 500
    const taxSaving = Math.round(gapNPS * marginalRate * 1.04)
    recs.push({
      id: 'add-nps',
      title: `Add ${rupees(gapNPS)} to NPS Tier 1 for extra ₹50K deduction`,
      body: `NPS 80CCD(1B) is a deduction ABOVE your 80C limit — meaning it's additional tax saving on top. Investing ${rupees(monthly)}/month will save ${rupees(taxSaving)} more. Best used if you're already maxing 80C.`,
      impact: taxSaving,
      investmentRequired: gapNPS,
      monthlyAmount: monthly,
      switchRegime: false,
      priority: priority++,
      feasibility: feasibility(monthly, monthlyIncome),
    })
  }

  // ── Rec 3: Regime Switch Analysis ─────────────────────────────────────
  const currentOldTax = current.old.totalTax
  const currentNewTax = current.new.totalTax

  if (current.recommendedRegime === 'new') {
    // How much would the user need to invest in old regime to make it worth switching?
    const breakEven = scenarios.current.breakEvenMonthlyInvestment
    if (breakEven > 0 && breakEven <= monthlyIncome * 0.35) {
      recs.push({
        id: 'switch-to-old',
        title: `Invest ${rupees(breakEven)}/month and old regime becomes better`,
        body: `You're currently in new regime (saves ${rupees(currentNewTax - currentOldTax < 0 ? currentOldTax - currentNewTax : 0)}). But if you invest ${rupees(breakEven)}/month consistently, old regime reduces your tax further. Consider this if you want to build long-term wealth through 80C.`,
        impact: Math.max(0, currentNewTax - optimized.old.totalTax),
        investmentRequired: breakEven * 12,
        monthlyAmount: breakEven,
        switchRegime: true,
        targetRegime: 'old',
        priority: priority++,
        feasibility: feasibility(breakEven, monthlyIncome),
      })
    } else {
      recs.push({
        id: 'stay-new',
        title: 'Stay in New Regime — it\'s the right call for now',
        body: `New regime saves you ${rupees(Math.abs(currentOldTax - currentNewTax))} vs old regime given your current deductions. You'd need to invest more than ${rupees((breakEven || 0)* 12)}/year in 80C instruments to justify switching.`,
        impact: 0,
        investmentRequired: 0,
        monthlyAmount: 0,
        switchRegime: false,
        targetRegime: 'new',
        priority: priority++,
        feasibility: 'easy',
      })
    }
  } else {
    // User is better in old regime — confirm and explain
    const saving = currentNewTax - currentOldTax
    recs.push({
      id: 'stay-old',
      title: `Old Regime saves you ${rupees(saving)} — maintain your deductions`,
      body: `Your deductions (HRA, 80C, 80D, etc.) are strong enough to make old regime win. Ensure you maintain these investments every year. If your deductions drop significantly, reassess.`,
      impact: 0,
      investmentRequired: 0,
      monthlyAmount: 0,
      switchRegime: false,
      targetRegime: 'old',
      priority: priority++,
      feasibility: 'easy',
    })
  }

  // ── Rec 4: Health Insurance ───────────────────────────────────────────
  const gap80D = Math.max(0, (deductions.section80D_max_self - deductions.section80D_self))
  if (gap80D > 5000 && current.recommendedRegime === 'old') {
    const monthly = Math.ceil(gap80D / 12 / 100) * 100
    const taxSaving = Math.round(gap80D * marginalRate * 1.04)
    recs.push({
      id: 'health-insurance',
      title: `Get health insurance for ${rupees(monthly)}/month, save ${rupees(taxSaving)} in tax`,
      body: `A family health insurance policy of ${rupees(gap80D)}/year premiums gives you 80D deduction AND proper medical coverage. This is both financially smart and life-protective.`,
      impact: taxSaving,
      investmentRequired: gap80D,
      monthlyAmount: monthly,
      switchRegime: false,
      priority: priority++,
      feasibility: feasibility(monthly, monthlyIncome),
    })
  }

  // Sort by priority ascending
  return recs.sort((a, b) => a.priority - b.priority)
}

// ── Compute the monthly investment break-even point ──────────────────────────
// How much must a user invest in old regime to beat new regime?
export function computeBreakEvenMonthlyInvestment(input: TaxInput): number {
  const currentNew = computeNewRegime(input)
  const currentOld = computeOldRegime(input)

  if (currentOld.totalTax <= currentNew.totalTax) return 0 // already better in old

  // Binary search: find minimum 80C investment that makes old regime win
  let lo = 0
  // Cast to number explicitly to avoid literal type narrowing from 'as const'
  let hi = (FY_2025_26.deductionLimits.section80C as number)
  let result = hi

  for (let i = 0; i < 30; i++) {
    const mid = Math.round((lo + hi) / 2)
    // Test: what if user adds 'mid' additional annual 80C investment?
    const testOld = computeOldRegime({
      ...input,
      investments: { ...input.investments, otherSection80C: (input.investments.otherSection80C || 0) + mid },
    })
    if (testOld.totalTax <= currentNew.totalTax) {
      result = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }

  // Convert annual to monthly (round up to nearest ₹500)
  return Math.ceil(result / 12 / 500) * 500
}
