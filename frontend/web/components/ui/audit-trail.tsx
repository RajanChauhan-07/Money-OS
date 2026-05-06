'use client'

import { motion } from 'framer-motion'
import { AuditStep } from '@money-os/types'
import { formatRupee } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { Calculator } from 'lucide-react'
import { InfoTooltip } from './info-tooltip'

interface AuditTrailProps {
  steps: AuditStep[]
}

const getJargonTooltip = (label: string) => {
  if (label.includes('New Regime slabs')) {
    return 'Standard New Regime Slabs (AY 2026-27):\n• ₹0 - ₹4L: Nil\n• ₹4L - ₹8L: 5%\n• ₹8L - ₹12L: 10%\n• ₹12L - ₹16L: 15%\n• ₹16L - ₹20L: 20%\n• ₹20L - ₹24L: 25%\n• Above ₹24L: 30%'
  }
  if (label.includes('Income Tax') && !label.includes('New Regime')) {
    return 'Standard Old Regime Slabs (AY 2026-27):\n• ₹0 - ₹2.5L: Nil\n• ₹2.5L - ₹5L: 5%\n• ₹5L - ₹10L: 20%\n• Above ₹10L: 30%\n(Note: Slabs vary for Senior Citizens)'
  }

  const map: Record<string, string> = {
    'Gross Income': 'Your total yearly earnings before any tax cuts.',
    'Total Deductions': 'Portion of income that is tax-free by law.',
    'Taxable Income': 'The actual amount you pay tax on after all deductions.',
    'Tax Before Cess': 'Base tax calculated on your income before the final 4% fee.',
    'Rebate Under 87A': 'A tax waiver if your income is below the government limit.',
    'Surcharge': 'An additional tax for high-income earners.',
    'Health & Education Cess': 'A mandatory 4% fee on your base tax for public welfare.',
    'Final Tax Liability': 'The final tax amount you need to pay for the year.',
  }
  return map[label] || null
}

export function AuditTrail({ steps }: AuditTrailProps) {
  return (
    <div className="space-y-6 relative">
      {/* Dynamic line that connects the steps */}
      <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[var(--brand-primary)] via-[var(--warning)] to-transparent opacity-20" />
      
      {steps.map((step, idx) => {
        const isFinal = idx === steps.length - 1
        const tooltip = getJargonTooltip(step.label)

        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative pl-12 group"
          >
            {/* Step Node */}
            <div className={cn(
              "absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg z-10 transition-all group-hover:scale-110",
              isFinal 
                ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--text-inverse)] shadow-[0_4px_12px_rgba(var(--brand-primary-rgb),0.2)]" 
                : "bg-white/80 dark:bg-white/10 border-black/[0.05] dark:border-white/[0.15] text-black/40 dark:text-white/40"
            )}>
              {isFinal ? (
                <span className="font-bold text-lg">₹</span>
              ) : (
                <span className="text-xs font-bold font-mono">{step.step}</span>
              )}
            </div>
            
            {/* Step Card */}
            <div className={cn(
              "p-5 rounded-2xl border transition-all duration-300",
              isFinal 
                ? "bg-white/80 dark:bg-white/[0.1] border-black/[0.1] dark:border-white/[0.2] shadow-lg" 
                : "bg-white/40 dark:bg-white/[0.06] border-black/[0.05] dark:border-white/[0.1] hover:border-black/10 dark:hover:border-white/20 hover:bg-white/60 dark:hover:bg-white/[0.1]"
            )}>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.15em]",
                    isFinal ? "text-[var(--brand-primary)]" : "text-black/30 dark:text-white/20"
                  )}>
                    {isFinal ? 'Final Calculation' : `Phase ${step.step}`}
                  </span>
                  {step.isDeduction && (
                    <span className="text-[9px] bg-[var(--success)]/10 text-[var(--success)] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      Tax Saving
                    </span>
                  )}
                </div>
                
                <h5 className={cn(
                  "text-base flex items-center gap-2",
                  isFinal ? "text-black dark:text-white font-black" : "text-black/90 dark:text-white/90 font-bold"
                )}>
                  {step.label.includes('Income Tax') ? 'Income Tax (as per slabs)' : step.label}
                  {tooltip && <InfoTooltip text={tooltip} />}
                </h5>
                
                {step.formula && !isFinal && (
                  <div className="mt-4 py-3 px-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.08] border border-black/[0.05] dark:border-white/[0.1] flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/60 dark:bg-black/40 flex items-center justify-center shrink-0">
                      <Calculator size={12} className="text-[var(--brand-primary)]" />
                    </div>
                    <p className="text-[11px] font-mono text-black/50 dark:text-white/50 tracking-tight leading-relaxed">
                      {step.formula}
                    </p>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-black/[0.05] dark:border-white/[0.05] grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", step.isDeduction ? "bg-[var(--success)]" : "bg-black/20 dark:bg-white/20")} />
                      <p className="text-[9px] text-black/30 dark:text-white/30 uppercase font-black tracking-widest">Impact</p>
                    </div>
                    <p className={cn(
                      "text-lg font-black font-mono leading-none",
                      step.isDeduction ? "text-[var(--success)]" : "text-black/90 dark:text-white"
                    )}>
                      {step.isDeduction ? '-' : ''}{formatRupee(step.amount)}
                    </p>
                  </div>
                  <div className="text-right border-l border-black/[0.05] dark:border-white/[0.05] pl-4">
                    <p className="text-[9px] text-black/30 dark:text-white/30 uppercase font-black tracking-widest mb-1">Running Balance</p>
                    <p className="text-sm font-bold font-mono text-black/60 dark:text-white/60">
                      {formatRupee(step.running)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
