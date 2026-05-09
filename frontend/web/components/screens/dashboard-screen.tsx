'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  Download,
  PieChart,
  ShieldCheck,
  Sparkles,
  Upload,
  FileText,
  TrendingUp,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import type { TaxComparisonResult } from '@money-os/types'
import { formatRupee } from '@/lib/utils/format'
import { useTaxStore } from '@/lib/stores/tax-store'
import { useTrackerStore, monthsBetween, fvSIP, fvLumpsum } from '@/lib/stores/tracker-store'
import { generateInvestmentPlan } from '@money-os/tax-engine'

const quickLinks = [
  { label: 'Plan', href: '/plan/summary', icon: PieChart, copy: 'Review recommended allocations and monthly commitment.' },
  { label: 'Reports', href: '/reports/tax', icon: Download, copy: 'Export tax and investment views for HR, CA, or filing season.' },
]

export function DashboardScreen() {
  const { taxResult, derivedProfile, hasResult, scenarios } = useTaxStore()
  const { sips, holdings, incomes, expenses, goals } = useTrackerStore()

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

  // Define a proper empty state result instead of falling back to mock
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

  const currentFY = 'FY 2025-26'
  const result = (hasResult && taxResult) ? taxResult : emptyTaxResult
  const profile = derivedProfile

  // Derive metrics from real data
  const taxSaved = result.savingsWithRecommended
  const section80CUsed = result.deductions.section80C
  const section80CMax = result.deductions.section80CMax
  const section80DUsed = result.deductions.section80D_self + result.deductions.section80D_parents
  const section80DMax = result.deductions.section80D_max_self + result.deductions.section80D_max_parents
  const npsUsed = result.deductions.section80CCD1B
  const npsMax = 50000
  const nextActionAmount = hasResult ? Math.max(0, section80CMax - section80CUsed) : 0

  const recommended = result.recommendedRegime === 'old' ? result.old : result.new

  // ── Unified Goal Sync ──────────────────────────────────────────────────
  // Combine System-Generated Tax Goals + User-Created Wealth Goals
  let activeGoals: { id: string; name: string; targetAmount: number; currentSavings: number; progress: number; emoji?: string }[] = []
  
  // 1. Add User Goals (Penthouse, FIRE, etc.)
  const today = new Date().toISOString()
  goals.forEach(g => {
    const monthsLeft = Math.max(0, monthsBetween(today, g.targetDate))
    const yearsLeft = monthsLeft / 12
    const projectedCorpus = fvLumpsum(g.currentSaved, g.expectedCAGR, yearsLeft) + fvSIP(g.monthlyContribution, g.expectedCAGR, monthsLeft)
    const progress = Math.min(100, Math.round((projectedCorpus / g.targetAmount) * 100))
    
    activeGoals.push({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentSavings: g.currentSaved,
      progress,
      emoji: g.emoji
    })
  })

  // 2. Add System Tax Goals if they exist
  if (hasResult && scenarios?.optimized) {
    const plan = generateInvestmentPlan(scenarios.optimized)
    if (result.lossMeter > 0) {
      activeGoals.push({
        id: 'goal_tax_saving',
        name: 'Annual Tax Savings',
        targetAmount: result.lossMeter,
        currentSavings: Math.round(result.lossMeter * (plan.allocations.reduce((acc, a) => acc + a.monthlyAmount, 0) > 0 ? 0.3 : 0)),
        progress: Math.round((Math.round(result.lossMeter * (plan.allocations.reduce((acc, a) => acc + a.monthlyAmount, 0) > 0 ? 0.3 : 0)) / result.lossMeter) * 100),
        emoji: '🛡️'
      })
    }
  }

  // ── Calendar Sync ───────────────────────────────────────────────────
  let activeEvents: { title: string; date: string; description: string }[] = []
  
  if (hasResult && scenarios?.optimized) {
    const plan = generateInvestmentPlan(scenarios.optimized)
    if (plan.allocations.length > 0) {
      activeEvents.push({
        title: 'Monthly SIP Auto-Debit',
        date: '5th of Every Month',
        description: `Total SIP of ${formatRupee(plan.allocations.reduce((acc, a) => acc + a.monthlyAmount, 0))} for tax planning.`,
      })
    }
  }

  const totalIncome = incomes.reduce((s, i) => s + i.monthlyAmount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.monthlyAmount, 0)
  const monthlySurplus = totalIncome - totalExpenses

  // Compute dynamic momentum chart data from real SIPs
  const momentumData = Array.from({ length: 12 }, (_, i) => {
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() - (11 - i))
    const label = targetDate.toLocaleDateString('en-IN', { month: 'short' })
    const isoDate = targetDate.toISOString()
    
    const value = sips.reduce((acc, sip) => {
      const months = monthsBetween(sip.startDate, isoDate)
      if (months <= 0) return acc
      return acc + fvSIP(sip.monthlyAmount, sip.expectedCAGR, months)
    }, 0)
    
    return { label, value: Math.round(value) }
  })

  // General deadlines
  const currentYear = 2026
  activeEvents.push({
    title: 'Q1 Advance Tax Due',
    date: `Jun 15, ${currentYear}`,
    description: 'First installment of advance tax (15%) for the new financial year.',
  })
  activeEvents.push({
    title: 'Investment Proof Submission',
    date: `Jan 31, ${currentYear}`,
    description: 'Submit proof of investments to your employer to avoid excess TDS.',
  })
  activeEvents.push({
    title: 'ITR Filing Deadline',
    date: `Jul 31, ${currentYear}`,
    description: `Last date to file income tax return for FY 2025-26 without penalty.`,
  })

  // Determine the primary next action
  let actionTitle = 'Initialize your plan'
  let actionDescription = 'Upload your Form 16 or enter details manually to see your optimized tax strategy.'
  let actionLink = '/upload'
  let actionButton = 'Get started'

  if (hasResult) {
    if (nextActionAmount > 0) {
      actionTitle = `Invest ${formatRupee(nextActionAmount)} more toward 80C`
      actionDescription = 'A fresh ELSS top-up keeps your old-regime advantage intact.'
      actionLink = '/plan/80c'
      actionButton = 'Review 80C plan'
    } else if (npsUsed < npsMax) {
      actionTitle = `Gap found: ${formatRupee(npsMax - npsUsed)} in NPS`
      actionDescription = 'You can save up to ₹15,600 more in tax by maxing out Section 80CCD(1B).'
      actionLink = '/plan/nps'
      actionButton = 'Start NPS'
    } else if (section80DUsed < section80DMax) {
      actionTitle = `Health cover: ${formatRupee(section80DMax - section80DUsed)} open`
      actionDescription = 'Section 80D headroom remains. Consider top-up insurance for better coverage.'
      actionLink = '/plan/80d'
      actionButton = 'Review 80D'
    } else {
      actionTitle = 'Your plan is fully optimized'
      actionDescription = 'All core tax-saving buckets are maxed out for the current financial year.'
      actionLink = '/plan/summary'
      actionButton = 'View summary'
    }
  }

  return (
    <MotionPage>
      {!hasResult && (
        <section className="surface-panel overflow-hidden mb-6 border-emerald-500/20 bg-emerald-500/5">
          <div className="px-6 py-6 md:px-8 md:py-8 text-center">
            <Sparkles className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-widest">
              See your real numbers
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5 max-w-md mx-auto font-medium">
              Dashboard in sample mode. Upload Form 16 to sync your real tax savings and investment strategy.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/upload">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
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
              <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {currentFY}
              </span>
              {hasResult && (
                <Link href="/plan/summary" className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-500 transition-transform hover:scale-105 active:scale-95">
                  <ShieldCheck size={13} /> Plan Active
                </Link>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
              {hasResult
                ? `${result.recommendedRegime === 'old' ? 'Old' : 'New'} regime saves you more.`
                : `Good to see you, ${userName}.`}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] md:text-base font-medium">
              {hasResult
                ? result.reasoning
                : 'Your financial roadmap will appear here once you provide your tax and income details. We will analyze your profile to recommend the best regime.'}
            </p>
          </div>
          <div className="surface-elevated p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Next action</p>
                <h2 className="mt-2 text-xl font-black text-[var(--text-primary)] tracking-tight">
                  {actionTitle}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)] font-medium">
                  {actionDescription}
                </p>
              </div>
              <Sparkles className="text-emerald-500" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={actionLink}>
                <Button size="lg" className="bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px]">{actionButton}</Button>
              </Link>
              {hasResult && (
                <Link href="/result">
                  <Button variant="outline" size="lg" className="font-black uppercase tracking-widest text-[10px]">
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
          subValue={`Saved vs ${result.recommendedRegime === 'old' ? 'New' : 'Old'} regime`}
          trend="up"
          trendLabel="Best-fit"
        />
        <MetricCard
          label="Monthly investable surplus"
          value={formatRupee(monthlySurplus)}
          subValue={`${totalIncome > 0 ? ((monthlySurplus / totalIncome) * 100).toFixed(1) : 0}% savings rate`}
          trend={monthlySurplus > 0 ? "up" : "down"}
          trendLabel="Synced"
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
        <GlowCard customSize glowColor="emerald" className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col">
          <CardHeader>
            <CardTitle className="font-black uppercase tracking-widest text-sm">Section utilization</CardTitle>
            <CardDescription className="font-medium">The three deduction tracks that drive your tax savings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SectionProgress label="Core savings basket" used={section80CUsed} max={section80CMax} section="80C" />
            <SectionProgress label="Health insurance" used={section80DUsed} max={section80DMax} section="80D" />
            <SectionProgress label="Retirement add-on" used={npsUsed} max={npsMax} section="NPS" />
          </CardContent>
        </GlowCard>

        <GlowCard customSize glowColor="cyan" className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col">
          <CardHeader>
            <CardTitle className="font-black uppercase tracking-widest text-sm">Annual momentum</CardTitle>
            <CardDescription className="font-medium">Portfolio value trend across the current financial year.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={momentumData}>
                <defs>
                  <linearGradient id="dashboard-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', color: '#fff' }}
                  formatter={(value: number) => [formatRupee(Number(value)), '']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#dashboard-fill)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </GlowCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <GlowCard customSize glowColor={activeGoals.length > 0 ? "emerald" : "neutral"} className={cn("bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col", activeGoals.length === 0 && "border-dashed opacity-80")}>
          <CardHeader>
            <CardTitle className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <Target size={18} className="text-emerald-500" /> Goals in motion
            </CardTitle>
            <CardDescription className="font-medium">{hasResult && activeGoals.length > 0 ? 'Tracking your real-world targets and tax-saving milestones.' : 'Your financial goals will appear here.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.length > 0 ? activeGoals.map((goal) => (
              <div key={goal.id} className="surface-elevated p-5 border-l-4 border-l-emerald-500 hover:bg-emerald-500/[0.02] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center text-xl border border-black/5 dark:border-white/5 shadow-inner">
                      {goal.emoji || '🎯'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{goal.name}</p>
                      <p className="mt-1 text-[11px] font-bold text-[var(--text-secondary)] tabular-nums">
                        {formatRupee(goal.currentSavings)} base saved • Target {formatRupee(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-black text-emerald-500 tabular-nums">
                    {goal.progress}%
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-black/5 dark:bg-white/5 mt-5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${goal.progress}%` }}
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                  />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <PieChart className="w-8 h-8 text-[var(--text-tertiary)] mb-3 opacity-20" />
                <p className="text-sm text-[var(--text-secondary)] mb-4 font-medium">No active goals found for this year.</p>
                <Link href="/tracker/goals">
                  <Button variant="outline" size="sm" className="font-black uppercase tracking-widest text-[9px]">Set your first goal</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </GlowCard>

        <GlowCard customSize glowColor="cyan" className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col">
          <CardHeader>
            <CardTitle className="font-black uppercase tracking-widest text-sm">Upcoming calendar moments</CardTitle>
            <CardDescription className="font-medium">Crucial financial dates for cash flow and tax compliance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeEvents.slice(0, 3).map((event) => (
              <div key={event.title} className="flex gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 hover:border-cyan-500/30 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-inner">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{event.title}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-500/60">{event.date}</p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </GlowCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 pt-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="surface-panel p-6 transition hover:border-emerald-500/30 hover:shadow-xl group">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">{link.label}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{link.copy}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/5 dark:bg-white/5 group-hover:bg-emerald-500/10 transition-colors">
                <link.icon size={20} className="text-zinc-400 dark:text-white/40 group-hover:text-emerald-500" />
              </div>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:gap-3 transition-all">
              Go to {link.label} <ArrowRight size={14} strokeWidth={3} />
            </span>
          </Link>
        ))}
      </div>
    </MotionPage>
  )
}
