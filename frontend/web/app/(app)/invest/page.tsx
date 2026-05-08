'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2, TrendingUp, Edit2, X, Check, IndianRupee, Wallet, Sparkles, ArrowRight } from 'lucide-react'
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

const glass = 'rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl'

const emptyForm = (): Omit<SIPEntry, 'id'> => ({
  fundName: '', category: 'Large Cap', monthlyAmount: 0,
  startDate: new Date().toISOString().split('T')[0], expectedCAGR: 12,
})

export default function InvestPage() {
  const { sips, addSIP, updateSIP, deleteSIP } = useTrackerStore()
  const { taxResult, hasResult, scenarios } = useTaxStore()
  const [activeTab, setActiveTab] = useState<'active' | 'recommended'>('active')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [projYears, setProjYears] = useState(10)

  const recommendedPlan = (hasResult && scenarios?.optimized) 
    ? generateInvestmentPlan(scenarios.optimized)
    : null

  const handleAddRecommended = (instrument: string, amount: number, category: SIPCategory) => {
    addSIP({
      fundName: instrument,
      category,
      monthlyAmount: amount,
      startDate: new Date().toISOString().split('T')[0],
      expectedCAGR: category === 'ELSS' ? 14 : 12,
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

  const totalMonthly = enriched.reduce((s, x) => s + x.monthlyAmount, 0)
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

  // ── Form ──────────────────────────────────────────────────────────────────
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
    <div className="min-h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-white/20 dark:bg-white/[0.01] backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-violet-500/10"><TrendingUp className="text-violet-400" size={26} /></div>
              SIP Tracker
            </h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm">Track your SIPs and see projected corpus growth over time.</p>
          </div>
          <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95">
            <Plus size={18} /> Add SIP
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 w-fit bg-white/5 border border-white/10 rounded-2xl">
          {[
            { id: 'active', label: 'Active SIPs', icon: Wallet },
            { id: 'recommended', label: 'Engine Recommendations', icon: Sparkles },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === t.id 
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
              )}
            >
              <t.icon size={16} />
              {t.label}
              {t.id === 'recommended' && recommendedPlan && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-400/20 text-violet-400 text-[10px]">
                  {recommendedPlan.allocations.filter(a => a.monthlyAmount > 0).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'active' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Monthly SIP', value: fmtRupee(totalMonthly), sub: 'Total active', color: 'text-violet-400' },
            { label: 'Total Invested', value: fmtRupee(totalInvested), sub: 'Since start dates', color: 'text-[var(--text-primary)]' },
            { label: 'Current Value', value: fmtRupee(totalValue), sub: `Gain: ${totalGain >= 0 ? '+' : ''}${fmtRupee(totalGain)}`, color: 'text-emerald-400' },
            { label: '80C via ELSS', value: fmtRupee(elssUsed), sub: `of ₹1.5L limit used`, color: elssUsed >= 150000 ? 'text-emerald-400' : 'text-amber-400' },
          ].map((c, i) => (
            <div key={i} className={`${glass} p-5`}>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1 opacity-70">{c.label}</p>
              <p className={`text-2xl font-black tracking-tight ${c.color}`}>{c.value}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1 font-medium opacity-70">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Projection Chart */}
        <div className={`${glass} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Corpus Projection</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">Horizon:</span>
              {[5, 10, 15, 20, 30].map(y => (
                <button key={y} onClick={() => setProjYears(y)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${projYears === y ? 'bg-violet-500 text-white' : 'bg-white/10 text-[var(--text-secondary)] hover:bg-white/20'}`}>
                  {y}Y
                </button>
              ))}
            </div>
          </div>
          {sips.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[var(--text-tertiary)] text-sm">Add SIPs to see projection chart</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={projData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtRupee(v)} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v: number) => fmtRupee(v)} contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="#6366f1" fill="url(#invGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="projected" name="Projected Value" stroke="#8b5cf6" fill="url(#projGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* SIP List */}
        <div className={`${glass} overflow-hidden`}>
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Active SIPs ({sips.length})</h2>
          </div>
          {enriched.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Wallet className="text-violet-400" size={28} />
              </div>
              <p className="text-[var(--text-secondary)] font-medium">No SIPs added yet.</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Add your mutual fund SIPs including ELSS, Index, Debt, etc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-white/10">
                    {['Fund', 'Category', 'Monthly SIP', 'Since', 'Expected CAGR', 'Invested', 'Current Value', 'Gain', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-bold opacity-70">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">{s.fundName}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: (CAT_COLOR[s.category] || '#6366f1') + '20', color: CAT_COLOR[s.category] || '#6366f1' }}>{s.category}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-[var(--text-primary)]">{fmtRupee(s.monthlyAmount)}</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)] text-xs">{new Date(s.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{s.expectedCAGR}%</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{fmtRupee(s.invested)}</td>
                      <td className="px-5 py-4 font-bold text-[var(--text-primary)]">{fmtRupee(s.currentValue)}</td>
                      <td className={`px-5 py-4 font-bold ${s.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {s.gain >= 0 ? '+' : ''}{fmtRupee(s.gain)}<br />
                        <span className="text-[10px] font-medium opacity-80">{s.gainPct >= 0 ? '+' : ''}{s.gainPct.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => deleteSIP(s.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
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
          <div className="space-y-6">
            {!recommendedPlan ? (
              <div className={`${glass} p-12 text-center`}>
                <Sparkles className="w-12 h-12 text-violet-400 mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">No recommendations yet</h2>
                <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
                  Upload your Form 16 or complete the tax setup to see engine-optimized investment suggestions.
                </p>
                <Link href="/setup">
                  <Button className="mt-6">Get Started</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-[1fr_0.4fr]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Optimized Allocations</h2>
                    <span className="text-xs text-[var(--text-secondary)]">Based on FY 2025-26 Tax Rules</span>
                  </div>
                  {recommendedPlan.allocations.filter(a => a.monthlyAmount > 0).map((a, i) => (
                    <div key={i} className={`${glass} p-6 flex items-center justify-between gap-6 transition-all hover:border-violet-500/30`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                          <IndianRupee size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{a.instrument}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">§{a.section}</span>
                            <span className="text-[11px] text-[var(--text-secondary)]">Priority {a.priority}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div>
                          <p className="text-xl font-black text-[var(--text-primary)]">{fmtRupee(a.monthlyAmount)}</p>
                          <p className="text-[11px] text-emerald-400 font-bold mt-1">Saves {fmtRupee(a.taxSaving)} tax</p>
                        </div>
                        <button 
                          onClick={() => handleAddRecommended(a.instrument, a.monthlyAmount, (a.section === '80C' ? 'ELSS' : a.section === '80D' ? 'Other' : 'Other') as any)}
                          className="p-3 rounded-2xl bg-white/5 hover:bg-violet-500 hover:text-white text-[var(--text-secondary)] transition-all active:scale-95 group"
                        >
                          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-6">
                  <div className={`${glass} p-6 bg-violet-500/5 border-violet-500/10`}>
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4">Plan Summary</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-sm text-[var(--text-secondary)]">Total Monthly</p>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{fmtRupee(recommendedPlan.allocations.reduce((s, x) => s + x.monthlyAmount, 0))}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-sm text-[var(--text-secondary)]">Annual Savings</p>
                        <p className="text-xl font-bold text-emerald-400">{fmtRupee(recommendedPlan.projectedTaxSaving)}</p>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                          This plan is optimized to maximize take-home pay while utilizing high-yield tax-saving instruments.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${glass} p-6`}>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Why this plan?</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {taxResult?.reasoning || 'Our engine selected these instruments based on your cash flow and tax liability.'}
                    </p>
                    <Link href="/plan/summary" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-400 hover:gap-3 transition-all">
                      View full breakdown <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md rounded-[2rem] bg-zinc-900/95 border border-white/10 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editId ? 'Edit SIP' : 'Add SIP'}</h3>
                  <button onClick={cancelForm} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Fund / Scheme Name *</label>
                    <input value={form.fundName} onChange={e => setForm(f => ({ ...f, fundName: e.target.value }))}
                      placeholder="e.g. Mirae Asset Large Cap Fund" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Category *</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SIPCategory }))}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-400 transition-colors">
                        {SIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Monthly SIP (₹) *</label>
                      <input type="number" min="500" value={form.monthlyAmount || ''} onChange={e => setForm(f => ({ ...f, monthlyAmount: +e.target.value }))}
                        placeholder="e.g. 5000" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Start Date *</label>
                      <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Expected CAGR (%) *</label>
                      <input type="number" min="1" max="50" value={form.expectedCAGR || ''} onChange={e => setForm(f => ({ ...f, expectedCAGR: +e.target.value }))}
                        placeholder="e.g. 12" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors" />
                    </div>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">CAGR guidance: Large Cap ~11-13%, Mid Cap ~13-15%, ELSS ~12-14%, Debt ~6-8%, Gold ~8-10%, Index ~11-12%</p>
                  {formError && <p className="text-red-400 text-sm font-medium">{formError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30">
                      <Check size={16} /> {editId ? 'Save Changes' : 'Add SIP'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
