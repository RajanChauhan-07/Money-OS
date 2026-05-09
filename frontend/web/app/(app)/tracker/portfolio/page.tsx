'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, TrendingUp, Briefcase, Edit2, X, Check, ArrowLeft, Sparkles, Rocket } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTrackerStore, type Holding, type AssetType, cagr, yearsBetween, fmtRupee, fvSIP, monthsBetween } from '@/lib/stores/tracker-store'
import { cn } from '@/lib/utils'

const ASSET_TYPES: AssetType[] = ['Stock', 'Mutual Fund', 'ETF', 'FD', 'Bond', 'Gold', 'Real Estate', 'Crypto', 'Other']

const COLORS: Record<string, string> = {
  'Stock': '#3b82f6',        // Sapphire Blue
  'Mutual Fund': '#06b6d4',   // Cyan
  'ETF': '#0ea5e9',           // Sky Blue
  'FD': '#10b981',            // Emerald
  'Bond': '#14b8a6',          // Teal
  'Gold': '#f59e0b',          // Amber
  'Real Estate': '#64748b',   // Slate
  'Crypto': '#f97316',        // Orange
  'Other': '#94a3b8',         // Cool Gray
  'SIP Portfolio': '#10b981', // Premium Emerald for Synced SIPs
}

const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none transition-all duration-500'

const emptyForm = (): Omit<Holding, 'id'> => ({
  name: '', type: 'Stock', units: 0, buyPrice: 0, currentPrice: 0, buyDate: new Date().toISOString().split('T')[0],
})

