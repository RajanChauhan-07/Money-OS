'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, TrendingUp, Briefcase, Edit2, X, Check, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTrackerStore, type Holding, type AssetType, cagr, yearsBetween, fmtRupee } from '@/lib/stores/tracker-store'
import { cn } from '@/lib/utils'

const ASSET_TYPES: AssetType[] = ['Stock', 'Mutual Fund', 'ETF', 'FD', 'Bond', 'Gold', 'Real Estate', 'Crypto', 'Other']

const COLORS: Record<AssetType, string> = {
  'Stock': '#6366f1',
  'Mutual Fund': '#8b5cf6',
  'ETF': '#a78bfa',
  'FD': '#10b981',
  'Bond': '#34d399',
  'Gold': '#f59e0b',
  'Real Estate': '#ef4444',
  'Crypto': '#f97316',
  'Other': '#64748b',
}

// Premium Frosted Utilities
const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

const emptyForm = (): Omit<Holding, 'id'> => ({
  name: '', type: 'Stock', units: 0, buyPrice: 0, currentPrice: 0, buyDate: new Date().toISOString().split('T')[0],
})

export default function PortfolioPage() {
  const router = useRouter()
  const { holdings, addHolding, updateHolding, deleteHolding } = useTrackerStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [expandedHolding, setExpandedHolding] = useState<string | null>(null)

  const enriched = holdings.map(h => {
    const currentValue = h.units * h.currentPrice
    const invested = h.units * h.buyPrice
    const pnl = currentValue - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
    const years = yearsBetween(h.buyDate, new Date().toISOString())
    const annualizedReturn = cagr(h.buyPrice, h.currentPrice, years)
    return { ...h, currentValue, invested, pnl, pnlPct, annualizedReturn }
  })

  const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0)
  const totalInvested = enriched.reduce((s, h) => s + h.invested, 0)
  const totalPnl = totalValue - totalInvested
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

  const byType = ASSET_TYPES.map(t => ({
    name: t,
    value: enriched.filter(h => h.type === t).reduce((s, h) => s + h.currentValue, 0),
  })).filter(x => x.value > 0)

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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <button
              onClick={() => router.push('/tracker/allocation')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} /> Back to Analysis
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <Briefcase className="text-zinc-900 dark:text-white" size={24} />
              </div>
              Portfolio Tracker
            </h1>
            <p className="text-zinc-500 dark:text-white/50 text-lg font-medium">Track your assets, P&L, and CAGR effortlessly.</p>
          </div>
          <button 
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm transition-all hover:bg-zinc-800 dark:hover:bg-white/90 active:scale-95 shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <Plus size={20} strokeWidth={3} /> Add New Holding
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Current Assets', value: fmtRupee(totalValue) },
            { label: 'Total Invested', value: fmtRupee(totalInvested) },
            { label: 'Absolute P&L', value: `${totalPnl >= 0 ? '+' : ''}${fmtRupee(totalPnl)}`, isPnl: true },
            { label: 'Overall Returns', value: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`, isPnl: true },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-8 group hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all")}>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-white/40 mb-3">{c.label}</p>
              <p className={cn(
                "text-3xl font-bold tracking-tighter",
                c.isPnl ? (totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : 'text-zinc-900 dark:text-white'
              )}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          
          {/* Holdings List */}
          <div className={cn(glass, "overflow-hidden")}>
            <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Holdings ({holdings.length})</h2>
            </div>
            
            {holdings.length === 0 ? (
              <div className="py-32 flex flex-col items-center justify-center text-center px-8 border-dashed border-black/10 dark:border-white/20">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Portfolio is empty</h3>
                <p className="text-zinc-500 dark:text-white/40 text-sm max-w-sm font-medium">Add your stocks, mutual funds, gold, or other assets to start tracking your net worth.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-white/30 border-b border-black/5 dark:border-white/5">
                      <th className="px-8 py-5 text-left font-black">Asset</th>
                      <th className="px-8 py-5 text-left font-black">Value</th>
                      <th className="px-8 py-5 text-left font-black">P&L</th>
                      <th className="px-8 py-5 text-left font-black">Returns</th>
                      <th className="px-8 py-5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {enriched.map(h => (
                      <tr key={h.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-white text-base">{h.name}</span>
                            <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-white/40 tracking-widest mt-1">{h.type}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-white">{fmtRupee(h.currentValue)}</span>
                            <span className="text-[10px] text-zinc-400 dark:text-white/40 mt-0.5">{h.units} units</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "font-bold",
                            h.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {h.pnl >= 0 ? '+' : ''}{fmtRupee(h.pnl)}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            h.annualizedReturn >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          )}>
                            {h.annualizedReturn >= 0 ? '+' : ''}{h.annualizedReturn.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(h)} className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white"><Edit2 size={14} /></button>
                            <button onClick={() => deleteHolding(h.id)} className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-red-500/10 dark:hover:bg-red-500/10 text-zinc-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Asset Allocation Chart */}
          <div className={cn(glass, "p-10 flex flex-col items-center")}>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-10 w-full">Allocation</h2>
            {byType.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-black/10 dark:border-white/10 mb-4" />
                <span className="text-zinc-400 dark:text-white/30 text-xs font-medium">No data to display</span>
              </div>
            ) : (
              <div className="w-full space-y-10">
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byType} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={4}>
                        {byType.map((entry, i) => <Cell key={i} fill={COLORS[entry.name as AssetType]} stroke="none" />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--tooltip-bg, rgba(25,25,25,0.9))', border: 'none', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', color: 'inherit' }}
                        formatter={(v: number) => fmtRupee(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {byType.map((d, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.name as AssetType] }} />
                        <span className="text-xs font-bold text-zinc-500 dark:text-white/60 tracking-tight">{d.name}</span>
                      </div>
                      <span className="text-sm font-black text-zinc-900 dark:text-white">{((d.value / totalValue) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal - Silver Frost */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelForm} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl rounded-[3rem] bg-white dark:bg-white/[0.08] border border-black/10 dark:border-white/20 backdrop-blur-[100px] shadow-2xl p-12 max-h-[95vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{editId ? 'Modify Holding' : 'New Holding'}</h3>
                  <button onClick={cancelForm} className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Asset Name</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Nifty 50 ETF" className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white text-lg placeholder-zinc-400 dark:placeholder-white/20 focus:outline-none focus:bg-black/[0.08] dark:focus:bg-white/10 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Asset Category</label>
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AssetType }))}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none appearance-none">
                          {ASSET_TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-zinc-900">{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Purchase Date</label>
                        <input type="date" value={form.buyDate} onChange={e => setForm(f => ({ ...f, buyDate: e.target.value }))}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Quantity</label>
                        <input type="number" value={form.units || ''} onChange={e => setForm(f => ({ ...f, units: +e.target.value }))}
                          placeholder="0" className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Avg Buy Price</label>
                        <input type="number" value={form.buyPrice || ''} onChange={e => setForm(f => ({ ...f, buyPrice: +e.target.value }))}
                          placeholder="₹ 0" className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Market Price</label>
                        <input type="number" value={form.currentPrice || ''} onChange={e => setForm(f => ({ ...f, currentPrice: +e.target.value }))}
                          placeholder="₹ 0" className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {formError && <p className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{formError}</p>}

                  <div className="flex gap-4 pt-6">
                    <button onClick={cancelForm} className="flex-1 py-5 rounded-2xl text-zinc-400 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white font-bold transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-5 rounded-[2rem] bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-sm shadow-xl dark:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                      {editId ? 'Apply Changes' : 'Confirm Entry'}
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
