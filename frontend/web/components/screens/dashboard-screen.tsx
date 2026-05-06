'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  Download,
  PieChart,
  ShieldCheck,
  Sparkles,
  Upload,
  FileText,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button, CardContent, CardDescription, CardHeader, CardTitle } from '@money-os/ui'
import { MetricCard, SectionProgress, GlowCard } from '@/components/ui'
import { MotionPage } from '@/components/screens/motion-page'
import {
  computedTaxResult,
  yearlyReturnSeries,
  mockUser,
} from '@/lib/mock-data'
import { formatRupee } from '@/lib/utils/format'
import { useTaxStore } from '@/lib/stores/tax-store'
import { generateInvestmentPlan } from '@money-os/tax-engine'

const quickLinks = [
  { label: 'Plan', href: '/plan/summary', icon: PieChart, copy: 'Review recommended allocations and monthly commitment.' },
  { label: 'Reports', href: '/reports/tax', icon: Download, copy: 'Export tax and investment views for HR, CA, or filing season.' },
]

export function DashboardScreen() {
  const { taxResult, derivedProfile, hasResult, scenarios } = useTaxStore()

  // Use real data if available, otherwise fall back to mock
  const currentFY = 'FY 2025-26'
  const result = hasResult && taxResult ? taxResult : computedTaxResult
  const profile = derivedProfile

  // Derive metrics from real data
  const taxSaved = Math.round(result.savingsWithRecommended)
  const section80CUsed = result.deductions.section80C
  const section80CMax = result.deductions.section80CMax
  const section80DUsed = result.deductions.section80D_self + result.deductions.section80D_parents
  const section80DMax = result.deductions.section80D_max_self + result.deductions.section80D_max_parents
  const npsUsed = result.deductions.section80CCD1B
  const npsMax = 50000
  const nextActionAmount = Math.max(0, section80CMax - section80CUsed)

  const userName = profile?.employer?.companyName
    ? profile.employer.companyName.split(' ')[0]
    : mockUser.name.split(' ')[0]

  const recommended = result.recommendedRegime === 'old' ? result.old : result.new

  // Auto-generate goals & events from the real plan if available
  let activeGoals: { id: string; name: string; targetAmount: number; currentSavings: number; targetYear: number }[] = []
  let activeEvents: { title: string; date: string; description: string }[] = []
  
  if (hasResult && scenarios?.optimized) {
    const plan = generateInvestmentPlan(scenarios.optimized)
    
    if (result.lossMeter > 0) {
      activeGoals.push({
        id: 'goal_tax_saving',
        name: 'Annual Tax Savings',
        targetAmount: result.lossMeter,
        currentSavings: Math.round(result.lossMeter * (plan.allocations.reduce((acc, a) => acc + a.monthlyAmount, 0) > 0 ? 0.3 : 0)),
        targetYear: 2026,
      })
    }
    
    if (nextActionAmount > 0) {
      activeGoals.push({
        id: 'goal_80c',
        name: '80C Completion',
        targetAmount: section80CMax,
        currentSavings: section80CUsed,
        targetYear: 2026,
      })
    }

    if (plan.allocations.length > 0) {
      activeEvents.push({
        title: 'Monthly SIP Auto-Debit',
        date: '5th of Every Month',
        description: `Total SIP of ${formatRupee(plan.allocations.reduce((acc, a) => acc + a.monthlyAmount, 0))} for tax planning.`,
      })
    }
  }

  // General deadlines
  activeEvents.push({
    title: 'Investment Proof Submission',
    date: 'Dec 31, 2025',
    description: 'Submit proof of investments to your employer to avoid excess TDS.',
  })
  activeEvents.push({
    title: 'ITR Filing Deadline',
    date: 'Jul 31, 2026',
    description: 'Last date to file income tax return for FY 2025-26 without penalty.',
  })

  return (
    <MotionPage>
      {/* If no result, show a CTA to get started */}
      {!hasResult && (
        <section className="surface-panel overflow-hidden mb-6 border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5">
          <div className="px-6 py-6 md:px-8 md:py-8 text-center">
            <Sparkles className="w-8 h-8 text-[var(--brand-primary)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              See your real numbers
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-md mx-auto">
              This dashboard is showing sample data. Upload your Form 16 or enter your details manually to see your actual tax savings and plan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/upload">
                <Button size="lg">
                  <Upload size={16} className="mr-2" />
                  Upload Form 16
                </Button>
              </Link>
              <Link href="/setup">
                <Button variant="outline" size="lg">
                  <FileText size={16} className="mr-2" />
                  Enter manually
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="surface-panel overflow-hidden">
        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.3fr_0.9fr] md:px-8 md:py-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {currentFY}
              </span>
              {hasResult && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--success)]/20 bg-[var(--success-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--success)]">
                  <ShieldCheck size={13} /> Plan Active
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
              {hasResult
                ? `${result.recommendedRegime === 'old' ? 'Old' : 'New'} regime saves you more.`
                : `Good to see you, ${userName}.`}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] md:text-base">
              {hasResult
                ? result.reasoning
                : 'Your annual plan currently leans toward the old regime because rent and second-home interest are doing real work. We kept the next step singular so the year feels manageable.'}
            </p>
          </div>
          <div className="surface-elevated p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Next action</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                  {nextActionAmount > 0
                    ? `Invest ${formatRupee(nextActionAmount)} more toward 80C`
                    : '80C is fully utilized ✓'}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {nextActionAmount > 0
                    ? 'A fresh ELSS top-up keeps your old-regime advantage intact without disturbing monthly cash flow.'
                    : 'Great work! Consider NPS under 80CCD(1B) for an extra ₹50,000 deduction.'}
                </p>
              </div>
              <Sparkles className="text-[var(--brand-primary)]" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/plan/80c">
                <Button size="lg">Review 80C plan</Button>
              </Link>
              {hasResult && (
                <Link href="/result">
                  <Button variant="outline" size="lg">
                    View comparison
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tax saved with recommended regime"
          value={formatRupee(taxSaved)}
          subValue={`${result.recommendedRegime === 'old' ? 'Old' : 'New'} regime`}
          trend="up"
          trendLabel="Best-fit regime"
        />
        <MetricCard
          label="80C progress"
          value={`${Math.round((section80CUsed / section80CMax) * 100)}%`}
          subValue={`${formatRupee(section80CUsed)} used`}
          trend="neutral"
        />
        <MetricCard
          label="Monthly take-home"
          value={formatRupee(recommended.monthlyTakeHome)}
          subValue={`Effective rate: ${recommended.effectiveTaxRate.toFixed(1)}%`}
          trend="up"
          trendLabel="Optimized"
        />
        <MetricCard
          label="Annual tax liability"
          value={formatRupee(Math.round(recommended.totalTax))}
          subValue="After cess"
          trend="down"
          trendLabel="Minimized"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlowCard customSize glowColor="purple" className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col">
          <CardHeader>
            <CardTitle>Section utilization</CardTitle>
            <CardDescription>The three deduction tracks that drive your tax savings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionProgress label="Core savings basket" used={section80CUsed} max={section80CMax} section="80C" />
            <SectionProgress label="Health insurance" used={section80DUsed} max={section80DMax} section="80D" />
            <SectionProgress label="Retirement add-on" used={npsUsed} max={npsMax} section="NPS" />
          </CardContent>
        </GlowCard>

        <GlowCard customSize glowColor="purple" className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col">
          <CardHeader>
            <CardTitle>Annual momentum</CardTitle>
            <CardDescription>Portfolio value trend across the current financial year.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyReturnSeries}>
                <defs>
                  <linearGradient id="dashboard-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis
                  stroke="var(--text-tertiary)"
                  fontSize={12}
                  tickFormatter={(value) => formatRupee(Number(value), true)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => formatRupee(Number(value))}
                />
                <Area type="monotone" dataKey="value" stroke="var(--brand-primary)" fill="url(#dashboard-fill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </GlowCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="surface-panel p-5 transition hover:border-[var(--border-default)] hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{link.label}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{link.copy}</p>
              </div>
              <link.icon size={18} className="text-[var(--brand-primary)]" />
            </div>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-primary)]">
              Open <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <GlowCard customSize glowColor="purple" className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col">
          <CardHeader>
            <CardTitle>Goals in motion</CardTitle>
            <CardDescription>{hasResult ? 'Tracking your active tax-saving goals.' : 'Your financial goals will appear here.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.length > 0 ? activeGoals.map((goal) => {
              const progress = Math.round((goal.currentSavings / goal.targetAmount) * 100)

              return (
                <div key={goal.id} className="surface-elevated p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{goal.name}</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {formatRupee(goal.currentSavings)} saved of {formatRupee(goal.targetAmount)} by {goal.targetYear}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                      {progress}%
                    </span>
                  </div>
                  <div className="section-bar mt-4">
                    <div className="section-bar-fill" style={{ width: `${progress}%`, background: 'var(--brand-primary)' }} />
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-6 text-sm text-[var(--text-secondary)]">No active goals yet.</div>
            )}
          </CardContent>
        </GlowCard>

        <GlowCard customSize glowColor="purple" className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col">
          <CardHeader>
            <CardTitle>Upcoming calendar moments</CardTitle>
            <CardDescription>The next deadlines that matter for cash flow, proof submission, and filing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeEvents.slice(0, 3).map((event) => (
              <div key={event.title} className="flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <CalendarClock size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{event.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{event.date}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{event.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </GlowCard>
      </div>
    </MotionPage>
  )
}
