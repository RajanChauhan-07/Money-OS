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
    <div className="min-h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-white/20 dark:bg-white/[0.01] backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
        <button 
          onClick={() => router.push('/result')} 
          className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
        >
          <ArrowLeft size={16} />
          Back to Analysis
        </button>
        <div className="flex items-center gap-6">
          <Button variant="outline" size="sm" className="rounded-xl border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5">
            <Download size={14} className="mr-2" />
            Export Roadmap
          </Button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-8 py-10 space-y-10">
        {/* Strategy Hero */}
        <section className="relative overflow-hidden rounded-[3rem] border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 p-8 md:p-12 shadow-xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[var(--brand-primary)]/5 via-transparent to-[var(--brand-secondary)]/5 -z-10" />
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--success)]/30 bg-[var(--success-bg)]/50 px-4 py-1.5 mb-8 backdrop-blur-md">
              <ShieldCheck size={16} className="text-[var(--success)]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--success)]">Verified Tax Strategy</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-6 md:text-6xl leading-[1.1]">
              Your Monthly <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)]">Investment Schedule</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-10 max-w-2xl">
              To achieve the maximum saving of <span className="text-[var(--success)] font-bold">{formatRupee(scenarios.current.lossMeter)}</span>, follow this monthly SIP schedule for the remaining FY.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 rounded-[2rem] bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/5 shadow-inner backdrop-blur-md">
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-[0.2em] mb-2 opacity-70">Total Investment</span>
                <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{formatRupee(totalAnnual)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-[0.2em] mb-2 opacity-70">Monthly SIP</span>
                <span className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{formatRupee(monthlyInvest)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-[0.2em] mb-2 opacity-70">Efficiency Boost</span>
                <span className="text-3xl font-bold text-[var(--success)] tracking-tight">+{100 - scenarios.current.taxEfficiencyScore}%</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          {/* Main Content */}
          <div className="space-y-10">
            {/* Execution Checklist */}
            <section>
              <div className="flex justify-between items-center mb-8 px-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <Target size={24} />
                  </div>
                  Execution Checklist
                </h2>
                {feasibility && (
                  <span className={cn(
                    "text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm",
                    feasibility === 'easy' ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30" :
                    feasibility === 'moderate' ? "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30" :
                    "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30"
                  )}>
                    {feasibility === 'stretch' ? 'Stretch Goal' : `${feasibility} Plan`}
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {allocations.map((item, i) => {
                   const stepId = `step-${i}`;
                   const isCompleted = completedSteps.includes(stepId);
                   return (
                    <motion.div 
                      key={i}
                      layout
                      className={cn(
                        "group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-500",
                        isCompleted 
                          ? "bg-white/20 dark:bg-white/[0.02] border-[var(--success)]/20 opacity-70" 
                          : "bg-white/40 dark:bg-white/5 border-white/20 dark:border-white/5 hover:border-[var(--brand-primary)]/40 hover:shadow-2xl hover:bg-white/50 dark:hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-start gap-5">
                        <button 
                          onClick={() => toggleStep(stepId)}
                          className={cn(
                            "mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm",
                            isCompleted 
                              ? "bg-[var(--success)] border-[var(--success)] text-white scale-110" 
                              : "border-[var(--border-default)] group-hover:border-[var(--brand-primary)] group-hover:scale-105"
                          )}
                        >
                          {isCompleted && <CheckCircle2 size={18} />}
                        </button>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] opacity-70">{item.section}</span>
                            <span className="text-sm font-bold text-[var(--text-primary)]">{formatRupee(item.monthlyAmount)} / mo</span>
                          </div>
                          <h3 className={cn("text-lg font-bold transition-all duration-300 tracking-tight", isCompleted ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]")}>
                            Start SIP in {item.instrument}
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-4 text-xs">
                             <div className="px-3 py-1 rounded-lg bg-white/20 dark:bg-white/5 border border-white/10 text-[var(--text-secondary)]">
                               Risk: <span className="font-bold text-[var(--text-primary)] capitalize">{item.risk}</span>
                             </div>
                             <div className="px-3 py-1 rounded-lg bg-white/20 dark:bg-white/5 border border-white/10 text-[var(--text-secondary)]">
                               Lock-in: <span className="font-bold text-[var(--text-primary)]">{item.lockIn}Y</span>
                             </div>
                            {item.taxSaving && (
                              <div className="px-3 py-1 rounded-lg bg-[var(--success-bg)]/50 border border-[var(--success)]/20 text-[var(--success)] font-bold">
                                Saves {formatRupee(item.taxSaving)} tax
                              </div>
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
                                <div className="mt-6 pt-6 border-t border-white/10 dark:border-white/5 flex flex-wrap gap-3">
                                  {getBrokerLinksForInstrument(item.instrument.includes('ELSS') ? 'ELSS' : item.section as any).map((broker) => (
                                    <a 
                                      key={broker.name} 
                                      href={broker.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 hover:scale-105 active:scale-95 transition-all text-xs font-bold shadow-sm"
                                    >
                                      <span className="text-lg">{broker.logo}</span>
                                      {broker.name}
                                      <ExternalLink size={12} className="opacity-40" />
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
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3 px-2">
                <div className="p-2 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                  <Calendar size={24} />
                </div>
                Cash Flow Timeline
              </h2>
              <div className="rounded-[2.5rem] border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 p-8 shadow-xl backdrop-blur-xl">
                <div className="space-y-8">
                  {monthlyPlan.slice(0, 5).map((month, i) => (
                    <div key={i} className="relative flex items-center gap-8">
                      {i !== 4 && <div className="absolute left-6 top-12 w-0.5 h-12 bg-gradient-to-b from-[var(--brand-primary)]/20 to-transparent" />}
                      <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10 flex flex-col items-center justify-center shrink-0 shadow-sm z-10">
                        <span className="text-[11px] font-black text-[var(--brand-primary)] uppercase tracking-tighter leading-none">
                          {new Date(month.year, month.month - 1).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-between bg-white/40 dark:bg-white/5 rounded-[1.75rem] border border-white/20 dark:border-white/10 px-8 py-5 group hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-300 shadow-sm">
                        <div>
                          <p className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">Invest {formatRupee(month.investableAmount)}</p>
                          <p className="text-[11px] text-[var(--text-tertiary)] font-medium mt-0.5 opacity-70">Projected Take-home: {formatRupee(month.income - month.investableAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-[var(--success)] uppercase tracking-widest mb-1">Liquid</p>
                          <p className="text-xs font-bold text-[var(--text-secondary)]">{month.sipDebitDate}th Monthly</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 pt-6 border-t border-white/10 dark:border-white/5 text-center px-4">
                  <p className="text-[11px] text-[var(--text-tertiary)] font-medium italic opacity-70">
                    Projections assume your monthly salary structure remains constant for the rest of the FY.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <GlowCard customSize glowColor="blue" borderRadius={40} className="bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 p-8 rounded-[2.5rem] backdrop-blur-2xl shadow-xl">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-3 mb-4">
                <div className="p-1.5 rounded-lg bg-[var(--brand-primary)]/10">
                  <Sparkles size={20} className="text-[var(--brand-primary)]" />
                </div>
                AI Strategy Insight
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                By switching to the <span className="font-bold text-[var(--text-primary)]">{displayResult.recommendedRegime} regime</span> and maximizing your deductions, you reduce your effective tax rate from <span className="font-bold">{scenarios.current.recommendedRegime === 'old' ? scenarios.current.old.effectiveTaxRate.toFixed(1) : scenarios.current.new.effectiveTaxRate.toFixed(1)}%</span> to <span className="font-bold text-[var(--success)]">{displayResult.recommendedRegime === 'old' ? displayResult.old.effectiveTaxRate.toFixed(1) : displayResult.new.effectiveTaxRate.toFixed(1)}%</span>.
              </p>
              <div className="mt-8 p-6 rounded-[2rem] bg-gradient-to-br from-white/60 to-white/30 dark:from-white/10 dark:to-white/5 border border-white/30 dark:border-white/10 shadow-inner">
                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-tertiary)] mb-2 opacity-60">Impact per ₹1 invested</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[var(--brand-primary)] tracking-tighter">Save ₹0.31</span>
                  <span className="text-xs font-bold text-[var(--text-secondary)] opacity-70">in tax</span>
                </div>
              </div>
            </GlowCard>

            <Card className="rounded-[2.5rem] border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-white/10 dark:border-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-70">Regime Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-5">
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Old Regime (Maxed)</span>
                  <span className="text-base font-bold text-[var(--text-primary)]">{formatRupee(displayResult.old.totalTax)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">New Regime (Flat)</span>
                  <span className="text-base font-bold text-[var(--text-primary)]">{formatRupee(displayResult.new.totalTax)}</span>
                </div>
                <div className="pt-6 border-t border-white/10 dark:border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Total Savings</span>
                    <div className="px-4 py-1.5 rounded-xl bg-[var(--success-bg)]/50 border border-[var(--success)]/20">
                      <span className="text-lg font-black text-[var(--success)] tracking-tight">{formatRupee(Math.abs(displayResult.old.totalTax - displayResult.new.totalTax))}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-[2.5rem] border border-[var(--warning)]/20 bg-[var(--warning-bg)]/30 p-8 backdrop-blur-xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--warning)]/5 blur-3xl rounded-full -z-10 group-hover:scale-150 transition-transform duration-1000" />
              <div className="flex gap-5 items-start">
                <div className="p-3 rounded-2xl bg-[var(--warning)]/10 text-[var(--warning)] shadow-inner">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-base font-black text-[var(--warning)] tracking-tight">FY Deadline</p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)] font-medium leading-relaxed opacity-80">
                    You have until March 31, 2026 to complete these investments and submit proofs to your HR to claim these savings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
    </div>
  )
}
