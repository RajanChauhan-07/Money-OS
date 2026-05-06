'use client'

import { useTaxStore } from '@/lib/stores/tax-store'
import { MotionPage } from './motion-page'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@money-os/ui'
import { formatRupee } from '@/lib/utils/format'
import { generateInvestmentPlan } from '@money-os/tax-engine'
import { CheckCircle2, AlertCircle, PieChart, Info } from 'lucide-react'
import Link from 'next/link'
import { ComingSoon } from '@/components/ui'

export function PlanScreen({ screenSlug }: { screenSlug: string }) {
  const { taxResult, scenarios, hasResult } = useTaxStore()

  if (!hasResult || !taxResult) {
    return (
      <MotionPage className="p-6 md:p-10">
        <div className="flex h-[40vh] items-center justify-center flex-col text-center">
          <AlertCircle className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
          <h1 className="text-xl font-medium text-[var(--text-primary)]">No Tax Profile Found</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Please upload your Form 16 or setup your profile to see your personalized plan.</p>
          <Link href="/upload" className="mt-6">
            <Button>Setup Profile</Button>
          </Link>
        </div>
      </MotionPage>
    )
  }

  const planInput = scenarios?.optimized || taxResult
  const plan = generateInvestmentPlan(planInput)
  
  if (screenSlug === 'summary') {
    return (
      <MotionPage className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Investment Plan Summary</h1>
          <p className="mt-2 text-[var(--text-secondary)] text-lg">
            A targeted action plan to reach your optimal tax savings of {formatRupee(taxResult.lossMeter)}.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle>Required Annual Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-[var(--brand-primary)]">
                {formatRupee(plan.totalAnnualInvestment)}
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                To maximize your Section 80C and 80D limits based on your current gaps.
              </p>
            </CardContent>
          </Card>
          
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle>Monthly Commitment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-[var(--success)]">
                {formatRupee(Math.round(plan.totalAnnualInvestment / 12))}
                <span className="text-lg text-[var(--text-tertiary)] font-normal ml-2">/ month</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Suggested SIP amount across {plan.allocations.length} recommended funds.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 mt-8">
          <h2 className="text-xl font-medium">Recommended Allocations</h2>
          {plan.allocations.length > 0 ? plan.allocations.map((alloc) => (
            <div key={alloc.section} className="flex justify-between items-center p-5 surface-panel rounded-xl border border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{alloc.section}</h3>
                  <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-tertiary)]">
                    {alloc.priority === 1 ? 'High Priority' : 'Standard'}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Via {alloc.instrument}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">{formatRupee(alloc.annualAmount)}</div>
                <div className="text-sm text-[var(--text-tertiary)]">({formatRupee(alloc.monthlyAmount)}/mo)</div>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center border border-[var(--border-subtle)] rounded-xl surface-panel">
              <CheckCircle2 className="w-8 h-8 text-[var(--success)] mx-auto mb-3" />
              <p className="font-medium">You're fully optimized!</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">No further tax-saving investments are required for this year.</p>
            </div>
          )}
        </div>
      </MotionPage>
    )
  }

  if (screenSlug === '80c') {
    const section80C = plan.allocations.find(a => a.section === '80C')
    const current80C = taxResult.deductions.section80C
    const max80C = taxResult.deductions.section80CMax
    const gap = Math.max(0, max80C - current80C)

    return (
      <MotionPage className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/plan/summary" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">← Back to Plan</Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Section 80C Deep Dive</h1>
          <p className="mt-2 text-[var(--text-secondary)] text-lg">
            Your primary vehicle for saving tax under the Old Regime.
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="surface-elevated p-5">
            <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Currently Used</p>
            <p className="text-2xl font-semibold mt-1">{formatRupee(current80C)}</p>
          </Card>
          <Card className="surface-elevated p-5">
            <p className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider font-medium">Remaining Gap</p>
            <p className="text-2xl font-semibold mt-1 text-[var(--warning)]">{formatRupee(gap)}</p>
          </Card>
          <Card className="surface-elevated p-5 border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5">
            <p className="text-sm text-[var(--brand-primary)] uppercase tracking-wider font-medium">Target Action</p>
            <p className="text-2xl font-semibold mt-1 text-[var(--brand-primary)]">
              {section80C ? formatRupee(section80C.annualAmount) : 'Fully Utilized ✓'}
            </p>
          </Card>
        </div>

        {section80C && (
          <div className="surface-panel p-6 rounded-xl border border-[var(--border-subtle)] mt-8">
            <div className="flex gap-4">
              <Info className="w-6 h-6 text-[var(--brand-primary)] flex-shrink-0" />
              <div>
                <h3 className="font-medium text-lg">Recommendation: Start an {section80C.instrument} SIP</h3>
                <p className="text-[var(--text-secondary)] mt-2 leading-relaxed">
                  We recommend setting up a monthly SIP of <strong className="text-[var(--text-primary)]">{formatRupee(section80C.monthlyAmount)}</strong> into {section80C.instrument} to comfortably reach the target without end-of-year cash flow pressure.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Link href="/invest">
                <Button>Explore ELSS Funds</Button>
              </Link>
            </div>
          </div>
        )}
      </MotionPage>
    )
  }

  // Fallback for other subpages
  return <ComingSoon title="Module in Development" description="This specific plan detail is being upgraded." />
}
