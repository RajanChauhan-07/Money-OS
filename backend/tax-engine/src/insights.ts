/**
 * MONEY OS — Insight Engine
 * Generates human-readable, actionable insights from tax calculation results.
 * 
 * Each insight: specific, measurable, non-jargon.
 * Examples:
 *  - "You used ₹0 of ₹1.5L under 80C"
 *  - "Missing ₹50K NPS benefit"
 *  - "You're overpaying tax by ₹40,000"
 */

import type { TaxInput, TaxComparisonResult, Insight } from '@money-os/types'
import { FY_2025_26 } from './slabs'

function rupees(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${Math.round(n / 1000)}K`
  return `₹${Math.round(n)}`
}

function formatPrecise(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function generateInsights(input: TaxInput, result: TaxComparisonResult): Insight[] {
  const insights: Insight[] = []
  const { deductions } = result
  const limits = FY_2025_26.deductionLimits
  const recommended = result.recommendedRegime === 'old' ? result.old : result.new
  const marginalRate = recommended.marginalRate / 100

  // ── 1. Loss Meter — Overpaying Alert ─────────────────────────────────
  if (result.lossMeter > 1000) {
    insights.push({
      id: 'loss-meter',
      section: 'overall',
      severity: 'danger',
      title: `You are overpaying ${rupees(result.lossMeter)} in tax this year`,
      description: `By not optimizing your deductions, you're leaving ${rupees(result.lossMeter)} on the table annually. This could be invested instead.`,
      actionText: 'See my optimization roadmap →',
      actionRoute: '/plan/summary',
      potentialSaving: result.lossMeter,
      icon: 'AlertCircle',
    })
  }

  // ── 2. 80C Gap ────────────────────────────────────────────────────────
  const gap80C = Math.max(0, limits.section80C - deductions.section80C)
  if (gap80C > 5000) {
    const taxSaved = Math.round(gap80C * marginalRate * 1.04) // include cess
    insights.push({
      id: '80c-gap',
      section: '80C',
      severity: gap80C === limits.section80C ? 'danger' : 'warning',
      title: `You used ${rupees(deductions.section80C)} of ${rupees(limits.section80C)} under Section 80C`,
      description: gap80C === limits.section80C
        ? `You have made no 80C investments. Investing ${rupees(limits.section80C)} in ELSS, PPF, or EPF can save you up to ${rupees(taxSaved)} in tax (Old Regime only).`
        : `You have ${rupees(gap80C)} of unused 80C headroom. Investing this amount can save you ${rupees(taxSaved)} more in tax (Old Regime only).`,
      actionText: 'Start an ELSS SIP →',
      actionRoute: '/plan/summary',
      potentialSaving: result.recommendedRegime === 'old' ? taxSaved : 0,
      icon: 'PiggyBank',
    })
  } else if (deductions.section80C >= limits.section80C) {
    insights.push({
      id: '80c-maxed',
      section: '80C',
      severity: 'success',
      title: '80C fully utilized — excellent!',
      description: result.recommendedRegime === 'old' 
        ? `You've invested the maximum ₹1,50,000 under Section 80C, saving you ${rupees(Math.round(limits.section80C * marginalRate * 1.04))} in tax.`
        : `You've maxed out Section 80C. While this doesn't affect New Regime tax, it builds your long-term wealth.`,
      potentialSaving: 0,
      icon: 'CheckCircle',
    })
  }

  // ── 3. NPS 80CCD(1B) Gap ──────────────────────────────────────────────
  const gapNPS = Math.max(0, limits.section80CCD1B - deductions.section80CCD1B)
  if (gapNPS > 1000 && result.recommendedRegime === 'old') {
    const taxSaved = Math.round(gapNPS * marginalRate * 1.04)
    insights.push({
      id: 'nps-gap',
      section: '80CCD(1B)',
      severity: 'warning',
      title: `Missing ₹50K NPS benefit under 80CCD(1B)`,
      description: `You can invest an extra ${rupees(gapNPS)} in NPS Tier 1 — OVER and ABOVE your 80C limit — saving an additional ${rupees(taxSaved)} in tax. This is a deduction most people miss.`,
      actionText: 'Open NPS account (eNPS) →',
      potentialSaving: taxSaved,
      icon: 'TrendingUp',
    })
  }

  // ── 4. HRA — Not Claiming ─────────────────────────────────────────────
  if (input.structure.hra > 0 && !input.life.isRenting) {
    insights.push({
      id: 'hra-not-claimed',
      section: 'HRA',
      severity: 'info',
      title: `You have HRA of ${formatPrecise(input.structure.hra * 12)} but aren't claiming exemption`,
      description: `Your employer pays ${formatPrecise(input.structure.hra)}/month as HRA. If you pay rent, you can claim HRA exemption and significantly reduce your old regime tax.`,
      actionText: 'Update rent details →',
      actionRoute: '/review',
      potentialSaving: 0, // variable — depends on rent
      icon: 'Home',
    })
  }

  if (input.life.isRenting && deductions.hraExemption > 0) {
    const taxSaved = Math.round(deductions.hraExemption * marginalRate * 1.04)
    insights.push({
      id: 'hra-claimed',
      section: 'HRA',
      severity: 'success',
      title: `HRA exemption of ${formatPrecise(deductions.hraExemption)} is saving you ${rupees(taxSaved)}`,
      description: `Your HRA exemption is correctly calculated based on your rent and city. This is a major reason why old regime may be better for you.`,
      potentialSaving: 0,
      icon: 'Home',
    })
  }

  // ── 5. 80D Health Insurance ───────────────────────────────────────────
  const total80D = deductions.section80D_self + deductions.section80D_parents
  const max80D = deductions.section80D_max_self + deductions.section80D_max_parents
  const gap80D = Math.max(0, max80D - total80D)
  if (gap80D > 2000 && result.recommendedRegime === 'old') {
    const taxSaved = Math.round(gap80D * marginalRate * 1.04)
    insights.push({
      id: '80d-gap',
      section: '80D',
      severity: 'info',
      title: `${rupees(gap80D)} unused health insurance deduction under 80D`,
      description: `You can claim up to ${rupees(max80D)} for health insurance premiums. Getting comprehensive health insurance also protects your family — win-win.`,
      actionText: 'Compare health plans →',
      potentialSaving: taxSaved,
      icon: 'Heart',
    })
  }

  // ── 6. Regime Recommendation ──────────────────────────────────────────
  const savings = result.savingsWithRecommended
  if (savings > 500) {
    const better = result.recommendedRegime
    const worse = better === 'old' ? 'new' : 'old'
    insights.push({
      id: 'regime-recommendation',
      section: 'regime',
      severity: 'info',
      title: `${better === 'old' ? 'Old' : 'New'} Regime saves you ${rupees(savings)} this year`,
      description: result.reasoning,
      potentialSaving: 0,
      icon: 'ArrowLeftRight',
    })
  } else {
    insights.push({
      id: 'regime-close',
      section: 'regime',
      severity: 'info',
      title: 'Both regimes are very close for you',
      description: `The difference is only ${rupees(savings)}. Small changes in investments can tip the balance.`,
      actionText: 'Try the What-If simulator →',
      actionRoute: '/simulator',
      potentialSaving: 0,
      icon: 'ArrowLeftRight',
    })
  }

  // ── 7. Home Loan Interest (24b) ───────────────────────────────────────
  if (input.life.hasHomeLoan && deductions.section24b > 0) {
    const taxSaved = Math.round(deductions.section24b * marginalRate * 1.04)
    insights.push({
      id: '24b-claimed',
      section: '24b',
      severity: 'success',
      title: `Home loan interest of ${rupees(deductions.section24b)} deducted under Section 24b`,
      description: `This is saving you ${rupees(taxSaved)} in tax. This deduction is available ONLY in the old regime.`,
      potentialSaving: 0,
      icon: 'Building',
    })
  }

  // ── 8. High Income — Surcharge Alert ─────────────────────────────────
  if (recommended.surcharge > 0) {
    insights.push({
      id: 'surcharge',
      section: 'overall',
      severity: 'warning',
      title: `Surcharge of ${rupees(recommended.surcharge)} applies to your income`,
      description: `Your income exceeds ₹50L, triggering surcharge. In the new regime, surcharge is capped at 25% (vs 37% in old regime), which significantly affects the comparison.`,
      potentialSaving: 0,
      icon: 'AlertTriangle',
    })
  }

  // ── 9. Tax Efficiency Score ───────────────────────────────────────────
  if (result.taxEfficiencyScore < 40) {
    insights.push({
      id: 'efficiency-low',
      section: 'overall',
      severity: 'danger',
      title: `Tax efficiency score: ${result.taxEfficiencyScore}% — significant room for improvement`,
      description: `You're using less than half of your tax-saving potential. A focused investment plan can dramatically improve this.`,
      actionText: 'Build my plan →',
      actionRoute: '/plan/summary',
      potentialSaving: result.lossMeter,
      icon: 'Gauge',
    })
  } else if (result.taxEfficiencyScore >= 80) {
    insights.push({
      id: 'efficiency-high',
      section: 'overall',
      severity: 'success',
      title: `Great work — ${result.taxEfficiencyScore}% tax efficiency!`,
      description: `You're using most of your available deductions. Keep it up to maintain this position.`,
      potentialSaving: 0,
      icon: 'Award',
    })
  }

  // Sort: danger first, then warning, then info, then success
  const order = { danger: 0, warning: 1, info: 2, success: 3 }
  return insights.sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4))
}
