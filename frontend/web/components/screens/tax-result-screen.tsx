'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@money-os/ui'
import { MetricCard, RegimeCard } from '@/components/ui'
import { MotionPage } from '@/components/screens/motion-page'
import { formatRupee } from '@/lib/utils/format'
import { useTaxStore } from '@/lib/stores/tax-store'
import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { TaxComparisonResult } from '@money-os/types'

export function TaxResultScreen() {
  const { taxResult, hasResult } = useTaxStore()
  const [userName, setUserName] = useState<string>('User')

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        setUserName(displayName)
      }
    }
    fetchUser()
  }, [])

  const emptyTaxResult: TaxComparisonResult = {
    old: { 
      regime: 'old',
      totalTax: 0, 
      monthlyTakeHome: 0, 
      effectiveTaxRate: 0, 
      marginalRate: 0,
      slabs: [], 
      taxableIncome: 0,
      grossIncome: 0,
      totalDeductions: 0,
      taxBeforeSurcharge: 0,
      surcharge: 0,
      rebate87A: 0,
      cess: 0,
      monthlyTDS: 0,
      annualTakeHome: 0
    },
    new: { 
      regime: 'new',
      totalTax: 0, 
      monthlyTakeHome: 0, 
      effectiveTaxRate: 0, 
      marginalRate: 0,
      slabs: [], 
      taxableIncome: 0,
      grossIncome: 0,
      totalDeductions: 0,
      taxBeforeSurcharge: 0,
      surcharge: 0,
      rebate87A: 0,
      cess: 0,
      monthlyTDS: 0,
      annualTakeHome: 0
    },
    recommendedRegime: 'new',
    savingsWithRecommended: 0,
    lossMeter: 0,
    reasoning: 'Upload your Form 16 or enter details manually to see your tax analysis.',
    deductions: { section80C: 0, section80CMax: 150000, section80D_self: 0, section80D_parents: 0, section80D_max_self: 25000, section80D_max_parents: 25000, section80CCD1B: 0, section80CCD1BMax: 50000, hra: 0, section24: 0, lta: 0, standardDeduction: 50000, professionalTax: 0, totalDeductions: 0 }
  }

  const result = hasResult && taxResult ? taxResult : emptyTaxResult
  const monthlyDelta = Math.abs(result.old.monthlyTakeHome - result.new.monthlyTakeHome)
  const recommended = result.recommendedRegime === 'old' ? result.old : result.new
  const alternate = result.recommendedRegime === 'old' ? result.new : result.old

  const section80CUsed = result.deductions.section80C
  const section80CMax = result.deductions.section80CMax

  return (
    <MotionPage>
      <section className="surface-panel overflow-hidden">
        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--success)]/20 bg-[var(--success-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--success)]">
                Recommended
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">Regime comparison</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
              {!hasResult ? `Welcome, ${userName}` : (result.recommendedRegime === 'old' ? 'Old regime wins this year' : 'New regime is lighter this year')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] md:text-base">
              {result.reasoning}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/plan/summary">
                <Button size="lg">Build execution plan</Button>
              </Link>
              <Link href="/tax/breakdown">
                <Button variant="outline" size="lg">
                  See deduction breakdown
                </Button>
              </Link>
            </div>
          </div>
          <div className="surface-elevated p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">What is driving the result</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {!hasResult 
                    ? "Once you upload your financial data, we'll analyze your rent, investments, and salary to recommend the best regime."
                    : result.reasoning.split('.')[0] + '.'}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-[var(--success)]/20 bg-[var(--success-bg)] p-4 text-[var(--success)]">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 size={16} />
                Annual difference
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {formatRupee(Math.round(result.savingsWithRecommended))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Recommended annual tax"
          value={formatRupee(Math.round(recommended.totalTax))}
          subValue="After cess"
          trend="down"
          trendLabel="Lower liability"
        />
        <MetricCard
          label="Monthly take-home delta"
          value={formatRupee(monthlyDelta)}
          subValue="Difference between regimes"
          trend="up"
          trendLabel="More liquidity"
        />
        <MetricCard
          label="Open 80C headroom"
          value={formatRupee(section80CMax - section80CUsed)}
          subValue="Still usable this year"
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RegimeCard
          result={result.old}
          isRecommended={result.recommendedRegime === 'old'}
          savingsVsOther={Math.round(result.savingsWithRecommended)}
        />
        <RegimeCard
          result={result.new}
          isRecommended={result.recommendedRegime === 'new'}
          savingsVsOther={Math.round(result.savingsWithRecommended)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Translate this decision into action</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link href="/plan/80c" className="surface-elevated p-4 transition hover:border-[var(--border-default)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Use the remaining 80C space</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">A targeted ELSS contribution keeps the gap between the regimes intact.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)]">
              Open 80C optimizer <ArrowRight size={14} />
            </span>
          </Link>
          <Link href="/plan/cashflow" className="surface-elevated p-4 transition hover:border-[var(--border-default)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Check month-by-month fit</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Validate the contribution schedule against rent, EMI, and bonus months.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)]">
              Open cash-flow planner <ArrowRight size={14} />
            </span>
          </Link>
          <Link href="/reports/tax" className="surface-elevated p-4 transition hover:border-[var(--border-default)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Generate a shareable report</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Useful for a CA review, internal sanity check, or HR proof submission context.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)]">
              Open tax report <ArrowRight size={14} />
            </span>
          </Link>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-xs text-[var(--text-tertiary)]">
        Alternate regime total tax: {formatRupee(Math.round(alternate.totalTax))} • recommended monthly take-home: {formatRupee(recommended.monthlyTakeHome)}
      </div>
    </MotionPage>
  )
}
