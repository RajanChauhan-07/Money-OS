'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTaxStore } from '@/lib/stores/tax-store'
import { formatRupee } from '@/lib/utils/format'
import { FY_2025_26 } from '@money-os/tax-engine'
import { WhatIfState } from '@money-os/types'
import { Sliders, RefreshCw, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

// Simple debouncer hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function WhatIfSimulator() {
  const { taxInput, taxResult, whatIfResult, computeWhatIf, setActiveScenarioMode } = useTaxStore()

  // Initialize state based on current deductions
  const [state, setState] = useState<WhatIfState>({
    section80C: 0,
    section80D_self: 0,
    section80D_parents: 0,
    nps: 0,
    monthlyRent: 0,
    homeLoanInterest: 0
  })

  // Set initial values from input when mounted
  useEffect(() => {
    if (taxInput) {
      const raw80C = (taxInput.investments.ppfAnnual || 0) +
        (taxInput.investments.licPremiumAnnual || 0) +
        (taxInput.investments.elssAnnual || 0) +
        (taxInput.investments.nscAnnual || 0) +
        (taxInput.investments.ssyAnnual || 0) +
        (taxInput.investments.tuitionFees || 0) +
        (taxInput.investments.epfEmployee || 0) +
        (taxInput.investments.otherSection80C || 0) +
        (taxInput.life.homeLoanPrincipalAnnual || 0)

      setState({
        section80C: Math.min(raw80C, FY_2025_26.deductionLimits.section80C),
        section80D_self: Math.min(taxInput.life.selfHealthPremium + taxInput.life.familyHealthPremium, FY_2025_26.deductionLimits.section80D_self),
        section80D_parents: Math.min(taxInput.life.parentHealthPremium, taxInput.life.hasSeniorParents ? FY_2025_26.deductionLimits.section80D_parents_senior : FY_2025_26.deductionLimits.section80D_parents),
        nps: Math.min(taxInput.investments.npsEmployee, FY_2025_26.deductionLimits.section80CCD1B),
        monthlyRent: taxInput.structure.monthlyRent,
        homeLoanInterest: Math.min(taxInput.life.homeLoanInterestAnnual, FY_2025_26.deductionLimits.section24b)
      })
    }
  }, [taxInput])

  const debouncedState = useDebounce(state, 50)

  // Trigger recalculation when debounced state changes
  useEffect(() => {
    if (taxInput) {
      computeWhatIf(debouncedState)
    }
  }, [debouncedState, taxInput, computeWhatIf])

  const handleReset = () => {
    setActiveScenarioMode('current')
  }

  // Delta calculation (current vs what-if) based specifically on Old Regime
  // since these deduction sliders only impact the Old Regime tax.
  const baseTax = taxResult ? taxResult.old.totalTax : 0
  const simTax = whatIfResult ? whatIfResult.old.totalTax : 0
  const delta = baseTax - simTax

  return (
    <div className="surface-elevated rounded-2xl border overflow-hidden">
      <div className="bg-white/30 dark:bg-black/20 p-4 border-b border-[var(--border-subtle)] flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
          <Sliders size={18} className="text-[var(--brand-primary)]" />
          <h2>What-If Simulator</h2>
        </div>
        <button 
          onClick={handleReset}
          className="text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
        >
          <RefreshCw size={12} /> Reset
        </button>
      </div>

      <div className="p-6 space-y-6">
        <SliderControl 
          label="Section 80C (ELSS, PPF, EPF)" 
          value={state.section80C} 
          max={FY_2025_26.deductionLimits.section80C} 
          onChange={(v) => setState(s => ({ ...s, section80C: v }))} 
        />
        <SliderControl 
          label="NPS Tier 1 (80CCD 1B)" 
          value={state.nps} 
          max={FY_2025_26.deductionLimits.section80CCD1B} 
          onChange={(v) => setState(s => ({ ...s, nps: v }))} 
        />
        <SliderControl 
          label="Health Insurance (Self/Family)" 
          value={state.section80D_self} 
          max={FY_2025_26.deductionLimits.section80D_self} 
          onChange={(v) => setState(s => ({ ...s, section80D_self: v }))} 
        />
        
        {/* Real-time Impact Indicator */}
        <motion.div 
          layout
          className={cn(
            "mt-6 p-4 rounded-xl flex items-center justify-between border",
            delta > 0 ? "bg-[var(--success)]/10 border-[var(--success)]/20" :
            delta < 0 ? "bg-[var(--danger)]/10 border-[var(--danger)]/20" :
            "bg-white/20 dark:bg-black/20 border-[var(--border-subtle)] backdrop-blur-sm"
          )}
        >
          <div className="flex items-center gap-3">
            <Calculator 
              size={20} 
              className={cn(
                delta > 0 ? "text-[var(--success)]" :
                delta < 0 ? "text-[var(--danger)]" :
                "text-[var(--text-tertiary)]"
              )} 
            />
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Old Regime Tax Impact</p>
              <p className={cn(
                "text-sm font-bold",
                delta > 0 ? "text-[var(--success)]" :
                delta < 0 ? "text-[var(--danger)]" :
                "text-[var(--text-primary)]"
              )}>
                {delta > 0 ? `Tax drops by ${formatRupee(Math.abs(delta))}` : delta < 0 ? `Tax increases by ${formatRupee(Math.abs(delta))}` : 'No change'}
              </p>
            </div>
          </div>
          {delta !== 0 && (
            <button 
              onClick={() => setActiveScenarioMode('custom')}
              className="px-3 py-1.5 text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors shadow-sm"
            >
              Apply to Result
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}

import * as Slider from '@radix-ui/react-slider'

function SliderControl({ label, value, max, onChange }: { label: string, value: number, max: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        <span className="text-sm font-bold text-[var(--text-primary)] font-mono bg-white/40 dark:bg-black/20 px-2 py-1 rounded-md border border-[var(--border-subtle)]">{formatRupee(value)}</span>
      </div>
      
      <Slider.Root 
        className="relative flex items-center select-none touch-none w-full h-5 group"
        value={[value]}
        max={max}
        step={1000}
        onValueChange={(vals) => onChange(vals[0])}
      >
        <Slider.Track className="bg-white/30 dark:bg-black/30 border border-[var(--border-subtle)] relative grow rounded-full h-3 overflow-hidden shadow-inner">
          <Slider.Range className="absolute bg-[var(--brand-primary)] h-full rounded-full transition-all duration-100" />
        </Slider.Track>
        <Slider.Thumb className="block w-6 h-6 bg-white border-2 border-[var(--brand-primary)] shadow-md rounded-full hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[var(--brand-primary)]/20 transition-transform cursor-grab active:cursor-grabbing" />
      </Slider.Root>

      <div className="flex justify-between text-[11px] text-[var(--text-tertiary)] font-mono px-1">
        <span>₹0</span>
        <span>Max: {formatRupee(max)}</span>
      </div>
    </div>
  )
}
