"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sliders, Info } from 'lucide-react'
import { WhatIfSimulator, MetricCard, InsightCard } from '@/components/ui'
import { useTaxStore } from '@/lib/stores/tax-store'
import { formatRupee } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

export default function SimulatorPage() {
  const router = useRouter()
  const { taxResult, whatIfResult, activeScenarioMode } = useTaxStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!taxResult) {
      router.push('/upload')
    }
  }, [taxResult, router])

  if (!mounted || !taxResult) return null

  // Show the live simulation result if available, otherwise fallback to the current reality taxResult
  const currentResult = whatIfResult || taxResult
  
  const recommendedRegime = currentResult.recommendedRegime
  const isOldRecommended = recommendedRegime === 'old'
  
  const oldTax = currentResult.old.totalTax
  const newTax = currentResult.new.totalTax
  const oldSavings = Math.max(0, newTax - oldTax)
  const newSavings = Math.max(0, oldTax - newTax)

  return (
    <div className="min-h-screen flex flex-col relative z-20">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center gap-4">
        <button onClick={() => router.push('/result')} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sliders size={20} className="text-[var(--brand-primary)]" />
            What-If Simulator
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Tweak investments and immediately see the tax impact.</p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pb-24 grid lg:grid-cols-2 gap-12 mt-6">
        {/* Left Pane: Simulator */}
        <div>
          <WhatIfSimulator />
        </div>

        {/* Right Pane: Live Impact */}
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Live Comparison</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Old Regime Card */}
              <div className={cn(
                "p-5 rounded-2xl border relative overflow-hidden transition-all duration-300",
                isOldRecommended 
                  ? "border-[var(--brand-primary)] shadow-2xl bg-gradient-to-br from-white/90 to-white/40 dark:from-white/20 dark:to-white/5 ring-1 ring-white/60 dark:ring-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.1)] backdrop-blur-[40px]" 
                  : "border-[var(--border-subtle)] bg-white/30 dark:bg-black/40 dark:border-white/10 backdrop-blur-md opacity-70 hover:opacity-100"
              )}>
                {isOldRecommended && (
                  <div className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest mb-2">Recommended</div>
                )}
                <h4 className="text-[var(--text-primary)] font-semibold mb-1 relative z-10">Old Regime</h4>
                <div className="text-3xl font-bold font-mono text-[var(--text-primary)] mb-3 relative z-10">
                  {formatRupee(oldTax)}
                </div>
                {isOldRecommended && oldSavings > 0 && (
                  <p className="text-xs text-[var(--success)] font-semibold bg-[var(--success)]/10 inline-block px-2 py-1 rounded relative z-10">
                    Saves {formatRupee(oldSavings)}
                  </p>
                )}
              </div>

              {/* New Regime Card */}
              <div className={cn(
                "p-5 rounded-2xl border relative overflow-hidden transition-all duration-300",
                !isOldRecommended 
                  ? "border-[var(--brand-primary)] shadow-2xl bg-gradient-to-br from-white/90 to-white/40 dark:from-white/20 dark:to-white/5 ring-1 ring-white/60 dark:ring-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(255,255,255,0.1)] backdrop-blur-[40px]" 
                  : "border-[var(--border-subtle)] bg-white/30 dark:bg-black/40 dark:border-white/10 backdrop-blur-md opacity-70 hover:opacity-100"
              )}>
                {!isOldRecommended && (
                  <div className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest mb-2">Recommended</div>
                )}
                <h4 className="text-[var(--text-primary)] font-semibold mb-1 relative z-10">New Regime</h4>
                <div className="text-3xl font-bold font-mono text-[var(--text-primary)] mb-3 relative z-10">
                  {formatRupee(newTax)}
                </div>
                {!isOldRecommended && newSavings > 0 && (
                  <p className="text-xs text-[var(--success)] font-semibold bg-[var(--success)]/10 inline-block px-2 py-1 rounded relative z-10">
                    Saves {formatRupee(newSavings)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Educational Note */}
          <div className="p-5 rounded-2xl bg-white/40 dark:bg-white/[0.03] backdrop-blur-xl border border-[var(--border-subtle)] dark:border-white/5 mt-4 shadow-sm">
            <h3 className="text-[13px] font-bold text-[var(--brand-primary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info size={14} /> How this works
            </h3>
            <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                This simulator helps you discover if investing more money can lower your final tax bill. The sliders on the left represent optional tax-saving investments you can make (like ELSS funds, PPF, or Health Insurance).
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">The Catch:</strong> These investments only reduce your taxes if you choose the <strong>Old Regime</strong>. The New Regime offers lower baseline rates but completely ignores these investments.
              </p>
              <p>
                <strong className="text-[var(--text-primary)]">Your Goal:</strong> Move the sliders to see if you can drive the Old Regime tax lower than the New Regime tax. If the Old Regime becomes cheaper, the recommendation will flip, and any additional money you invest is actively saving you taxes!
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
