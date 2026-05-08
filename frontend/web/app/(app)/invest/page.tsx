'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2, TrendingUp, Edit2, X, Check, IndianRupee, Wallet, Sparkles, ArrowRight, ShieldCheck, Zap, Rocket, Landmark } from 'lucide-react'
import { useTrackerStore, type SIPEntry, type SIPCategory, fvSIP, monthsBetween, fmtRupee } from '@/lib/stores/tracker-store'
import { useTaxStore } from '@/lib/stores/tax-store'
import { generateInvestmentPlan } from '@money-os/tax-engine'
import { cn } from '@/lib/utils'
import { Button } from '@money-os/ui'

const SIP_CATEGORIES: SIPCategory[] = ['Large Cap', 'Mid Cap', 'Small Cap', 'ELSS', 'Debt', 'Hybrid', 'Index', 'Gold', 'Other']

const CAT_COLOR: Record<SIPCategory, string> = {
  'Large Cap': '#6366f1', 'Mid Cap': '#8b5cf6', 'Small Cap': '#a78bfa',
  'ELSS': '#10b981', 'Debt': '#34d399', 'Hybrid': '#f59e0b',
  'Index': '#3b82f6', 'Gold': '#f59e0b', 'Other': '#64748b',
}

const glass = 'rounded-[2rem] bg-white/70 dark:bg-black/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl transition-all duration-300'

const emptyForm = (): Omit<SIPEntry, 'id'> => ({
  fundName: '', category: 'Large Cap', monthlyAmount: 0,
  startDate: new Date().toISOString().split('T')[0], expectedCAGR: 12,
})

