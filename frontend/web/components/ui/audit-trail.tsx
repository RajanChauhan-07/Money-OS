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
  const map: Record<string, string> = {
    'Gross Income': 'Total earnings before any tax deductions or exemptions.',
    'Total Deductions': 'Legal exemptions that reduce the amount you pay tax on.',
    'Taxable Income': 'Income after deductions. This is the amount the government actually taxes.',
    'Tax Before Cess': 'Base tax calculated on your taxable income, before the mandatory 4% health & education tax.',
    'Rebate Under 87A': 'A tax discount given by the government if your income is below a certain threshold.',
    'Surcharge': 'An extra tax levied on high earners (usually incomes over ₹50 Lakhs).',
    'Health & Education Cess': 'A mandatory 4% tax added on top of your base tax, used to fund public services.',
    'Final Tax Liability': 'The final amount of tax you owe to the government for the year.',
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
                ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)]" 
                : "bg-[#161618] border-white/10 text-white/50"
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
                ? "bg-white/[0.05] border-white/20 shadow-xl" 
                : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
            )}>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-[0.1em]",
                    isFinal ? "text-[var(--brand-primary)]" : "text-white/40"
                  )}>
                    {isFinal ? 'Final Computation' : `Step ${step.step}`}
                  </span>
                  {step.isDeduction && (
                    <span className="text-[10px] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded-full font-bold uppercase">
                      Deduction
                    </span>
                  )}
                </div>
                
                <h5 className={cn(
                  "text-lg flex items-center gap-2",
                  isFinal ? "text-white font-black" : "text-white/90 font-bold"
                )}>
                  {step.label}
                  {tooltip && <InfoTooltip text={tooltip} />}
                </h5>
                
                {step.formula && !isFinal && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-white/40 bg-black/40 p-2.5 rounded-lg border border-white/5 overflow-x-auto">
                    <Calculator size={14} className="shrink-0 text-[var(--brand-primary)]" />
                    <span>{step.formula}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Amount</p>
                    <p className={cn(
                      "text-xl font-black font-mono leading-none",
                      step.isDeduction ? "text-[var(--success)]" : "text-white"
                    )}>
                      {step.isDeduction ? '-' : ''}{formatRupee(step.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Running Total</p>
                    <p className="text-sm font-bold font-mono text-white/60">
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
