'use client'

import { useTaxStore } from '@/lib/stores/tax-store'
import { MotionPage } from './motion-page'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@money-os/ui'
import { formatRupee } from '@/lib/utils/format'
import { generateInvestmentPlan } from '@money-os/tax-engine'
import { AlertCircle, FileText, Download, DownloadCloud, PieChart as PieChartIcon, Table as TableIcon, Info, CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Printer, Briefcase, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ComingSoon } from '@/components/ui'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { cn } from '@/lib/utils'

// Executive Slate & Emerald Palette
const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none transition-all duration-500'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

export function ReportScreen({ screenSlug }: { screenSlug: string }) {
  const { taxResult, scenarios, hasResult } = useTaxStore()

  if (!hasResult || !taxResult) {
    return (
      <MotionPage className="p-6 md:p-10">
        <div className="flex h-[40vh] items-center justify-center flex-col text-center">
          <AlertCircle className="w-12 h-12 text-zinc-300 dark:text-white/10 mb-4" />
          <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-widest">No Audit Data</h1>
          <p className="mt-2 text-zinc-500 dark:text-white/40 font-medium">Please compute your tax profile first to generate reports.</p>
          <Link href="/dashboard" className="mt-8">
            <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] px-8 h-12 rounded-2xl">Return to Dashboard</Button>
          </Link>
        </div>
      </MotionPage>
    )
  }

  const currentResult = scenarios?.optimized || taxResult
  const old = currentResult.old
  const newR = currentResult.new
  
  // ── Safety Data Mapping ───────────────────────────────────────────────
  // Ensure all values are numbers to avoid NaN issues
  const d = currentResult.deductions || {}
  const s80C = Number(d.section80C || 0)
  const s80D = Number(d.section80D_self || 0) + Number(d.section80D_parents || 0)
  const sNPS = Number(d.section80CCD1B || 0)
  const s24 = Number(d.section24_interest || 0)
  const exemptions = Number(d.hra_exempt || 0) + Number(d.lta_exempt || 0)
  const totalOptimized = s80C + s80D + sNPS + s24 + exemptions
  const totalDeductionsInAudit = s80C + s80D + sNPS + s24

  if (screenSlug === 'tax') {
    return (
      <MotionPage className="p-6 md:p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <header className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Assessment Year 2026-27</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <ShieldCheck className="text-emerald-500" size={24} />
              </div>
              Tax Audit Report
            </h1>
            <p className="text-zinc-500 dark:text-white/40 text-lg font-medium">
              Detailed step-by-step tax computation audit trail.
            </p>
          </div>
          <div className="flex gap-3 no-print">
            <Button variant="outline" className="h-12 px-6 gap-2 rounded-2xl border-black/5 dark:border-white/10 font-black uppercase tracking-widest text-[10px]" onClick={() => window.print()}>
              <DownloadCloud size={16} /> JSON
            </Button>
            <Button className="h-12 px-8 gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20" onClick={() => window.print()}>
              <Printer size={16} /> Print Audit
            </Button>
          </div>
        </header>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: 'Recommended', value: `${currentResult.recommendedRegime} Regime`, sub: 'Optimal for Profile', color: 'text-indigo-500' },
            { label: 'Annual Tax Saved', value: formatRupee(currentResult.savingsWithRecommended), sub: 'vs Alternative', color: 'text-emerald-500' },
            { label: 'Effective Rate', value: `${((old.totalTax / old.grossIncome) * 100).toFixed(1)}%`, sub: 'On Gross Income', color: 'text-zinc-900 dark:text-white' },
            { label: 'Net Take-Home', value: formatRupee(old.monthlyTakeHome), sub: 'Monthly In-hand', color: 'text-zinc-900 dark:text-white' },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-8 border-l-4", i === 1 ? 'border-l-emerald-500' : 'border-l-black/5')}>
              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-white/30 mb-2">{c.label}</p>
              <p className={cn("text-2xl font-black tracking-tighter tabular-nums", c.color)}>{c.value}</p>
              <p className="text-[11px] font-bold text-zinc-400 dark:text-white/40 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <TableIcon className="text-indigo-500" size={16} />
            </div>
            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Computation Audit Trail</h2>
          </div>
          
          <div className={cn(glass, "overflow-hidden")}>
            <table className="w-full text-sm text-left">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-white/30">
                  <th className="px-8 py-5 font-black">Step</th>
                  <th className="px-8 py-5 font-black">Description</th>
                  <th className="px-8 py-5 font-black text-right">Old Regime</th>
                  <th className="px-8 py-5 font-black text-right">New Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {[
                  { step: '1', desc: 'Gross Annual Income', old: old.grossIncome, new: newR.grossIncome, bold: true },
                  { step: '2', desc: 'Less: Exemptions (HRA, LTA, etc.)', old: -exemptions, new: 0, color: 'text-emerald-500' },
                  { step: '3', desc: 'Less: Standard Deduction', old: -50000, new: -75000, color: 'text-emerald-500' },
                  { step: '4', desc: 'Less: Deductions (80C, 80D, etc.)', old: -totalDeductionsInAudit, new: 0, color: 'text-emerald-500' },
                  { step: '5', desc: 'Net Taxable Income', old: old.taxableIncome, new: newR.taxableIncome, bold: true },
                  { step: '6', desc: 'Calculated Tax (as per Slabs)', old: old.taxBeforeCess, new: newR.taxBeforeCess },
                  { step: '7', desc: 'Health & Education Cess (4%)', old: old.cess, new: newR.cess },
                  { step: '8', desc: 'Total Tax Liability', old: old.totalTax, new: newR.totalTax, bold: true, highlight: true },
                ].map((row, i) => (
                  <tr key={i} className={cn("hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors", row.highlight && "bg-emerald-500/5 dark:bg-emerald-500/[0.03]")}>
                    <td className="px-8 py-6 text-zinc-400 dark:text-white/30 font-black">{row.step}</td>
                    <td className={cn("px-8 py-6", row.bold ? "font-black text-zinc-900 dark:text-white uppercase text-xs tracking-tight" : "text-zinc-600 dark:text-white/60 font-medium")}>{row.desc}</td>
                    <td className={cn("px-8 py-6 text-right tabular-nums", row.bold ? "font-black text-zinc-900 dark:text-white" : "font-bold", row.color)}>{formatRupee(Math.abs(row.old))}</td>
                    <td className={cn("px-8 py-6 text-right tabular-nums", row.bold ? "font-black text-zinc-900 dark:text-white" : "font-bold", row.color)}>{formatRupee(Math.abs(row.new))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-500" size={16} />
              </div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Deduction Details</h2>
            </div>
            <div className={cn(glass, "p-10 space-y-5 bg-zinc-900/5 dark:bg-white/[0.01]")}>
              {[
                { label: 'Section 80C (ELSS, PPF, LIC)', value: s80C },
                { label: 'Section 80D (Health Insurance)', value: s80D },
                { label: 'Section 80CCD(1B) (NPS)', value: sNPS },
                { label: 'Section 24 (Home Loan Interest)', value: s24 },
                { label: 'Exemptions (HRA & Others)', value: exemptions },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-4 border-b border-black/5 dark:border-white/5 last:border-0">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-tight">{row.label}</span>
                  <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums tracking-tighter">{formatRupee(row.value)}</span>
                </div>
              ))}
              <div className="pt-6 flex justify-between items-center border-t border-black/5 dark:border-white/10">
                <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Total Optimization</span>
                <span className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">{formatRupee(totalOptimized)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Sparkles className="text-indigo-500" size={16} />
              </div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Taxation Insights</h2>
            </div>
            <div className={cn(glass, "p-10 bg-indigo-500/[0.03] border-indigo-500/10 space-y-6")}>
              <div className="space-y-4">
                <p className="text-base text-zinc-600 dark:text-white/60 leading-relaxed font-medium">
                  Your effective tax rate is <span className="text-zinc-900 dark:text-white font-black">{((old.totalTax / old.grossIncome) * 100).toFixed(1)}%</span>. 
                  By utilizing <span className="text-emerald-500 font-black">{formatRupee(totalOptimized)}</span> in deductions and exemptions, 
                  you've reduced your taxable income by <span className="text-zinc-900 dark:text-white font-black">{((totalOptimized / old.grossIncome) * 100).toFixed(1)}%</span>.
                </p>
                <p className="text-base text-zinc-600 dark:text-white/60 leading-relaxed font-medium">
                  The <span className="text-indigo-500 font-black uppercase tracking-widest text-sm">{currentResult.recommendedRegime} Regime</span> is mathematically superior for your profile, 
                  saving you <span className="text-emerald-500 font-black">{formatRupee(currentResult.savingsWithRecommended)}</span> annually.
                </p>
              </div>
              <div className="pt-8 border-t border-black/5 dark:border-white/10">
                <Link href="/reports/investment-plan" className="inline-flex items-center gap-3 text-xs font-black text-indigo-500 hover:gap-5 transition-all uppercase tracking-widest">
                  View Investment Schedule <ArrowRight size={18} strokeWidth={3} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MotionPage>
    )
  }

  if (screenSlug === 'investment-plan') {
    const plan = generateInvestmentPlan(currentResult)
    const pieData = plan.allocations
      .filter(a => a.monthlyAmount > 0)
      .map(a => ({ name: a.instrument, value: a.monthlyAmount }))

    const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#64748b']

    return (
      <MotionPage className="p-6 md:p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <header className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/reports/tax" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all group">
                <ArrowRight size={14} strokeWidth={3} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Tax Audit
              </Link>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <Briefcase className="text-indigo-500" size={24} />
              </div>
              Investment Strategy
            </h1>
            <p className="text-zinc-500 dark:text-white/40 text-lg font-medium">
              Optimized capital allocation for tax savings and wealth growth.
            </p>
          </div>
          <Button className="h-12 px-8 gap-2 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20">
            <Download size={16} /> Download Schedule
          </Button>
        </header>

        <div className="grid md:grid-cols-[1fr_0.6fr] gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <PieChartIcon className="text-indigo-500" size={16} />
              </div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Allocation Breakdown</h2>
            </div>
            <div className={cn(glass, "overflow-hidden bg-zinc-900/5 dark:bg-white/[0.01]")}>
              <table className="w-full text-sm text-left">
                <thead className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-white/30">
                    <th className="px-8 py-5 font-black">Instrument</th>
                    <th className="px-8 py-5 font-black">Section</th>
                    <th className="px-8 py-5 font-black text-right">Monthly Action</th>
                    <th className="px-8 py-5 font-black text-right">Annual Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {plan.allocations.map((alloc, i) => (
                    <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 font-black text-zinc-900 dark:text-white uppercase text-[11px] tracking-tight">{alloc.instrument}</td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 rounded-lg bg-zinc-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[9px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-widest">{alloc.section}</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-indigo-500 tabular-nums text-lg tracking-tighter">{formatRupee(alloc.monthlyAmount)}</td>
                      <td className="px-8 py-6 text-right font-bold text-zinc-500 dark:text-white/40 tabular-nums">{formatRupee(alloc.annualAmount)}</td>
                    </tr>
                  ))}
                  {plan.allocations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-zinc-400 dark:text-white/20 font-black uppercase tracking-widest text-xs">
                        No active investments required.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <PieChartIcon className="text-indigo-500" size={16} />
              </div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Visual Mix</h2>
            </div>
            <div className={cn(glass, "p-10 h-[400px] flex flex-col items-center justify-center bg-zinc-900/5 dark:bg-white/[0.01]")}>
              {pieData.length > 0 ? (
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" animationDuration={1500}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', color: '#fff' }}
                        formatter={(v: number) => [formatRupee(v), '']}
                      />
                      <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 30, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-20">
                  <PieChartIcon size={48} className="text-zinc-400" />
                  <p className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">Awaiting Portfolio</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={cn(glass, "p-10 flex flex-col md:flex-row items-center justify-between gap-8 bg-emerald-500/[0.03] border-emerald-500/20")}>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner border border-emerald-500/20">
              <Sparkles size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase tracking-widest">Execution Ready</p>
              <p className="text-sm text-zinc-600 dark:text-emerald-400/60 font-medium">Start these SIPs now to save {formatRupee(plan.projectedTaxSaving)} this year.</p>
            </div>
          </div>
          <Link href="/invest">
            <Button size="lg" className="h-14 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">
              Ignite Investments
            </Button>
          </Link>
        </div>
      </MotionPage>
    )
  }

  if (screenSlug === 'form16') {
    return (
      <MotionPage className="p-6 md:p-10 max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <header className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/reports/investment-plan" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all group">
                <ArrowRight size={14} strokeWidth={3} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> Back to Strategy
              </Link>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <FileText className="text-indigo-500" size={24} />
              </div>
              Form 16 Preview
            </h1>
            <p className="text-zinc-500 dark:text-white/40 text-lg font-medium">
              Estimated salary certificate as per current projections.
            </p>
          </div>
          <Button variant="outline" className="h-12 px-6 gap-2 rounded-2xl border-black/5 dark:border-white/10 font-black uppercase tracking-widest text-[10px]">
            <Download size={16} /> PDF Export
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className={cn(glass, "p-10 space-y-8 bg-zinc-900/5 dark:bg-white/[0.01]")}>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-4">Part A: TDS Summary</h3>
            <div className="space-y-5">
              {[
                { label: 'Estimated Monthly TDS', value: old.monthlyTDS, color: 'text-rose-500' },
                { label: 'Total Tax Payable', value: old.totalTax },
                { label: 'Education Cess (4%)', value: old.cess },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-4 border-b border-black/5 dark:border-white/5 last:border-0">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-tight">{row.label}</span>
                  <span className={cn("text-base font-black tabular-nums tracking-tighter", row.color || "text-zinc-900 dark:text-white")}>{formatRupee(row.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(glass, "p-10 space-y-8 bg-zinc-900/5 dark:bg-white/[0.01]")}>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-4">Part B: Salary Detail</h3>
            <div className="space-y-5">
              {[
                { label: 'Gross Annual Salary', value: old.grossIncome },
                { label: 'Total Exemptions', value: exemptions, color: 'text-emerald-500' },
                { label: 'Net Taxable Income', value: old.taxableIncome },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-4 border-b border-black/5 dark:border-white/5 last:border-0">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-tight">{row.label}</span>
                  <span className={cn("text-base font-black tabular-nums tracking-tighter", row.color || "text-zinc-900 dark:text-white")}>{formatRupee(row.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-zinc-400 dark:text-white/20 text-[10px] font-black uppercase tracking-widest leading-relaxed max-w-xl mx-auto italic">
            Simulated Form 16: Actual certificate issued by your employer at the end of the financial year.
          </p>
        </div>
      </MotionPage>
    )
  }

  return <ComingSoon title="Report Not Found" description="This specific report view is being upgraded." />
}
