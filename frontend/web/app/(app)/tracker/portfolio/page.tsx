'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Plus, Trash2, TrendingUp, TrendingDown, Briefcase, Edit2, X, Check, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTrackerStore, type Holding, type AssetType, cagr, yearsBetween, fmtRupee } from '@/lib/stores/tracker-store'

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

const glass = 'rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl'

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

  // ── Calculations ──────────────────────────────────────────────────────────
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

  // Donut chart data by asset type
  const byType = ASSET_TYPES.map(t => ({
    name: t,
    value: enriched.filter(h => h.type === t).reduce((s, h) => s + h.currentValue, 0),
  })).filter(x => x.value > 0)

  // ── Form Handlers ─────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.name.trim()) return 'Name is required'
    if (form.units <= 0) return 'Units must be > 0'
    if (form.buyPrice <= 0) return 'Buy price must be > 0'
    if (form.currentPrice <= 0) return 'Current price must be > 0'
    return ''
  }

  const handleSubmit = () => {
    const err = validate()
    if (err) { setFormError(err); return }
    if (editId) {
      updateHolding(editId, form)
      setEditId(null)
    } else {
      addHolding(form)
    }
    setForm(emptyForm())
    setShowForm(false)
    setFormError('')
  }

  const startEdit = (h: Holding) => {
    setForm({ name: h.name, type: h.type, units: h.units, buyPrice: h.buyPrice, currentPrice: h.currentPrice, buyDate: h.buyDate })
    setEditId(h.id)
    setShowForm(true)
  }

  const cancelForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('') }

  return (
    <div className="min-h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-white/20 dark:bg-white/[0.01] backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Back Button */}
        <button
          onClick={() => router.push('/result')}
          className="group flex items-center gap-2 px-4 py-2 -ml-4 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analysis
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10"><Briefcase className="text-indigo-400" size={26} /></div>
              Portfolio Tracker
            </h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm">Track all your investments. P&L and CAGR calculated automatically.</p>
          </div>
          <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95">
            <Plus size={18} /> Add Holding
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Current Value', value: fmtRupee(totalValue), color: 'text-[var(--text-primary)]' },
            { label: 'Total Invested', value: fmtRupee(totalInvested), color: 'text-[var(--text-secondary)]' },
            { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}${fmtRupee(totalPnl)}`, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Returns', value: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`, color: totalPnlPct >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map((c, i) => (
            <div key={i} className={`${glass} p-5`}>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-2 opacity-70">{c.label}</p>
              <p className={`text-2xl font-black tracking-tight ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Chart + Holdings */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* Holdings Table */}
          <div className={`${glass} overflow-hidden`}>
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Holdings ({holdings.length})</h2>
            </div>
            {enriched.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <Briefcase className="text-indigo-400" size={28} />
                </div>
                <p className="text-[var(--text-secondary)] font-medium">No holdings yet.</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Add your stocks, mutual funds, FDs, gold, and more.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-white/10">
                      {['Asset', 'Type', 'Units', 'Buy Price', 'Curr. Price', 'Value', 'P&L', 'CAGR', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-bold opacity-70">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map((h, i) => (
                      <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">{h.name}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: COLORS[h.type] + '20', color: COLORS[h.type] }}>{h.type}</span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-secondary)]">{h.units.toLocaleString()}</td>
                        <td className="px-5 py-4 text-[var(--text-secondary)]">{fmtRupee(h.buyPrice)}</td>
                        <td className="px-5 py-4 text-[var(--text-primary)] font-medium">{fmtRupee(h.currentPrice)}</td>
                        <td className="px-5 py-4 font-bold text-[var(--text-primary)]">{fmtRupee(h.currentValue)}</td>
                        <td className={`px-5 py-4 font-bold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.pnl >= 0 ? '+' : ''}{fmtRupee(h.pnl)}<br />
                          <span className="text-[10px] font-medium opacity-80">{h.pnlPct >= 0 ? '+' : ''}{h.pnlPct.toFixed(1)}%</span>
                        </td>
                        <td className={`px-5 py-4 font-bold text-xs ${h.annualizedReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.annualizedReturn >= 0 ? '+' : ''}{h.annualizedReturn.toFixed(1)}%
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(h)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => deleteHolding(h.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Donut Chart */}
          <div className={`${glass} p-6 flex flex-col`}>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Allocation by Type</h2>
            {byType.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] text-sm">Add holdings to see chart</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byType} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" paddingAngle={3}>
                      {byType.map((entry, i) => <Cell key={i} fill={COLORS[entry.name as AssetType] || '#6366f1'} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtRupee(v)} contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {byType.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[d.name as AssetType] }} />
                        <span className="text-[var(--text-secondary)]">{d.name}</span>
                      </div>
                      <span className="font-bold text-[var(--text-primary)]">{totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg rounded-[2rem] bg-zinc-900/95 border border-white/10 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editId ? 'Edit Holding' : 'Add Holding'}</h3>
                  <button onClick={cancelForm} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Asset Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. HDFC Bank, Nifty 50 Index, PPF" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Type *</label>
                      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AssetType }))}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-400 transition-colors">
                        {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Buy Date *</label>
                      <input type="date" value={form.buyDate} onChange={e => setForm(f => ({ ...f, buyDate: e.target.value }))}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Units / Qty *</label>
                      <input type="number" min="0" value={form.units || ''} onChange={e => setForm(f => ({ ...f, units: +e.target.value }))}
                        placeholder="e.g. 10, 100" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Buy Price (₹) *</label>
                      <input type="number" min="0" value={form.buyPrice || ''} onChange={e => setForm(f => ({ ...f, buyPrice: +e.target.value }))}
                        placeholder="Avg buy price per unit" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Current Price (₹) *</label>
                      <input type="number" min="0" value={form.currentPrice || ''} onChange={e => setForm(f => ({ ...f, currentPrice: +e.target.value }))}
                        placeholder="Current market price" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-400 transition-colors" />
                    </div>
                  </div>
                  {formError && <p className="text-red-400 text-sm font-medium">{formError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30">
                      <Check size={16} /> {editId ? 'Save Changes' : 'Add Holding'}
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
