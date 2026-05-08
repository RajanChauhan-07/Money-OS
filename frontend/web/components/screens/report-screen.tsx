'use client'

import { useTaxStore } from '@/lib/stores/tax-store'
import { MotionPage } from './motion-page'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@money-os/ui'
import { formatRupee } from '@/lib/utils/format'
import { generateInvestmentPlan } from '@money-os/tax-engine'
import { AlertCircle, FileText, Download, DownloadCloud, PieChart as PieChartIcon, Table as TableIcon, Info, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ComingSoon } from '@/components/ui'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { cn } from '@/lib/utils'

const glass = 'rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl'

export function ReportScreen({ screenSlug }: { screenSlug: string }) {
  const { taxResult, scenarios, hasResult } = useTaxStore()

  if (!hasResult || !taxResult) {
    return (
      <MotionPage className="p-6 md:p-10">
        <div className="flex h-[40vh] items-center justify-center flex-col text-center">
          <AlertCircle className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
          <h1 className="text-xl font-medium text-[var(--text-primary)]">No Data for Reports</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Please compute your tax profile first.</p>
          <Link href="/dashboard" className="mt-6">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </MotionPage>
    )
  }

  const currentResult = scenarios?.optimized || taxResult
  const old = currentResult.old
  const newR = currentResult.new

  if (screenSlug === 'tax') {
    return (
      <MotionPage className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Tax Audit Report</h1>
            <p className="mt-2 text-[var(--text-secondary)] text-lg">
              Detailed step-by-step tax computation for Assessment Year 2026-27.
            </p>
          </div>
          <div className="flex gap-3 no-print">
            <Button variant="outline" className="gap-2 rounded-2xl border-white/10" onClick={() => window.print()}>
              <Download size={16} /> Export JSON
            </Button>
            <Button className="gap-2 rounded-2xl bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/20" onClick={() => window.print()}>
              <Download size={16} /> Print PDF
            </Button>
          </div>
        </header>

        {/* Hero Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'Recommended', value: `${currentResult.recommendedRegime} Regime`, sub: 'Optimal Choice', color: 'text-violet-400' },
            { label: 'Tax Saved', value: formatRupee(currentResult.savingsWithRecommended), sub: 'vs Alternative', color: 'text-emerald-400' },
            { label: 'Effective Rate', value: `${((old.totalTax / old.grossIncome) * 100).toFixed(1)}%`, sub: 'On Gross Income', color: 'text-[var(--text-primary)]' },
            { label: 'Net Take-Home', value: formatRupee(old.monthlyTakeHome), sub: 'Monthly In-hand', color: 'text-[var(--text-primary)]' },
          ].map((c, i) => (
            <div key={i} className={`${glass} p-6`}>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1">{c.label}</p>
              <p className={cn("text-xl font-black tracking-tight", c.color)}>{c.value}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1 opacity-70">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Audit Trail */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <TableIcon className="text-violet-400" size={20} />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Computation Audit Trail</h2>
          </div>
          
          <div className={`${glass} overflow-hidden`}>
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                  <th className="px-6 py-4 font-bold">Step</th>
                  <th className="px-6 py-4 font-bold">Description</th>
                  <th className="px-6 py-4 font-bold text-right">Old Regime</th>
                  <th className="px-6 py-4 font-bold text-right">New Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { step: '1', desc: 'Gross Annual Income', old: old.grossIncome, new: newR.grossIncome, bold: true },
                  { step: '2', desc: 'Less: Exemptions (HRA, LTA, etc.)', old: -old.totalExemptions, new: 0, color: 'text-emerald-400' },
                  { step: '3', desc: 'Less: Standard Deduction', old: -50000, new: -75000, color: 'text-emerald-400' },
                  { step: '4', desc: 'Less: Deductions (80C, 80D, etc.)', old: -old.totalDeductions, new: 0, color: 'text-emerald-400' },
                  { step: '5', desc: 'Net Taxable Income', old: old.taxableIncome, new: newR.taxableIncome, bold: true },
                  { step: '6', desc: 'Calculated Tax (as per Slabs)', old: old.taxBeforeCess, new: newR.taxBeforeCess },
                  { step: '7', desc: 'Health & Education Cess (4%)', old: old.cess, new: newR.cess },
                  { step: '8', desc: 'Total Tax Liability', old: old.totalTax, new: newR.totalTax, bold: true, highlight: true },
                ].map((row, i) => (
                  <tr key={i} className={cn("hover:bg-white/5 transition-colors", row.highlight && "bg-violet-500/5")}>
                    <td className="px-6 py-4 text-[var(--text-tertiary)] font-medium">{row.step}</td>
                    <td className={cn("px-6 py-4", row.bold ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>{row.desc}</td>
                    <td className={cn("px-6 py-4 text-right tabular-nums", row.bold ? "font-bold" : "", row.color)}>{formatRupee(Math.abs(row.old))}</td>
                    <td className={cn("px-6 py-4 text-right tabular-nums", row.bold ? "font-bold" : "", row.color)}>{formatRupee(Math.abs(row.new))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deductions Breakdown */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400" size={20} />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Deduction Details</h2>
            </div>
            <div className={`${glass} p-6 space-y-4`}>
              {[
                { label: 'Section 80C (ELSS, PPF, LIC)', value: old.section80C },
                { label: 'Section 80D (Health Insurance)', value: old.section80D },
                { label: 'Section 80CCD(1B) (NPS)', value: old.sectionNPS },
                { label: 'Section 24 (Home Loan Interest)', value: old.homeLoanInterest },
                { label: 'Other Deductions', value: old.totalDeductions - (old.section80C + old.section80D + old.sectionNPS + old.homeLoanInterest) },
              ].map((d, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-[var(--text-secondary)]">{d.label}</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{formatRupee(d.value)}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-[var(--text-primary)]">Total Claimed</span>
                <span className="text-lg font-black text-emerald-400">{formatRupee(old.totalDeductions)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Info className="text-blue-400" size={20} />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Taxation Insights</h2>
            </div>
            <div className={`${glass} p-6 bg-blue-500/5 border-blue-500/10 space-y-4`}>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Your effective tax rate is <span className="text-white font-bold">{((old.totalTax / old.grossIncome) * 100).toFixed(1)}%</span>. 
                By utilizing <span className="text-emerald-400 font-bold">{formatRupee(old.totalDeductions)}</span> in deductions, 
                you've reduced your taxable income by <span className="text-white font-bold">{((old.totalDeductions / old.grossIncome) * 100).toFixed(1)}%</span>.
              </p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                The <span className="text-violet-400 font-bold">{currentResult.recommendedRegime} Regime</span> is mathematically superior for your profile, 
                saving you <span className="text-emerald-400 font-bold">{formatRupee(currentResult.savingsWithRecommended)}</span> annually.
              </p>
              <div className="pt-4">
                <Link href="/reports/investment-plan" className="inline-flex items-center gap-2 text-sm font-bold text-violet-400 hover:gap-3 transition-all">
                  Next: View Investment Schedule <ArrowRight size={16} />
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

    const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6']

    return (
      <MotionPage className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/reports/tax" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">← Back to Tax Audit</Link>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Investment Strategy</h1>
            <p className="mt-2 text-[var(--text-secondary)] text-lg">
              Optimized capital allocation for tax savings and wealth growth.
            </p>
          </div>
          <Button className="gap-2 rounded-2xl bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/20">
            <Download size={16} /> Download Schedule
          </Button>
        </header>

        <div className="grid md:grid-cols-[1fr_0.6fr] gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <PieChartIcon className="text-violet-400" size={20} />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Allocation Breakdown</h2>
            </div>
            <div className={`${glass} overflow-hidden`}>
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
                    <th className="px-6 py-4 font-bold">Instrument</th>
                    <th className="px-6 py-4 font-bold">Section</th>
                    <th className="px-6 py-4 font-bold text-right">Monthly Action</th>
                    <th className="px-6 py-4 font-bold text-right">Annual Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {plan.allocations.map((alloc, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{alloc.instrument}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{alloc.section}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-violet-400 tabular-nums">{formatRupee(alloc.monthlyAmount)}</td>
                      <td className="px-6 py-4 text-right font-bold text-[var(--text-secondary)] tabular-nums">{formatRupee(alloc.annualAmount)}</td>
                    </tr>
                  ))}
                  {plan.allocations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-[var(--text-secondary)]">
                        No further investments required. You are fully optimized.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <PieChartIcon className="text-violet-400" size={20} />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Visual Mix</h2>
            </div>
            <div className={`${glass} p-6 h-[400px] flex flex-col items-center justify-center`}>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: number) => formatRupee(v)}
                      contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                    />
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 20, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[var(--text-tertiary)] text-sm">No active investments</p>
              )}
            </div>
          </div>
        </div>

        <div className={`${glass} p-8 flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sparkles size={28} />
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">Execution Ready</p>
              <p className="text-sm text-[var(--text-secondary)]">Start these SIPs now to save {formatRupee(plan.projectedTaxSaving)} this year.</p>
            </div>
          </div>
          <Link href="/invest">
            <Button size="lg" className="rounded-2xl px-8 bg-violet-500 hover:bg-violet-600 shadow-xl shadow-violet-500/20">
              Invest Now
            </Button>
          </Link>
        </div>
      </MotionPage>
    )
  }

  if (screenSlug === 'form16') {
    return (
      <MotionPage className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
        <header className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/reports/investment-plan" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">← Back to Investment Plan</Link>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Form 16 Preview</h1>
            <p className="mt-2 text-[var(--text-secondary)] text-lg">
              Estimated salary certificate as per current projections.
            </p>
          </div>
          <Button variant="outline" className="gap-2 rounded-2xl border-white/10">
            <Download size={16} /> PDF
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={`${glass} p-8 space-y-6`}>
            <h3 className="text-xl font-bold text-[var(--text-primary)] border-b border-white/10 pb-4">Part A: TDS Summary</h3>
            <div className="space-y-4">
              {[
                { label: 'Estimated Monthly TDS', value: old.monthlyTDS, color: 'text-red-400' },
                { label: 'Total Tax Payable', value: old.totalTax },
                { label: 'Education Cess (4%)', value: old.cess },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-[var(--text-secondary)]">{row.label}</span>
                  <span className={cn("text-sm font-bold", row.color || "text-[var(--text-primary)]")}>{formatRupee(row.value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${glass} p-8 space-y-6`}>
            <h3 className="text-xl font-bold text-[var(--text-primary)] border-b border-white/10 pb-4">Part B: Salary & Deductions</h3>
            <div className="space-y-4">
              {[
                { label: 'Gross Salary', value: old.grossIncome },
                { label: 'Total Deductions', value: old.totalDeductions, color: 'text-emerald-400' },
                { label: 'Net Taxable Income', value: old.taxableIncome },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-[var(--text-secondary)]">{row.label}</span>
                  <span className={cn("text-sm font-bold", row.color || "text-[var(--text-primary)]")}>{formatRupee(row.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-center py-12">
          <p className="text-[var(--text-tertiary)] text-xs italic">
            Note: This is a simulated Form 16 based on your inputs and engine computations. Actual Form 16 will be issued by your employer at the end of the financial year.
          </p>
        </div>
      </MotionPage>
    )
  }

  return <ComingSoon title="Report Not Found" description="This specific report view is being upgraded." />
}
