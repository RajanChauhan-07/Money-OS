'use client'

import { useTaxStore } from '@/lib/stores/tax-store'
import { MotionPage } from './motion-page'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@money-os/ui'
import { formatRupee } from '@/lib/utils/format'
import { generateInvestmentPlan } from '@money-os/tax-engine'
import { AlertCircle, FileText, Download, DownloadCloud } from 'lucide-react'
import Link from 'next/link'
import { ComingSoon } from '@/components/ui'

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

  if (screenSlug === 'tax') {
    return (
      <MotionPage className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tax Savings Report</h1>
            <p className="mt-2 text-[var(--text-secondary)] text-lg">
              Regime comparison and breakdown for AY 2026-27.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download size={16} /> PDF
          </Button>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <p className="text-sm text-[var(--text-tertiary)] font-medium">Recommended Regime</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize text-[var(--brand-primary)]">
                {currentResult.recommendedRegime} Regime
              </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <p className="text-sm text-[var(--text-tertiary)] font-medium">Annual Tax Delta</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--success)]">
                {formatRupee(currentResult.savingsWithRecommended)}
              </div>
            </CardContent>
          </Card>
          <Card className="surface-elevated">
            <CardHeader className="pb-2">
              <p className="text-sm text-[var(--text-tertiary)] font-medium">Monthly Take-Home</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {formatRupee(currentResult.old.monthlyTakeHome)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-medium">Summary</h2>
          <div className="surface-panel p-6 rounded-xl border border-[var(--border-subtle)] space-y-4">
            <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">Old Regime Tax</span>
              <span className="font-semibold">{formatRupee(currentResult.old.totalTax)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
              <span className="text-[var(--text-secondary)]">New Regime Tax</span>
              <span className="font-semibold">{formatRupee(currentResult.new.totalTax)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--text-secondary)]">Total Deductions Claimed</span>
              <span className="font-semibold">{formatRupee(currentResult.old.totalDeductions)}</span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Link href="/reports/investment-plan">
              <Button>View Investment Plan</Button>
            </Link>
          </div>
        </div>
      </MotionPage>
    )
  }

  if (screenSlug === 'investment-plan') {
    const plan = generateInvestmentPlan(currentResult)
    
    return (
      <MotionPage className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/reports/tax" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">← Back to Tax Report</Link>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Investment Plan</h1>
            <p className="mt-2 text-[var(--text-secondary)] text-lg">
              Section-wise allocation schedule.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download size={16} /> PDF
          </Button>
        </header>

        <div className="surface-panel rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] text-sm text-[var(--text-tertiary)]">
                <th className="p-4 font-medium">Instrument</th>
                <th className="p-4 font-medium">Section</th>
                <th className="p-4 font-medium text-right">Monthly Action</th>
                <th className="p-4 font-medium text-right">Annual Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {plan.allocations.map((alloc, i) => (
                <tr key={i} className="text-sm text-[var(--text-primary)]">
                  <td className="p-4 font-medium">{alloc.instrument}</td>
                  <td className="p-4"><span className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-1 rounded text-xs">{alloc.section}</span></td>
                  <td className="p-4 text-right font-medium text-[var(--brand-primary)]">{formatRupee(alloc.monthlyAmount)}</td>
                  <td className="p-4 text-right font-medium">{formatRupee(alloc.annualAmount)}</td>
                </tr>
              ))}
              {plan.allocations.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">
                    No further investments required. You are fully optimized.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Link href="/reports/form16">
            <Button>Preview Simulated Form 16</Button>
          </Link>
        </div>
      </MotionPage>
    )
  }

  if (screenSlug === 'form16') {
    return (
      <MotionPage className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/reports/investment-plan" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">← Back to Investment Plan</Link>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Simulated Form 16</h1>
            <p className="mt-2 text-[var(--text-secondary)] text-lg">
              Estimated salary and deductions for the year.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download size={16} /> PDF
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle>Part A: TDS Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Estimated Monthly TDS</span>
                  <span className="font-semibold text-[var(--danger)]">{formatRupee(currentResult.old.monthlyTDS)}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Total Tax Payable</span>
                  <span className="font-semibold">{formatRupee(currentResult.old.totalTax)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-elevated">
            <CardHeader>
              <CardTitle>Part B: Salary & Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Gross Salary</span>
                  <span className="font-semibold">{formatRupee(currentResult.old.grossIncome)}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Total Deductions</span>
                  <span className="font-semibold text-[var(--success)]">{formatRupee(currentResult.old.totalDeductions)}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-secondary)]">Net Taxable Income</span>
                  <span className="font-semibold">{formatRupee(currentResult.old.taxableIncome)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MotionPage>
    )
  }

  return <ComingSoon title="Report Not Found" description="This specific report view is being upgraded." />
}
