"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sliders, ChevronRight } from 'lucide-react'
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
                "p-5 rounded-2xl border transition-all",
                isOldRecommended ? "border-[var(--brand-primary)] bg-[var(--info-bg)] shadow-md" : "border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-70"
              )}>
                {isOldRecommended && (
                  <div className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest mb-2">Recommended</div>
                )}
                <h4 className="text-[var(--text-primary)] font-semibold mb-1">Old Regime</h4>
                <div className="text-3xl font-bold font-mono text-[var(--text-primary)] mb-3">
                  {formatRupee(oldTax)}
                </div>
                {isOldRecommended && oldSavings > 0 && (
                  <p className="text-xs text-[var(--success)] font-semibold bg-[var(--success)]/10 inline-block px-2 py-1 rounded">
                    Saves {formatRupee(oldSavings)}
                  </p>
                )}
              </div>

              {/* New Regime Card */}
              <div className={cn(
                "p-5 rounded-2xl border transition-all",
                !isOldRecommended ? "border-[var(--brand-primary)] bg-[var(--info-bg)] shadow-md" : "border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-70"
              )}>
                {!isOldRecommended && (
                  <div className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest mb-2">Recommended</div>
                )}
                <h4 className="text-[var(--text-primary)] font-semibold mb-1">New Regime</h4>
                <div className="text-3xl font-bold font-mono text-[var(--text-primary)] mb-3">
                  {formatRupee(newTax)}
                </div>
                {!isOldRecommended && newSavings > 0 && (
                  <p className="text-xs text-[var(--success)] font-semibold bg-[var(--success)]/10 inline-block px-2 py-1 rounded">
                    Saves {formatRupee(newSavings)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Key Metrics</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <MetricCard
                label="Effective Tax Rate"
                value={`${((currentResult.recommendedRegime === 'old' ? currentResult.old.totalTax : currentResult.new.totalTax) / currentResult.old.grossIncome * 100).toFixed(1)}%`}
                subValue={`Of your ₹${(currentResult.old.grossIncome / 100000).toFixed(1)}L income`}
              />
              <MetricCard
                label="Annual Take-Home"
                value={formatRupee(currentResult.recommendedRegime === 'old' ? currentResult.old.annualTakeHome : currentResult.new.annualTakeHome)}
                subValue="After all taxes"
                trend="up"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
