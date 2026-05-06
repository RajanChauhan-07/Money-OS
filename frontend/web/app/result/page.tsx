'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, Sparkles, ArrowLeft, Share2, Save, Check, Target, AlertCircle, TrendingUp, Info, Sliders } from 'lucide-react'
import { Button } from '@money-os/ui'
import { MetricCard, RegimeCard, InsightCard, AIAssistantWidget, LanguageToggle } from '@/components/ui'
import { useTaxStore } from '@/lib/stores/tax-store'
import { formatRupee } from '@/lib/utils/format'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function TaxResultPage() {
  const router = useRouter()
  const { 
    taxResult, 
    hasResult, 
    taxInput, 
    savePlan, 
    activeScenarioMode, 
    setActiveScenarioMode,
    scenarios 
  } = useTaxStore()
  
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    setMounted(true)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [supabase.auth])

  // Redirect if no result
  useEffect(() => {
    if (mounted && !hasResult) {
      router.push('/upload')
    }
  }, [mounted, hasResult, router])

  if (!mounted || !taxResult || !taxInput || !scenarios) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleSave = async () => {
    if (!user) {
      router.push('/login?next=/result')
      return
    }
    setIsSaving(true)
    const { success } = await savePlan()
    setIsSaving(false)
    if (success) {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    }
  }

  const recommended = taxResult.recommendedRegime === 'old' ? taxResult.old : taxResult.new
  const isOptimized = activeScenarioMode === 'optimized'
  const isCustom = activeScenarioMode === 'custom'

  // The insights available on the current active result mode
  const currentInsights = taxResult.insights || []

  return (
    <div className="min-h-screen flex flex-col relative z-20">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <button onClick={() => router.push('/review')} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-secondary)]">
            <Share2 size={18} />
          </button>
          <Button 
            variant={isSaved ? "success" : "outline"} 
            size="sm" 
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaved}
          >
            {isSaved ? <Check size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
            {isSaved ? 'Saved' : 'Save my plan'}
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pb-24 space-y-12">
        {/* Scenario Toggle */}
        <div className="flex flex-col items-center gap-4">
           <div className="flex p-1.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-inner">
            <button 
              onClick={() => setActiveScenarioMode('current')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
                !isOptimized && !isCustom
                  ? "bg-[var(--bg-base)] text-[var(--brand-primary)] shadow-lg scale-[1.02]" 
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              Current Status
            </button>
            <button 
              onClick={() => setActiveScenarioMode('optimized')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                isOptimized 
                  ? "bg-[var(--bg-base)] text-[var(--success)] shadow-lg scale-[1.02]" 
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Sparkles size={14} />
              Optimized Plan
            </button>
          </div>
          <AnimatePresence mode="wait">
            {isOptimized && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-[var(--success)] font-medium bg-[var(--success-bg)] px-3 py-1 rounded-full border border-[var(--success)]/20">
                Showing potential savings if you follow our investment roadmap
              </motion.p>
            )}
            {isCustom && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-[var(--warning)] font-medium bg-[var(--warning)]/10 px-3 py-1 rounded-full border border-[var(--warning)]/20">
                You are viewing a custom What-If scenario
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 1. Hero Decision Section */}
        <motion.section
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "surface-panel overflow-hidden border-t-4",
            isOptimized ? "border-t-[var(--success)]" : isCustom ? "border-t-[var(--warning)]" : "border-t-[var(--brand-primary)]"
          )}
        >
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]",
                  isOptimized ? "border-[var(--success)]/20 bg-[var(--success-bg)] text-[var(--success)]" : isCustom ? "border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]" : "border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                )}>
                  {isOptimized ? "Full Optimization" : isCustom ? "Custom Scenario" : "Current Reality"}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">FY 2025-26</span>
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                {isOptimized 
                  ? `Save up to ${formatRupee(taxResult.savingsWithRecommended)} more.`
                  : (taxResult.recommendedRegime === 'old' ? 'Old regime saves you more.' : 'New regime is better for you.')}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                {isOptimized 
                  ? "By maximizing Section 80C, 80D, and NPS, you can unlock significant tax savings and build long-term wealth."
                  : taxResult.reasoning}
              </p>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => router.push('/plan/summary')}>
                  {isOptimized ? "View Actionable Roadmap" : "Show My Investment Plan"}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>

              {/* Break-even switch strategy message */}
              {taxResult.switchStrategy && !isOptimized && (
                <div className="mt-6 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-2 max-w-md">
                  <Info size={16} className="text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)]">{taxResult.switchStrategy}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
               {/* 2. Tax Efficiency Score */}
               <div className="surface-elevated p-6 rounded-2xl border border-[var(--border-subtle)] relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-[var(--text-primary)]">Tax Efficiency Score</span>
                  <span className={cn("text-2xl font-bold font-mono", taxResult.taxEfficiencyScore > 70 ? "text-[var(--success)]" : "text-[var(--warning)]")}>
                    {taxResult.taxEfficiencyScore}%
                  </span>
                </div>
                <div className="h-3 w-full bg-[var(--bg-base)] rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${taxResult.taxEfficiencyScore}%` }}
                    className={cn("h-full", taxResult.taxEfficiencyScore > 70 ? "bg-[var(--success)]" : "bg-[var(--warning)]")}
                  />
                </div>
                <p className="mt-3 text-xs text-[var(--text-secondary)] font-medium">
                  {taxResult.taxEfficiencyScore === 100 
                    ? "Perfectly optimized! You're paying the absolute minimum." 
                    : `You are currently missing ${100 - taxResult.taxEfficiencyScore}% of your potential legal tax savings.`}
                </p>
              </div>

              {/* 3. Loss Meter */}
              {taxResult.lossMeter > 0 && !isOptimized && (
                <div className="surface-elevated p-6 rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
                      <TrendingUp size={24} className="rotate-180" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--danger)] uppercase tracking-wide">Loss Meter</p>
                      <p className="mt-1 text-3xl font-bold font-mono text-[var(--text-primary)]">
                        {formatRupee(taxResult.lossMeter)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">
                        Extra tax you're paying unnecessarily this year.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isOptimized && (
                <div className="surface-elevated p-6 rounded-2xl border border-[var(--success)]/30 bg-[var(--success-bg)] shadow-sm">
                   <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                      <Target size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--success)] uppercase tracking-wide">Projected Benefit</p>
                      <p className="mt-1 text-3xl font-bold font-mono text-[var(--text-primary)]">
                        {formatRupee(taxResult.lossMeter)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--success)]/90 font-medium">
                        Total savings if you execute the optimized plan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Comparison Metrics strip */}
        <motion.div layout className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Annual Tax Liability"
            value={formatRupee(Math.round(recommended.totalTax))}
            subValue={`incl. 4% cess`}
            trend="down"
            trendLabel="Optimized"
            accent={isOptimized ? "success" : "brand"}
          />
          <MetricCard
            label="Monthly In-hand"
            value={formatRupee(recommended.monthlyTakeHome)}
            subValue={`After TDS & deductions`}
            trend="up"
            trendLabel={isOptimized ? "Maximized" : "Current"}
          />
          <MetricCard
            label="Total Deductions"
            value={formatRupee(recommended.totalDeductions)}
            subValue={`${recommended.regime.toUpperCase()} Regime`}
            trend="neutral"
            accent={isOptimized ? "success" : "brand"}
          />
        </motion.div>

        {/* 4. Smart Nudges Strip (Insights) */}
        {currentInsights.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Smart Insights</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentInsights.slice(0, 3).map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Regime Breakdown</h2>
            <Button variant="outline" size="sm" onClick={() => router.push('/simulator')} className="hidden sm:flex">
              <Sliders size={14} className="mr-2" />
              Launch What-If Simulator
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <RegimeCard
              result={taxResult.old}
              isRecommended={taxResult.recommendedRegime === 'old'}
              savingsVsOther={taxResult.old.totalTax < taxResult.new.totalTax ? taxResult.new.totalTax - taxResult.old.totalTax : 0}
            />
            <RegimeCard
              result={taxResult.new}
              isRecommended={taxResult.recommendedRegime === 'new'}
              savingsVsOther={taxResult.new.totalTax < taxResult.old.totalTax ? taxResult.old.totalTax - taxResult.new.totalTax : 0}
            />
          </div>
          
          <Button variant="outline" className="w-full mt-4 sm:hidden" onClick={() => router.push('/simulator')}>
            <Sliders size={16} className="mr-2" />
            Launch What-If Simulator
          </Button>
        </div>

        {/* Footer disclaimer */}
        <div className="text-center pb-8 border-t border-[var(--border-subtle)] pt-8">
          <p className="text-xs text-[var(--text-tertiary)]">
            * This calculation is a detailed estimate based on FY 2025-26 rules and the inputs provided. 
            <br />
            Consult a certified Chartered Accountant before filing your final income tax return.
          </p>
        </div>
      </main>

      <AIAssistantWidget />
    </div>
  )
}