export default function PortfolioPage() {
  const router = useRouter()
  const { holdings, sips, addHolding, updateHolding, deleteHolding } = useTrackerStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')

  const today = new Date().toISOString()

  // ── Sync with SIPs ──────────────────────────────────────────────────────────
  const enrichedSIPs = sips.map(s => {
    const months = Math.max(0, monthsBetween(s.startDate, today))
    const invested = s.monthlyAmount * months
    const currentValue = fvSIP(s.monthlyAmount, s.expectedCAGR, months)
    const pnl = currentValue - invested
    return { ...s, currentValue, invested, pnl }
  })

  const totalSIPValue = enrichedSIPs.reduce((s, x) => s + x.currentValue, 0)
  const totalSIPInvested = enrichedSIPs.reduce((s, x) => s + x.invested, 0)

  // ── Enrich Holdings ────────────────────────────────────────────────────────
  const enrichedHoldings = holdings.map(h => {
    const currentValue = h.units * h.currentPrice
    const invested = h.units * h.buyPrice
    const pnl = currentValue - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
    const years = yearsBetween(h.buyDate, today)
    const annualizedReturn = cagr(h.buyPrice, h.currentPrice, years)
    return { ...h, currentValue, invested, pnl, pnlPct, annualizedReturn }
  })

  // ── Unified Totals ────────────────────────────────────────────────────────
  const totalValue = enrichedHoldings.reduce((s, h) => s + h.currentValue, 0) + totalSIPValue
  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.invested, 0) + totalSIPInvested
  const totalPnl = totalValue - totalInvested
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  // ── Allocation Sync ────────────────────────────────────────────────────────
  const byType = ASSET_TYPES.map(t => ({
    name: t,
    value: enrichedHoldings.filter(h => h.type === t).reduce((s, h) => s + h.currentValue, 0),
  })).filter(x => x.value > 0)

  if (totalSIPValue > 0) {
    byType.push({ name: 'SIP Portfolio' as any, value: totalSIPValue })
  }

  const handleSubmit = () => {
    if (!form.name.trim()) { setFormError('Name is required'); return }
    if (editId) updateHolding(editId, form)
    else addHolding(form)
    setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('')
  }

  const startEdit = (h: Holding) => {
    setForm({ name: h.name, type: h.type, units: h.units, buyPrice: h.buyPrice, currentPrice: h.currentPrice, buyDate: h.buyDate })
    setEditId(h.id); setShowForm(true)
  }

  const cancelForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('') }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <button
              onClick={() => router.push('/invest')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all group"
            >
              <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Back to Analysis
            </button>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.5rem] bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <Briefcase className="text-zinc-900 dark:text-white" size={28} />
              </div>
              Portfolio Tracker
            </h1>
            <p className="text-zinc-500 dark:text-white/40 text-base font-medium flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              Synced with SIPs & Cash Flow for real-time Net Worth tracking.
            </p>
          </div>
          <button 
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center justify-center gap-3 px-8 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shadow-2xl dark:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            <Plus size={18} strokeWidth={3} /> Add New Holding
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Current Assets', value: fmtRupee(totalValue), sub: 'Synced Portfolio' },
            { label: 'Total Invested', value: fmtRupee(totalInvested), sub: 'Since inception' },
            { label: 'Absolute P&L', value: `${totalPnl >= 0 ? '+' : ''}${fmtRupee(totalPnl)}`, isPnl: true, sub: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%` },
            { label: '10Y Momentum', value: fmtRupee(totalValue * 3.1), sub: 'Projected @ 12%', color: 'text-cyan-500', icon: Rocket },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-8 group hover:border-emerald-500/30 transition-all border-l-4", i === 3 ? 'border-l-cyan-500' : 'border-l-black/5')}>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 dark:text-white/30 mb-3 flex items-center gap-2">
                {c.icon && <c.icon size={12} className={c.color} />}
                {c.label}
              </p>
              <p className={cn(
                "text-3xl font-black tracking-tighter tabular-nums",
                c.color || (c.isPnl ? (totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500') : 'text-zinc-900 dark:text-white')
              )}>
                {c.value}
              </p>
              <p className="text-[11px] font-bold text-zinc-400 dark:text-white/40 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          
          {/* Holdings List */}
          <div className="space-y-6">
            <div className={cn(glass, "overflow-hidden")}>
              <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-zinc-900/5 dark:bg-white/[0.02]">
                <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Active Assets ({holdings.length + (totalSIPValue > 0 ? 1 : 0)})</h2>
              </div>
              
              {holdings.length === 0 && totalSIPValue === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center mb-6">
                    <Briefcase className="text-zinc-300 dark:text-white/10" size={32} />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Portfolio is empty</h3>
                  <p className="text-zinc-500 dark:text-white/40 text-sm max-w-sm font-medium">Add holdings or start a SIP to track your wealth growth.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-white/30 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                        <th className="px-8 py-5 text-left">Asset</th>
                        <th className="px-8 py-5 text-left">Value</th>
                        <th className="px-8 py-5 text-left">P&L</th>
                        <th className="px-8 py-5 text-left">Yield</th>
                        <th className="px-8 py-5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {/* SIP Portfolio Sync Entry */}
                      {totalSIPValue > 0 && (
                        <tr className="group bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] hover:bg-emerald-500/[0.07] transition-colors border-l-4 border-l-emerald-500">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-black text-emerald-500 text-base">SIP Portfolio</span>
                              <span className="text-[9px] font-black uppercase text-emerald-500/60 tracking-widest mt-1 flex items-center gap-1"><Sparkles size={10} /> Auto-Synced</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(totalSIPValue)}</span>
                              <span className="text-[10px] text-zinc-400 dark:text-white/40 mt-0.5">{sips.length} active SIPs</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn("font-black tabular-nums", totalSIPValue - totalSIPInvested >= 0 ? "text-emerald-500" : "text-rose-500")}>
                              {totalSIPValue - totalSIPInvested >= 0 ? '+' : ''}{fmtRupee(totalSIPValue - totalSIPInvested)}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                              System Managed
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => router.push('/invest')} className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                              <TrendingUp size={14} />
                            </button>
                          </td>
                        </tr>
                      )}
                      
                      {enrichedHoldings.map(h => (
                        <tr key={h.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-black text-zinc-900 dark:text-white text-base">{h.name}</span>
                              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-white/30 tracking-widest mt-1">{h.type}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(h.currentValue)}</span>
                              <span className="text-[10px] text-zinc-400 dark:text-white/40 mt-0.5">{h.units} units @ {fmtRupee(h.currentPrice)}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn("font-black tabular-nums", h.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                              {h.pnl >= 0 ? '+' : ''}{fmtRupee(h.pnl)}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                              h.annualizedReturn >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              {h.annualizedReturn >= 0 ? '+' : ''}{h.annualizedReturn.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <button onClick={() => startEdit(h)} className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-colors"><Edit2 size={14} /></button>
                              <button onClick={() => deleteHolding(h.id)} className="p-2.5 rounded-xl hover:bg-rose-500/10 text-zinc-400 dark:text-white/40 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Asset Allocation Chart */}
          <div className="space-y-8">
            <div className={cn(glass, "p-10 flex flex-col items-center bg-zinc-900/5 dark:bg-white/[0.01]")}>
              <h2 className="text-sm font-black text-zinc-900 dark:text-white mb-10 w-full uppercase tracking-widest border-b border-black/5 dark:border-white/5 pb-4">Net Worth Mix</h2>
              {byType.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-black/10 dark:border-white/10 mb-4 animate-pulse" />
                  <span className="text-zinc-400 dark:text-white/30 text-[10px] font-black uppercase tracking-widest">Awaiting Data</span>
                </div>
              ) : (
                <div className="w-full space-y-10">
                  <div className="h-[240px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={byType} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={4} animationDuration={1500}>
                          {byType.map((entry, i) => <Cell key={i} fill={COLORS[entry.name as string] || COLORS['Other']} stroke="none" />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}
                          labelStyle={{ display: 'none' }}
                          formatter={(v: number) => [fmtRupee(v), '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[9px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest">Total Value</p>
                      <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">{fmtRupee(totalValue)}</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                    {byType.map((d, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-md shadow-sm" style={{ background: COLORS[d.name as string] || COLORS['Other'] }} />
                          <span className="text-[11px] font-bold text-zinc-500 dark:text-white/40 tracking-tight group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{d.name}</span>
                        </div>
                        <span className="text-[11px] font-black text-zinc-900 dark:text-white tabular-nums tracking-widest">{((d.value / totalValue) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className={cn(glass, "p-8 bg-emerald-500/5 border-emerald-500/10")}>
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={14} /> Engine insight
              </h3>
              <p className="text-xs font-bold text-zinc-600 dark:text-white/60 leading-relaxed">
                {totalInvested > 0 
                  ? `Based on your current ${fmtRupee(totalInvested)} allocation, your net worth is doubling every ${Math.max(1, (72 / 12)).toFixed(1)} years (projected at 12% CAGR). Maintain current SIP velocity to reach your 10-year goal of ${fmtRupee(totalValue * 3.1)}.`
                  : "Add your first holding or start a SIP to generate real-time growth insights and projection velocity."}
              </p>
            </div>
          </div>
        </div>

        {/* Modal - Silver Frost */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelForm} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl rounded-[3rem] bg-zinc-900 border border-white/10 shadow-2xl p-10 max-h-[95vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">{editId ? 'Modify Holding' : 'New Asset Entry'}</h3>
                  <button onClick={cancelForm} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Asset Name</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Reliance Industries" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-all font-medium" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Asset Category</label>
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AssetType }))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black focus:outline-none appearance-none uppercase tracking-widest text-xs">
                          {ASSET_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Purchase Date</label>
                        <input type="date" value={form.buyDate} onChange={e => setForm(f => ({ ...f, buyDate: e.target.value }))}
                          className="w-full bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-white font-black focus:outline-none text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Quantity</label>
                        <input type="number" value={form.units || ''} onChange={e => setForm(f => ({ ...f, units: +e.target.value }))}
                          placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Avg Buy Price</label>
                        <input type="number" value={form.buyPrice || ''} onChange={e => setForm(f => ({ ...f, buyPrice: +e.target.value }))}
                          placeholder="₹ 0" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Market Price</label>
                        <input type="number" value={form.currentPrice || ''} onChange={e => setForm(f => ({ ...f, currentPrice: +e.target.value }))}
                          placeholder="₹ 0" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-black focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {formError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{formError}</p>}

                  <div className="flex gap-4 pt-6">
                    <button onClick={cancelForm} className="flex-1 py-5 rounded-2xl text-white/30 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                      {editId ? 'Commit Changes' : 'Confirm Entry'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