export default function InvestPage() {
  const { sips, addSIP, updateSIP, deleteSIP, incomes, expenses } = useTrackerStore()
  const { taxResult, hasResult, scenarios } = useTaxStore()
  const [activeTab, setActiveTab] = useState<'active' | 'recommended'>('active')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [projYears, setProjYears] = useState(10)

  // ── Cash Flow Bridge ───────────────────────────────────────────────────────
  const totalMonthlyIncome = incomes.reduce((s, x) => s + x.monthlyAmount, 0)
  const totalMonthlyExpenses = expenses.reduce((s, x) => s + x.monthlyAmount, 0)
  const surplus = Math.max(0, totalMonthlyIncome - totalMonthlyExpenses)

  // ── Engine Recommendations ────────────────────────────────────────────────
  const taxPlan = (hasResult && scenarios?.optimized) 
    ? generateInvestmentPlan(scenarios.optimized)
    : null

  // Transform tax-only plan into a "Wealth + Tax" plan
  const wealthPlan = (() => {
    if (!taxPlan) return null
    const allocations = [...taxPlan.allocations]
    const currentRecommendedTotal = allocations.reduce((s, x) => s + x.monthlyAmount, 0)
    const unallocatedSurplus = Math.max(0, surplus - currentRecommendedTotal)

    // If we have a surplus, recommend wealth-building assets
    if (unallocatedSurplus > 1000) {
      // 70% Equity (Index), 30% Stability (Hybrid/Debt)
      const equityAmt = Math.round((unallocatedSurplus * 0.7) / 100) * 100
      const stabilityAmt = Math.round((unallocatedSurplus * 0.3) / 100) * 100

      if (equityAmt > 0) {
        allocations.push({
          instrument: 'Nifty 50 Index Fund',
          section: 'Wealth',
          annualAmount: equityAmt * 12,
          monthlyAmount: equityAmt,
          risk: 'medium',
          lockIn: 0,
          expectedReturn: 12,
          taxSaving: 0,
          priority: 4,
          isWealth: true, // Custom flag
        } as any)
      }
      if (stabilityAmt > 0) {
        allocations.push({
          instrument: 'Aggressive Hybrid Fund',
          section: 'Wealth',
          annualAmount: stabilityAmt * 12,
          monthlyAmount: stabilityAmt,
          risk: 'medium',
          lockIn: 0,
          expectedReturn: 10,
          taxSaving: 0,
          priority: 5,
          isWealth: true,
        } as any)
      }
    }

    return {
      ...taxPlan,
      allocations: allocations.sort((a, b) => a.priority - b.priority),
      totalMonthlyInvestment: allocations.reduce((s, x) => s + x.monthlyAmount, 0),
      totalAnnualInvestment: allocations.reduce((s, x) => s + x.annualAmount, 0),
    }
  })()

  const handleAddRecommended = (instrument: string, amount: number, category: SIPCategory) => {
    addSIP({
      fundName: instrument,
      category,
      monthlyAmount: amount,
      startDate: new Date().toISOString().split('T')[0],
      expectedCAGR: category === 'ELSS' ? 14 : category === 'Index' ? 12 : 10,
    })
    setActiveTab('active')
  }

  const today = new Date().toISOString()

  // ── Enrich each SIP ────────────────────────────────────────────────────────
  const enriched = sips.map(s => {
    const months = Math.max(0, monthsBetween(s.startDate, today))
    const invested = s.monthlyAmount * months
    const currentValue = fvSIP(s.monthlyAmount, s.expectedCAGR, months)
    const gain = currentValue - invested
    const gainPct = invested > 0 ? (gain / invested) * 100 : 0
    return { ...s, months, invested, currentValue, gain, gainPct }
  })

  const totalMonthlySIP = enriched.reduce((s, x) => s + x.monthlyAmount, 0)
  const totalInvested = enriched.reduce((s, x) => s + x.invested, 0)
  const totalValue = enriched.reduce((s, x) => s + x.currentValue, 0)
  const totalGain = totalValue - totalInvested

  // 80C from ELSS
  const elssAnnual = enriched.filter(x => x.category === 'ELSS').reduce((s, x) => s + x.monthlyAmount * 12, 0)
  const elssUsed = Math.min(elssAnnual, 150000)

  // ── Projection Chart (portfolio-level) ────────────────────────────────────
  const projData = Array.from({ length: projYears + 1 }, (_, yr) => {
    const invested = sips.reduce((s, sip) => {
      const startMonths = Math.max(0, monthsBetween(sip.startDate, today))
      const totalMonths = startMonths + yr * 12
      return s + sip.monthlyAmount * totalMonths
    }, 0)
    const projected = sips.reduce((s, sip) => {
      const startMonths = Math.max(0, monthsBetween(sip.startDate, today))
      const totalMonths = startMonths + yr * 12
      return s + fvSIP(sip.monthlyAmount, sip.expectedCAGR, totalMonths)
    }, 0)
    return { year: `Y${yr}`, invested: Math.round(invested), projected: Math.round(projected) }
  })

  const validate = () => {
    if (!form.fundName.trim()) return 'Fund name is required'
    if (form.monthlyAmount <= 0) return 'Monthly amount must be > 0'
    if (form.expectedCAGR <= 0 || form.expectedCAGR > 50) return 'Expected CAGR must be between 1-50%'
    return ''
  }

  const handleSubmit = () => {
    const err = validate()
    if (err) { setFormError(err); return }
    if (editId) { updateSIP(editId, form); setEditId(null) }
    else addSIP(form)
    setForm(emptyForm()); setShowForm(false); setFormError('')
  }

  const startEdit = (s: SIPEntry) => {
    setForm({ fundName: s.fundName, category: s.category, monthlyAmount: s.monthlyAmount, startDate: s.startDate, expectedCAGR: s.expectedCAGR })
    setEditId(s.id); setShowForm(true)
  }

  const cancelForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('') }

  return (
    <div className="min-h-screen pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-violet-500/10"><TrendingUp className="text-violet-500" size={32} /></div>
              Wealth Tracker
            </h1>
            <p className="text-zinc-500 dark:text-white/40 mt-2 text-base font-medium">Consolidated view of your asset growth and tax strategy.</p>
          </div>
          <div className="flex items-center gap-4 no-print">
            <Button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
              className="gap-2 rounded-[1.25rem] bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-transform px-6 h-12 font-black uppercase tracking-widest text-[10px]">
              <Plus size={16} /> Add SIP
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 w-fit bg-zinc-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl">
          {[
            { id: 'active', label: 'Active Portfolio', icon: Wallet },
            { id: 'recommended', label: 'Engine Strategy', icon: Sparkles },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === t.id 
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" 
                  : "text-zinc-500 dark:text-white/30 hover:text-zinc-900 dark:hover:text-white hover:bg-white/5"
              )}
            >
              <t.icon size={14} />
              {t.label}
              {t.id === 'recommended' && wealthPlan && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-violet-400/20 text-violet-400 text-[9px]">
                  {wealthPlan.allocations.filter(a => a.monthlyAmount > 0).length || '0'}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'active' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Monthly Inflow', value: fmtRupee(totalMonthlySIP), sub: 'Total active SIPs', color: 'text-violet-500' },
                { label: 'Total Invested', value: fmtRupee(totalInvested), sub: 'Since inception', color: 'text-zinc-900 dark:text-white' },
                { label: 'Current Value', value: fmtRupee(totalValue), sub: `Gain: ${totalGain >= 0 ? '+' : ''}${fmtRupee(totalGain)}`, color: 'text-emerald-500' },
                { label: '80C Utilization', value: fmtRupee(elssUsed), sub: `${((elssUsed/150000)*100).toFixed(0)}% of ₹1.5L limit`, color: elssUsed >= 150000 ? 'text-emerald-500' : 'text-amber-500' },
              ].map((c, i) => (
                <div key={i} className={cn(glass, "p-7 border-l-4", c.color.replace('text-', 'border-'))}>
                  <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 dark:text-white/30 mb-2">{c.label}</p>
                  <p className={cn("text-3xl font-black tracking-tighter tabular-nums", c.color)}>{c.value}</p>
                  <p className="text-[11px] font-bold text-zinc-500 dark:text-white/40 mt-1">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Projection Chart */}
            <div className={cn(glass, "p-8")}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Corpus Projection</h2>
                  <p className="text-sm font-medium text-zinc-500 dark:text-white/40 mt-1">Simulated growth based on your current portfolio CAGR.</p>
                </div>
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5">
                  {[5, 10, 15, 20, 30].map(y => (
                    <button key={y} onClick={() => setProjYears(y)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                        projYears === y ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-zinc-500 dark:text-white/30 hover:bg-white/5'
                      )}>
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>
              {sips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[280px] text-zinc-400 dark:text-white/20 gap-4">
                  <TrendingUp size={48} className="opacity-20" />
                  <p className="text-sm font-black uppercase tracking-widest">Add SIPs to generate projection</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={projData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tickFormatter={v => fmtRupee(v)} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip 
                      contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', marginBottom: '4px' }}
                      formatter={(v: number) => [fmtRupee(v), '']}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 20, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    <Area type="monotone" dataKey="invested" name="Invested" stroke="#6366f1" fill="url(#invGrad)" strokeWidth={3} />
                    <Area type="monotone" dataKey="projected" name="Projected Value" stroke="#8b5cf6" fill="url(#projGrad)" strokeWidth={4} strokeDasharray="none" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* SIP List */}
            <div className={cn(glass, "overflow-hidden border-t-0")}>
              <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-zinc-900/5 dark:bg-white/[0.02]">
                <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-3 uppercase tracking-widest">
                  Active Subscriptions ({sips.length})
                </h2>
              </div>
              {enriched.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center mx-auto">
                    <Wallet className="text-violet-500" size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-white/20">Empty Portfolio</p>
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-white/20 mt-1">Add your SIPs to start tracking growth</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-white/30 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
                        {['Fund', 'Type', 'Monthly', 'Since', 'CAGR', 'Invested', 'Value', 'Yield', ''].map(h => (
                          <th key={h} className="px-8 py-4 text-left font-black">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {enriched.map(s => (
                        <tr key={s.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-5 font-black text-zinc-900 dark:text-white">{s.fundName}</td>
                          <td className="px-8 py-5">
                            <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border" style={{ background: (CAT_COLOR[s.category] || '#6366f1') + '10', color: CAT_COLOR[s.category] || '#6366f1', borderColor: (CAT_COLOR[s.category] || '#6366f1') + '20' }}>{s.category}</span>
                          </td>
                          <td className="px-8 py-5 font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(s.monthlyAmount)}</td>
                          <td className="px-8 py-5 text-[11px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-tighter">
                            {new Date(s.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-5 font-black text-zinc-500 dark:text-white/40 tabular-nums">{s.expectedCAGR}%</td>
                          <td className="px-8 py-5 font-bold text-zinc-500 dark:text-white/40 tabular-nums">{fmtRupee(s.invested)}</td>
                          <td className="px-8 py-5 font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(s.currentValue)}</td>
                          <td className="px-8 py-5">
                            <div className={cn("font-black tabular-nums text-sm", s.gain >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                              {s.gain >= 0 ? '+' : ''}{fmtRupee(s.gain)}
                            </div>
                            <div className={cn("text-[9px] font-black uppercase tracking-widest opacity-60", s.gain >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                              {s.gainPct >= 0 ? '+' : ''}{s.gainPct.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <button onClick={() => startEdit(s)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><Edit2 size={14} /></button>
                              <button onClick={() => deleteSIP(s.id)} className="w-8 h-8 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-10">
            {/* Optimization Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={cn(glass, "p-8 border-l-4 border-violet-500")}>
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 rounded-2xl bg-violet-500/10"><Zap className="text-violet-500" size={24} /></div>
                   <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase tracking-widest">Strategy Reasoning</h2>
                </div>
                <p className="text-base font-medium text-zinc-600 dark:text-white/70 leading-relaxed">
                  {taxResult?.reasoning.replace(' exceed', `, and your ${fmtRupee(surplus)} surplus exceed`)}
                </p>
                <div className="mt-8 flex items-center gap-6 pt-8 border-t border-black/5 dark:border-white/5">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-1">Tax Regime</p>
                     <p className="text-sm font-black text-zinc-900 dark:text-white uppercase">{taxResult?.recommendedRegime || 'Checking...'} Regime</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/30 mb-1">Cash Surplus</p>
                     <p className={cn("text-sm font-black uppercase", surplus > 0 ? 'text-emerald-500' : 'text-zinc-500')}>{fmtRupee(surplus)} / mo</p>
                   </div>
                </div>
              </div>

              <div className={cn(glass, "p-8 bg-emerald-500/5 border-emerald-500/20")}>
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 rounded-2xl bg-emerald-500/10"><ShieldCheck className="text-emerald-500" size={24} /></div>
                   <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase tracking-widest">CFO Plan Summary</h2>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-zinc-500 dark:text-white/40">Wealth + Tax SIPs</p>
                    <p className="text-2xl font-black text-zinc-900 dark:text-white">{fmtRupee(wealthPlan?.totalMonthlyInvestment || 0)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-zinc-500 dark:text-white/40">Potential Tax Savings</p>
                    <p className="text-2xl font-black text-emerald-500">{fmtRupee(wealthPlan?.projectedTaxSaving || 0)}</p>
                  </div>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-white/40 pt-4 border-t border-black/5 dark:border-white/10 leading-relaxed italic">
                    This plan utilizes 100% of your idle surplus to accelerate long-term wealth compounding.
                  </p>
                </div>
              </div>
            </div>

            {/* Allocations List */}
            <div className="space-y-6">
               <h3 className="text-sm font-black text-zinc-400 dark:text-white/20 uppercase tracking-[0.3em] ml-1">Allocations Ledger</h3>
               
               {/* 80C Utilization (Special entry to show "Optimized" status) */}
               {elssUsed >= 150000 && (
                 <div className={cn(glass, "p-6 flex items-center justify-between border-l-4 border-emerald-500 group")}>
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                         <ShieldCheck size={28} />
                       </div>
                       <div>
                         <p className="text-base font-black text-zinc-900 dark:text-white">Section 80C Optimized</p>
                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Full ₹1.5L Utilization Detected</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active Strategy</span>
                    </div>
                 </div>
               )}

               {(!wealthPlan || wealthPlan.allocations.filter(a => a.monthlyAmount > 0).length === 0) ? (
                 <div className={cn(glass, "p-12 text-center border-dashed border-white/10")}>
                    <Sparkles className="w-12 h-12 text-violet-400/20 mx-auto mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-white/20">No surplus detected</p>
                    <p className="text-[11px] font-medium text-zinc-400 dark:text-white/20 mt-2">Adjust your Cash Flow to find investable surplus.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {wealthPlan.allocations.filter(a => a.monthlyAmount > 0).map((a, i) => (
                     <div key={i} className={cn(glass, "p-7 flex items-center justify-between gap-6 hover:border-emerald-500/30 group relative overflow-hidden transition-all duration-500")}>
                       {(a as any).isWealth && (
                         <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500 transform rotate-45 translate-x-7 -translate-y-1 w-24 text-center border-b border-emerald-500/20">Wealth</div>
                       )}
                       <div className="flex items-center gap-6">
                         <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", (a as any).isWealth ? 'bg-emerald-500/10 text-emerald-500' : 'bg-violet-500/10 text-violet-500')}>
                           {(a as any).isWealth ? <Rocket size={28} /> : <IndianRupee size={28} />}
                         </div>
                         <div>
                           <p className="text-base font-black text-zinc-900 dark:text-white">{a.instrument}</p>
                           <div className="flex items-center gap-3 mt-1.5">
                             <span className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/5 text-[9px] font-black text-zinc-500 dark:text-white/40 uppercase tracking-widest border border-black/5 dark:border-white/10">Section {a.section}</span>
                             {(a as any).isWealth && (
                               <span className="text-[10px] font-bold text-emerald-500/60 italic">10Y Projection: {fmtRupee(fvSIP(a.monthlyAmount, a.expectedReturn, 120))}</span>
                             )}
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center gap-8">
                         <div className="text-right">
                           <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(a.monthlyAmount)}</p>
                           <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", (a as any).isWealth ? 'text-emerald-500' : 'text-violet-500')}>
                             {(a as any).isWealth ? `${a.expectedReturn}% Target Return` : `Saves ${fmtRupee(a.taxSaving)} Tax`}
                           </p>
                         </div>
                         <button 
                           onClick={() => handleAddRecommended(a.instrument, a.monthlyAmount, (a.section === 'Wealth' ? 'Index' : a.section === '80C' ? 'ELSS' : 'Other') as any)}
                           className={cn(
                             "w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all active:scale-95",
                             (a as any).isWealth ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-zinc-900 dark:bg-white/5 hover:bg-violet-500 shadow-violet-500/20'
                           )}
                         >
                           <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-violet-500/5">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">
                    {editId ? 'Refine Asset' : 'New Asset Entry'}
                  </h3>
                  <button onClick={cancelForm} className="w-10 h-10 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center"><X size={20} /></button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Fund / Scheme Name</label>
                    <input value={form.fundName} onChange={e => setForm(f => ({ ...f, fundName: e.target.value }))}
                      placeholder="e.g. Nifty 50 Index Fund" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all font-medium" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Category</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SIPCategory }))}
                        className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all font-medium appearance-none">
                        {SIP_CATEGORIES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Monthly (₹)</label>
                      <input type="number" min="0" value={form.monthlyAmount || ''} onChange={e => setForm(f => ({ ...f, monthlyAmount: +e.target.value }))}
                        placeholder="e.g. 10000" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Start Date</label>
                      <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Expected CAGR (%)</label>
                      <input type="number" min="1" max="50" value={form.expectedCAGR || ''} onChange={e => setForm(f => ({ ...f, expectedCAGR: +e.target.value }))}
                        placeholder="e.g. 12" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all font-medium" />
                    </div>
                  </div>
                  
                  {formError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{formError}</p>}
                  <Button onClick={handleSubmit} className="w-full h-14 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-violet-500/20 gap-2">
                    <Check size={18} /> {editId ? 'Commit Changes' : 'Launch Asset'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
