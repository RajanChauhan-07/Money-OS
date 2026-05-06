'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck,
  Download,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ChevronRight,
  Target
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@money-os/ui'
import { MetricCard, SectionProgress, GlowCard, AIAssistantWidget } from '@/components/ui'
import { useTaxStore } from '@/lib/stores/tax-store'
import { formatRupee } from '@/lib/utils/format'
import { generateInvestmentPlan } from '@money-os/tax-engine'
import { getBrokerLinksForInstrument } from '@/lib/broker-links'
import { cn } from '@/lib/utils'

export default function PlanSummaryPage() {
  const router = useRouter()
  const { taxResult, hasResult, scenarios, activeScenarioMode } = useTaxStore()
  const [mounted, setMounted] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (!hasResult || !taxResult || !scenarios) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-base)]">
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-6">
          <Sparkles className="text-[var(--brand-primary)]" size={32} />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">No active plan found</h1>
        <p className="text-[var(--text-secondary)] max-w-sm mb-8">
          We need your details to build a custom roadmap. Start by uploading your Form 16 or entering manually.
        </p>
        <Link href="/upload">
          <Button size="lg" className="px-8">Build My Plan</Button>
        </Link>
      </div>
    )
  }

  // We always show the OPTIMIZED plan on this page
  const displayResult = scenarios.optimized
  const { allocations, monthlyPlan, feasibility } = generateInvestmentPlan(displayResult)
  const totalAnnual = allocations.reduce((sum, a) => sum + a.annualAmount, 0)
  const monthlyInvest = allocations.reduce((sum, a) => sum + a.monthlyAmount, 0)

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const progress = Math.round((completedSteps.length / (allocations.length + 1)) * 100)

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-24">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <button onClick={() => router.push('/result')} className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={16} />
          Back to Analysis
        </button>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Planning Progress</span>
            <span className="text-sm font-bold text-[var(--brand-primary)]">{progress}% Complete</span>
          </div>
          <Button variant="outline" size="sm">
            <Download size={14} className="mr-2" />
            Export Roadmap
          </Button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 space-y-8">
        {/* Strategy Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 md:p-12 shadow-sm">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--brand-primary)]/5 to-transparent -z-10" />
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--success)]/20 bg-[var(--success-bg)] px-3 py-1 mb-6">
              <ShieldCheck size={14} className="text-[var(--success)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">Verified Tax Strategy</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4 md:text-5xl">
              Your Monthly Investment Schedule
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              To achieve the maximum saving of <span className="text-[var(--success)] font-bold">{formatRupee(scenarios.current.lossMeter)}</span>, follow this monthly SIP schedule for the remaining FY.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-[var(--text-tertiary)] uppercase font-bold tracking-widest">Total Investment</span>
                <span className="text-2xl font-bold text-[var(--text-primary)]">{formatRupee(totalAnnual)}</span>
              </div>
              <div className="w-px h-10 bg-[var(--border-subtle)]" />
              <div className="flex flex-col">
                <span className="text-xs text-[var(--text-tertiary)] uppercase font-bold tracking-widest">Monthly SIP</span>
                <span className="text-2xl font-bold text-[var(--text-primary)]">{formatRupee(monthlyInvest)}</span>
              </div>
              <div className="w-px h-10 bg-[var(--border-subtle)]" />
              <div className="flex flex-col">
                <span className="text-xs text-[var(--text-tertiary)] uppercase font-bold tracking-widest">Efficiency Boost</span>
                <span className="text-2xl font-bold text-[var(--success)]">+{100 - scenarios.current.taxEfficiencyScore}%</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Execution Checklist */}
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Target size={20} className="text-[var(--brand-primary)]" />
                  Execution Checklist
                </h2>
                {feasibility && (
                  <span className={cn(
                    "text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                    feasibility === 'easy' ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20" :
                    feasibility === 'moderate' ? "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20" :
                    "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20"
                  )}>
                    {feasibility === 'stretch' ? 'Stretch Goal' : `${feasibility} Plan`}
                  </span>
                )}
              </div>
              
              {feasibility === 'stretch' && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--danger)]/5 border border-[var(--danger)]/20 flex items-start gap-3">
                  <ShieldCheck size={20} className="text-[var(--danger)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--danger)] leading-relaxed">
                    <strong>Affordability Alert:</strong> This SIP plan requires over 30% of your monthly take-home pay. Make sure you have an emergency fund before committing to this aggressive timeline.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {allocations.map((item, i) => {
                   const stepId = `step-${i}`;
                   const isCompleted = completedSteps.includes(stepId);
                   return (
                    <motion.div 
                      key={i}
                      layout
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                        isCompleted ? "bg-[var(--bg-elevated)] border-[var(--success)]/30 opacity-75" : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:shadow-md hover:border-[var(--brand-primary)]/50"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => toggleStep(stepId)}
                          className={cn(
                            "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                            isCompleted ? "bg-[var(--success)] border-[var(--success)] text-white" : "border-[var(--border-default)] group-hover:border-[var(--brand-primary)]"
                          )}
                        >
                          {isCompleted && <CheckCircle2 size={16} />}
                        </button>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{item.section} Investment</span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">{formatRupee(item.monthlyAmount)} / mo</span>
                          </div>
                          <h3 className={cn("text-base font-bold transition-all", isCompleted ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]")}>
                            Start SIP in {item.instrument}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
                            <span>Risk: <span className="font-medium text-[var(--text-primary)] capitalize">{item.risk}</span></span>
                            <span>Lock-in: <span className="font-medium text-[var(--text-primary)]">{item.lockIn}Y</span></span>
                            {item.taxSaving && (
                              <span className="text-[var(--success)] font-medium bg-[var(--success-bg)] px-2 py-0.5 rounded text-xs border border-[var(--success)]/20">
                                Saves {formatRupee(item.taxSaving)} tax
                              </span>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {!isCompleted && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                                  {getBrokerLinksForInstrument(item.instrument.includes('ELSS') ? 'ELSS' : item.section as any).map((broker) => (
                                    <a 
                                      key={broker.name} 
                                      href={broker.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-all text-xs font-semibold"
                                    >
                                      <span>{broker.logo}</span>
                                      {broker.name}
                                      <ExternalLink size={10} className="opacity-50" />
                                    </a>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            {/* Monthly Timeline */}
            <section>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-[var(--brand-primary)]" />
                Cash Flow Timeline
              </h2>
              <div className="surface-panel p-6">
                <div className="space-y-6">
                  {monthlyPlan.slice(0, 5).map((month, i) => (
                    <div key={i} className="relative flex items-center gap-6">
                      {i !== 4 && <div className="absolute left-5 top-10 w-0.5 h-10 bg-[var(--border-subtle)]" />}
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase">
                          {new Date(month.year, month.month - 1).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-between bg-[var(--bg-base)] rounded-2xl border border-[var(--border-subtle)] px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">Invest {formatRupee(month.investableAmount)}</p>
                          <p className="text-[11px] text-[var(--text-tertiary)]">Projected Take-home: {formatRupee(month.income - month.investableAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[var(--success)] uppercase tracking-tighter">Liquid</p>
                          <p className="text-xs font-bold text-[var(--text-secondary)]">{month.sipDebitDate}th Monthly</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-center">
                  <p className="text-xs text-[var(--text-tertiary)] italic">
                    Note: Projections assume your monthly salary structure remains constant for the rest of the FY.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <GlowCard customSize glowColor="blue" className="bg-[var(--brand-primary)]/5 border-[var(--brand-primary)]/20 p-6">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--brand-primary)]" />
                AI Strategy Insight
              </h3>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                By switching to the <span className="font-bold">{displayResult.recommendedRegime} regime</span> and maximizing your deductions, you reduce your effective tax rate from <span className="font-bold">{scenarios.current.recommendedRegime === 'old' ? scenarios.current.old.effectiveTaxRate.toFixed(1) : scenarios.current.new.effectiveTaxRate.toFixed(1)}%</span> to <span className="font-bold text-[var(--success)]">{displayResult.recommendedRegime === 'old' ? displayResult.old.effectiveTaxRate.toFixed(1) : displayResult.new.effectiveTaxRate.toFixed(1)}%</span>.
              </p>
              <div className="mt-6 p-4 rounded-xl bg-white/50 border border-white/20">
                <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-1">Impact per ₹1 invested</p>
                <p className="text-lg font-bold text-[var(--brand-primary)]">Save ₹0.31 <span className="text-xs font-normal text-[var(--text-secondary)]">in tax</span></p>
              </div>
            </GlowCard>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Regime Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">Old Regime (Maxed)</span>
                  <span className="font-semibold">{formatRupee(displayResult.old.totalTax)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-secondary)]">New Regime (Flat)</span>
                  <span className="font-semibold">{formatRupee(displayResult.new.totalTax)}</span>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Difference</span>
                    <span className="text-sm font-bold text-[var(--success)]">{formatRupee(Math.abs(displayResult.old.totalTax - displayResult.new.totalTax))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning-bg)] p-5">
              <div className="flex gap-3">
                <Calendar className="text-[var(--warning)] shrink-0" size={18} />
                <div>
                  <p className="text-sm font-bold text-[var(--warning)]">FY Deadline</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    You have until March 31, 2026 to complete these investments and submit proofs to your HR.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <AIAssistantWidget />
    </div>
  )
}
