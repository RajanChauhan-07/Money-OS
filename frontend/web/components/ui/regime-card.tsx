'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRupee } from '@/lib/utils/format'
import type { RegimeResult } from '@money-os/types'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AuditTrail } from './audit-trail'

interface RegimeCardProps {
  result: RegimeResult
  isRecommended: boolean
  savingsVsOther: number
}

export function RegimeCard({ result, isRecommended, savingsVsOther }: RegimeCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (showDetails) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [showDetails])

  const rows = [
    { label: 'Gross income', value: formatRupee(result.grossIncome) },
    { label: 'Total deductions', value: `- ${formatRupee(result.totalDeductions)}` },
    { label: 'Taxable income', value: formatRupee(result.taxableIncome), highlight: true },
    { label: 'Income tax', value: formatRupee(result.taxBeforeSurcharge) },
    ...(result.surcharge > 0 ? [{ label: 'Surcharge', value: `+ ${formatRupee(result.surcharge)}` }] : []),
    ...(result.rebate87A > 0 ? [{ label: 'Sec 87A Rebate', value: `- ${formatRupee(result.rebate87A)}` }] : []),
    { label: 'Health & education cess', value: formatRupee(result.cess) },
    { label: 'Total tax', value: formatRupee(result.totalTax), danger: true, bold: true },
    { label: 'Monthly TDS', value: formatRupee(result.monthlyTDS) },
    { label: 'Annual take-home', value: formatRupee(result.annualTakeHome), success: true, bold: true },
    { label: 'Monthly take-home', value: formatRupee(result.monthlyTakeHome), success: true },
  ]
  
  return (
    <div className={cn(
      'rounded-2xl border relative transition-all duration-300 overflow-hidden',
      isRecommended ? 'border-[var(--brand-primary)] shadow-lg' : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
    )} style={{ background: isRecommended ? 'var(--info-bg)' : 'var(--bg-surface)' }}>
      {isRecommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[var(--brand-primary)] text-[var(--text-inverse)] text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-b-xl shadow-sm z-10">
          <CheckCircle2 size={12} /> Recommended
        </div>
      )}
      
      <div className="p-6 pt-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              {result.regime === 'old' ? 'Old Regime' : 'New Regime'}
            </h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1">Marginal rate: {result.marginalRate.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Total Tax</p>
            <p className={cn("text-2xl font-bold font-mono", isRecommended ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]")}>
              {formatRupee(result.totalTax)}
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {rows.map((row) => (
            <div key={row.label} className={cn(
              'flex justify-between items-center py-2',
              (row.highlight || row.success || row.danger) && 'border-t border-[var(--border-subtle)]'
            )}>
              <span className="text-[13px] text-[var(--text-secondary)]">{row.label}</span>
              <span className={cn(
                'text-[13px] font-mono',
                row.bold && 'font-bold text-[15px]',
                row.success && 'text-[var(--success)]',
                row.danger && 'text-[var(--danger)]',
                !row.success && !row.danger && 'text-[var(--text-primary)]'
              )}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {isRecommended && savingsVsOther > 0 && (
          <div className="mt-5 p-3 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-center">
            <p className="text-[13px] text-[var(--success)] font-semibold">
              Saves you {formatRupee(savingsVsOther)} vs {result.regime === 'old' ? 'New' : 'Old'} Regime
            </p>
          </div>
        )}

        <button 
          onClick={() => setShowDetails(true)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors text-sm font-semibold text-[var(--text-secondary)]"
        >
          Show calculation details
          <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
        </button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            >
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
                onClick={() => setShowDetails(false)}
              />
              
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#0c0c0e]/90 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden backdrop-blur-3xl ring-1 ring-white/10"
              >
                {/* Background Accent Glows */}
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--brand-primary)]/10 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[var(--warning)]/10 blur-[120px] pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.01] relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/20 flex items-center justify-center border border-[var(--brand-primary)]/30">
                        <ChevronRight className="text-[var(--brand-primary)] rotate-90" size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)]">Calculation Engine</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      {result.regime === 'old' ? 'Old Regime' : 'New Regime'} <span className="text-white/40">Breakdown</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setShowDetails(false)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all hover:scale-110 active:scale-95 border border-white/5 shadow-lg"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                  <div className="grid lg:grid-cols-2 gap-16">
                    {/* Left: Deduction Breakdown */}
                    <div>
                      <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_10px_var(--brand-primary)]"></span>
                        Deduction Breakdown
                      </h4>
                      {result.deductionBreakdown && result.deductionBreakdown.length > 0 ? (
                        <div className="space-y-5">
                          {result.deductionBreakdown.map((item, i) => (
                            <div key={i} className="space-y-2 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-semibold text-white/90">{item.section}</p>
                                  <p className="text-xs text-white/50 mt-0.5">{item.label}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-mono font-bold text-white">
                                    {formatRupee(item.amount)}
                                  </p>
                                  <p className="text-[10px] text-white/40 font-mono mt-1">
                                    Max: {formatRupee(item.limit)}
                                  </p>
                                </div>
                              </div>
                              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[#6e56ff] rounded-full transition-all relative"
                                  style={{ width: `${Math.min(100, Math.max(0, (item.amount / item.limit) * 100))}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                          <p className="text-sm text-white/40">No deductions applicable under this regime.</p>
                        </div>
                      )}
                    </div>

                    {/* Right: Audit Trail */}
                    <div>
                      <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-[var(--warning)] shadow-[0_0_10px_var(--warning)]"></span>
                        Calculation Pipeline
                      </h4>
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        {result.auditTrail && <AuditTrail steps={result.auditTrail} />}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
