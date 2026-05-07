'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, Sparkles, ArrowLeft, Share2, Save, Check, Target, AlertCircle, TrendingUp, Info, Sliders, FileText, X, Download } from 'lucide-react'
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
    scenarios,
    pdfUrl
  } = useTaxStore()
  
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)

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
        {/* Scenario Toggle & Action */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full flex flex-col md:flex-row items-center justify-center gap-4">
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

            <div className="md:absolute md:right-0">
              <Button 
                size="sm" 
                variant="brand"
                className="shadow-lg hover:scale-[1.02] transition-all duration-300"
                onClick={() => router.push('/plan/summary')}
              >
                {isOptimized ? "View Actionable Roadmap" : "Show My Investment Plan"}
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
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
          <div className={cn(
            "flex flex-col gap-6 px-6 py-6 md:px-8",
            (taxResult.lossMeter > 0 || isOptimized) ? "md:flex-row md:items-center justify-between md:py-8" : "items-center text-center max-w-4xl mx-auto md:py-6"
          )}>
            <div className={cn("flex-1", (taxResult.lossMeter > 0 || isOptimized) ? "max-w-2xl" : "flex flex-col items-center")}>
              <div className={cn("flex flex-wrap items-center gap-3", !(taxResult.lossMeter > 0 || isOptimized) && "justify-center")}>
                <span className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]",
                  isOptimized ? "border-[var(--success)]/20 bg-[var(--success-bg)] text-[var(--success)]" : isCustom ? "border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]" : "border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                )}>
                  {isOptimized ? "Full Optimization" : isCustom ? "Custom Scenario" : "Current Reality"}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">FY 2025-26</span>
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
                {isOptimized 
                  ? `Save up to ${formatRupee(taxResult.savingsWithRecommended)} more.`
                  : (taxResult.recommendedRegime === 'old' ? 'Old regime saves you more.' : 'New regime is better for you.')}
              </h1>
              <p className={cn("mt-3 text-base leading-relaxed text-[var(--text-secondary)]", !(taxResult.lossMeter > 0 || isOptimized) && "max-w-2xl mx-auto")}>
                {isOptimized 
                  ? "By maximizing Section 80C, 80D, and NPS, you can unlock significant tax savings and build long-term wealth."
                  : taxResult.reasoning}
              </p>
              
              <div className={cn("mt-6 flex flex-wrap gap-3", !(taxResult.lossMeter > 0 || isOptimized) && "justify-center")}>
                <Button size="lg" variant="outline" onClick={() => setIsPdfModalOpen(true)}>
                  <FileText size={16} className="mr-2" />
                  View PDF
                </Button>
              </div>
            </div>

            {(taxResult.lossMeter > 0 || isOptimized) && (
              <div className="w-full md:w-auto md:min-w-[320px] shrink-0">
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
            )}
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

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPdfModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg-base)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <div className="flex items-center gap-2">
                  <FileText className="text-[var(--brand-primary)]" size={20} />
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Uploaded Form 16</h2>
                </div>
                <div className="flex items-center gap-2">
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download="Form-16.pdf"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20 transition-colors text-xs font-medium mr-2"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => setIsPdfModalOpen(false)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className={cn("flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-950 flex justify-center", pdfUrl ? "p-0 min-h-[75vh]" : "p-6 md:p-10 min-h-[60vh]")}>
                {pdfUrl ? (
                  <embed 
                    src={pdfUrl}
                    type="application/pdf"
                    className="w-full h-[75vh] border-0"
                  />
                ) : (
                  <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 space-y-8 h-max my-auto">
                    {/* Fake PDF Skeleton */}
                    <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-8">
                      <div className="space-y-3 w-1/2">
                        <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-1/2 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                      </div>
                      <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                      <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                      <div className="h-4 w-4/6 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 pt-6">
                      <div className="h-32 bg-zinc-50 dark:bg-zinc-800/30 rounded border border-zinc-100 dark:border-zinc-800/50" />
                      <div className="h-32 bg-zinc-50 dark:bg-zinc-800/30 rounded border border-zinc-100 dark:border-zinc-800/50" />
                    </div>
                    
                    <div className="h-48 bg-zinc-50 dark:bg-zinc-800/30 rounded border border-zinc-100 dark:border-zinc-800/50 mt-6" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
