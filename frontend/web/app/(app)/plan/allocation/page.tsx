'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, PieChart as PieIcon, AlertTriangle, ArrowUpDown } from 'lucide-react'
import { useTrackerStore, type AllocationEntry, type AllocationClass, fmtRupee } from '@/lib/stores/tracker-store'

const ASSET_CLASSES: AllocationClass[] = ['Equity', 'Debt', 'Gold', 'Cash', 'Real Estate', 'Crypto']

const CLASS_COLORS: Record<AllocationClass, string> = {
  'Equity': '#6366f1',
  'Debt': '#10b981',
  'Gold': '#f59e0b',
  'Cash': '#3b82f6',
  'Real Estate': '#ef4444',
  'Crypto': '#f97316',
}

// Risk score weights (higher = riskier)
const RISK_WEIGHTS: Record<AllocationClass, number> = {
  'Cash': 1, 'Debt': 2, 'Gold': 3, 'Real Estate': 4, 'Equity': 5, 'Crypto': 7,
}

const glass = 'rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl'

const emptyForm = (): Omit<AllocationEntry, 'id'> => ({
  assetClass: 'Equity', currentValue: 0, targetPercent: 0,
})

export default function AllocationPage() {
  const { allocations, addAllocation, updateAllocation, deleteAllocation } = useTrackerStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalValue = allocations.reduce((s, a) => s + a.currentValue, 0)
  const totalTargetPct = allocations.reduce((s, a) => s + a.targetPercent, 0)

  const enriched = allocations.map(a => {
    const actualPct = totalValue > 0 ? (a.currentValue / totalValue) * 100 : 0
    const drift = actualPct - a.targetPercent
    // Rebalancing: how much to buy/sell to reach target
    const targetValue = (a.targetPercent / 100) * totalValue
    const rebalanceAmount = targetValue - a.currentValue
    return { ...a, actualPct, drift, targetValue, rebalanceAmount }
  })

  // Weighted risk score 1-10
  const riskScore = totalValue > 0
    ? enriched.reduce((s, a) => s + (a.actualPct / 100) * (RISK_WEIGHTS[a.assetClass] || 1), 0) / 7 * 10
    : 0

  const getRiskLabel = (score: number) => {
    if (score < 3) return { label: 'Conservative', color: 'text-emerald-400' }
    if (score < 5) return { label: 'Moderate', color: 'text-amber-400' }
    if (score < 7) return { label: 'Aggressive', color: 'text-orange-400' }
    return { label: 'Very Aggressive', color: 'text-red-400' }
  }
  const risk = getRiskLabel(riskScore)

  // Donut data
  const currentDonut = enriched.map(a => ({ name: a.assetClass, value: a.currentValue })).filter(x => x.value > 0)
  const targetDonut = enriched.map(a => ({ name: a.assetClass, value: a.targetPercent })).filter(x => x.value > 0)

  // Radar chart data
  const radarData = ASSET_CLASSES.map(cls => {
    const entry = enriched.find(a => a.assetClass === cls)
    return {
      subject: cls,
      Actual: entry ? Math.round(entry.actualPct) : 0,
      Target: entry ? entry.targetPercent : 0,
    }
  })

  // ── Form ──────────────────────────────────────────────────────────────────
  const validate = () => {
    if (form.currentValue < 0) return 'Value cannot be negative'
    if (form.targetPercent < 0 || form.targetPercent > 100) return 'Target must be 0-100%'
    if (!editId && allocations.some(a => a.assetClass === form.assetClass)) return `${form.assetClass} already exists — edit it instead`
    return ''
  }

  const handleSubmit = () => {
    const err = validate()
    if (err) { setFormError(err); return }
    if (editId) { updateAllocation(editId, form); setEditId(null) }
    else addAllocation(form)
    setForm(emptyForm()); setShowForm(false); setFormError('')
  }

  const startEdit = (a: AllocationEntry) => {
    setForm({ assetClass: a.assetClass, currentValue: a.currentValue, targetPercent: a.targetPercent })
    setEditId(a.id); setShowForm(true)
  }

  const cancelForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('') }

  return (
    <div className="min-h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-white/20 dark:bg-white/[0.01] backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10"><PieIcon className="text-blue-400" size={26} /></div>
              Asset Allocation
            </h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm">Set your target allocation. See drift and get exact rebalancing amounts.</p>
          </div>
          <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95">
            <Plus size={18} /> Add Asset Class
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Portfolio', value: fmtRupee(totalValue), color: 'text-[var(--text-primary)]' },
            { label: 'Asset Classes', value: `${allocations.length} tracked`, color: 'text-blue-400' },
            { label: 'Target Allocated', value: `${totalTargetPct.toFixed(0)}%`, color: totalTargetPct === 100 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Risk Score', value: `${riskScore.toFixed(1)} / 10`, color: risk.color },
          ].map((c, i) => (
            <div key={i} className={`${glass} p-5`}>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1 opacity-70">{c.label}</p>
              <p className={`text-2xl font-black tracking-tight ${c.color}`}>{c.value}</p>
              {i === 3 && <p className={`text-xs font-bold mt-1 ${risk.color}`}>{risk.label}</p>}
            </div>
          ))}
        </div>

        {totalTargetPct !== 0 && totalTargetPct !== 100 && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 font-medium">Your target percentages add up to <strong>{totalTargetPct.toFixed(0)}%</strong>. They should total 100% for accurate rebalancing.</p>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Current Allocation Donut */}
          <div className={`${glass} p-6 flex flex-col`}>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Current Allocation</h2>
            {currentDonut.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] text-sm">Add assets to see chart</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={currentDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {currentDonut.map((d, i) => <Cell key={i} fill={CLASS_COLORS[d.name as AllocationClass]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtRupee(v)} contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {currentDonut.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLORS[d.name as AllocationClass] }} /><span className="text-[var(--text-secondary)]">{d.name}</span></div>
                      <span className="font-bold text-[var(--text-primary)]">{totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Target Allocation Donut */}
          <div className={`${glass} p-6 flex flex-col`}>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Target Allocation</h2>
            {targetDonut.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] text-sm">Set targets to see chart</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={targetDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {targetDonut.map((d, i) => <Cell key={i} fill={CLASS_COLORS[d.name as AllocationClass]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {targetDonut.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: CLASS_COLORS[d.name as AllocationClass] }} /><span className="text-[var(--text-secondary)]">{d.name}</span></div>
                      <span className="font-bold text-[var(--text-primary)]">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Radar */}
          <div className={`${glass} p-6 flex flex-col`}>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Actual vs Target</h2>
            {allocations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] text-sm">Add allocations to see</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Radar name="Actual" dataKey="Actual" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Radar name="Target" dataKey="Target" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeDasharray="5 5" />
                  <Tooltip contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Rebalancing Table */}
        <div className={`${glass} overflow-hidden`}>
          <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
            <ArrowUpDown size={18} className="text-[var(--brand-primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Rebalancing Actions</h2>
          </div>
          {enriched.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-4"><PieIcon className="text-blue-400" size={28} /></div>
              <p className="text-[var(--text-secondary)] font-medium">No asset classes added yet.</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Add your Equity, Debt, Gold, etc. with current value and target %.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] border-b border-white/10">
                    {['Asset Class', 'Current Value', 'Current %', 'Target %', 'Drift', 'Action Required', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-bold opacity-70">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(a => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full" style={{ background: CLASS_COLORS[a.assetClass] }} />
                          <span className="font-semibold text-[var(--text-primary)]">{a.assetClass}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[var(--text-primary)]">{fmtRupee(a.currentValue)}</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{a.actualPct.toFixed(1)}%</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{a.targetPercent}%</td>
                      <td className={`px-5 py-4 font-bold ${Math.abs(a.drift) < 2 ? 'text-emerald-400' : Math.abs(a.drift) < 5 ? 'text-amber-400' : 'text-red-400'}`}>
                        {a.drift >= 0 ? '+' : ''}{a.drift.toFixed(1)}%
                      </td>
                      <td className="px-5 py-4">
                        {Math.abs(a.rebalanceAmount) < 500 ? (
                          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">✓ Balanced</span>
                        ) : a.rebalanceAmount > 0 ? (
                          <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold">Buy {fmtRupee(a.rebalanceAmount)}</span>
                        ) : (
                          <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold">Sell {fmtRupee(Math.abs(a.rebalanceAmount))}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => deleteAllocation(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm rounded-[2rem] bg-zinc-900/95 border border-white/10 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editId ? 'Edit Asset Class' : 'Add Asset Class'}</h3>
                  <button onClick={cancelForm} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Asset Class *</label>
                    <select value={form.assetClass} onChange={e => setForm(f => ({ ...f, assetClass: e.target.value as AllocationClass }))} disabled={!!editId}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50">
                      {ASSET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Current Value (₹) *</label>
                    <input type="number" min="0" value={form.currentValue || ''} onChange={e => setForm(f => ({ ...f, currentValue: +e.target.value }))}
                      placeholder="Total current ₹ value" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-400 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Target Allocation (%) *</label>
                    <input type="number" min="0" max="100" value={form.targetPercent || ''} onChange={e => setForm(f => ({ ...f, targetPercent: +e.target.value }))}
                      placeholder="e.g. 60 for 60%" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-400 transition-colors" />
                    <p className="text-[11px] text-white/40 mt-1.5">Typical: Equity 60%, Debt 25%, Gold 10%, Cash 5%</p>
                  </div>
                  {formError && <p className="text-red-400 text-sm font-medium">{formError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                      <Check size={16} /> {editId ? 'Save' : 'Add'}
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
