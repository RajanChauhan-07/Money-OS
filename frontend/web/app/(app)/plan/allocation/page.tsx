'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, PieChart as PieIcon, AlertTriangle, ArrowUpDown, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTrackerStore, type AllocationEntry, type AllocationClass, fmtRupee } from '@/lib/stores/tracker-store'
import { cn } from '@/lib/utils'

const ASSET_CLASSES: AllocationClass[] = ['Equity', 'Debt', 'Gold', 'Cash', 'Real Estate', 'Crypto']

const CLASS_COLORS: Record<AllocationClass, string> = {
  'Equity': '#6366f1',
  'Debt': '#10b981',
  'Gold': '#f59e0b',
  'Cash': '#3b82f6',
  'Real Estate': '#ef4444',
  'Crypto': '#f97316',
}

const RISK_WEIGHTS: Record<AllocationClass, number> = {
  'Cash': 1, 'Debt': 2, 'Gold': 3, 'Real Estate': 4, 'Equity': 5, 'Crypto': 7,
}

// Premium Frosted Utilities
const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

const emptyForm = (): Omit<AllocationEntry, 'id'> => ({
  assetClass: 'Equity', currentValue: 0, targetPercent: 0,
})

export default function AllocationPage() {
  const router = useRouter()
  const { allocations, addAllocation, updateAllocation, deleteAllocation } = useTrackerStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')

  const totalValue = allocations.reduce((s, a) => s + a.currentValue, 0)
  const totalTargetPct = allocations.reduce((s, a) => s + a.targetPercent, 0)

  const enriched = allocations.map(a => {
    const actualPct = totalValue > 0 ? (a.currentValue / totalValue) * 100 : 0
    const drift = actualPct - a.targetPercent
    const targetValue = (a.targetPercent / 100) * totalValue
    const rebalanceAmount = targetValue - a.currentValue
    return { ...a, actualPct, drift, targetValue, rebalanceAmount }
  })

  const riskScore = totalValue > 0
    ? enriched.reduce((s, a) => s + (a.actualPct / 100) * (RISK_WEIGHTS[a.assetClass] || 1), 0) / 7 * 10
    : 0

  const getRiskLabel = (score: number) => {
    if (score < 3) return { label: 'Conservative', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
    if (score < 5) return { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
    if (score < 7) return { label: 'Aggressive', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' }
    return { label: 'Very Aggressive', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' }
  }
  const risk = getRiskLabel(riskScore)

  const currentDonut = enriched.map(a => ({ name: a.assetClass, value: a.currentValue })).filter(x => x.value > 0)
  const targetDonut = enriched.map(a => ({ name: a.assetClass, value: a.targetPercent })).filter(x => x.value > 0)

  const radarData = ASSET_CLASSES.map(cls => {
    const entry = enriched.find(a => a.assetClass === cls)
    return {
      subject: cls,
      Actual: entry ? Math.round(entry.actualPct) : 0,
      Target: entry ? entry.targetPercent : 0,
    }
  })

  const handleSubmit = () => {
    if (form.currentValue < 0) { setFormError('Value cannot be negative'); return }
    if (form.targetPercent < 0 || form.targetPercent > 100) { setFormError('Target must be 0-100%'); return }
    if (editId) updateAllocation(editId, form)
    else addAllocation(form)
    setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('')
  }

  const startEdit = (a: AllocationEntry) => {
    setForm({ assetClass: a.assetClass, currentValue: a.currentValue, targetPercent: a.targetPercent })
    setEditId(a.id); setShowForm(true)
  }

  const cancelForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('') }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} /> Back
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <PieIcon className="text-zinc-900 dark:text-white" size={24} />
              </div>
              Asset Allocation
            </h1>
            <p className="text-zinc-500 dark:text-white/50 text-lg font-medium">Define your target strategy and optimize your rebalancing.</p>
          </div>
          <button 
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm transition-all hover:bg-zinc-800 dark:hover:bg-white/90 active:scale-95 shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <Plus size={20} strokeWidth={3} /> Add Asset Class
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Portfolio', value: fmtRupee(totalValue) },
            { label: 'Asset Classes', value: `${allocations.length} tracked` },
            { label: 'Target Allocated', value: `${totalTargetPct.toFixed(0)}%`, isWarning: totalTargetPct !== 100 },
            { label: 'Risk Score', value: `${riskScore.toFixed(1)} / 10`, isRisk: true },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-8 group hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all")}>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-white/40 mb-3">{c.label}</p>
              <p className={cn(
                "text-3xl font-bold tracking-tighter",
                c.isWarning ? "text-amber-600 dark:text-amber-400" : 
                c.isRisk ? risk.color : "text-zinc-900 dark:text-white"
              )}>
                {c.value}
              </p>
              {c.isRisk && <span className={cn("inline-block mt-2 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", risk.bg, risk.color.replace('text-', 'border-').replace('dark:', ''))}>{risk.label}</span>}
            </div>
          ))}
        </div>

        {/* Alerts */}
        {totalTargetPct !== 0 && totalTargetPct !== 100 && (
          <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 backdrop-blur-3xl">
            <AlertTriangle className="text-amber-500" size={20} />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400/80">Your target allocation totals <span className="font-black underline">{totalTargetPct.toFixed(0)}%</span>. Adjust them to 100% for accurate rebalancing insights.</p>
          </div>
        )}

        {/* Visualization Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className={cn(glass, "p-10 flex flex-col items-center")}>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 mb-10 w-full">Current</h3>
            {currentDonut.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-500 mb-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">No data</span>
              </div>
            ) : (
              <div className="w-full space-y-8">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                        {currentDonut.map((d, i) => <Cell key={i} fill={CLASS_COLORS[d.name as AllocationClass]} stroke="none" />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(25,25,25,0.9)', border: 'none', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', color: '#fff' }} formatter={(v: number) => fmtRupee(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {currentDonut.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: CLASS_COLORS[d.name as AllocationClass] }} />
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-white/40 truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={cn(glass, "p-10 flex flex-col items-center")}>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 mb-10 w-full">Target</h3>
            {targetDonut.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-500 mb-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">No targets</span>
              </div>
            ) : (
              <div className="w-full space-y-8">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={targetDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                        {targetDonut.map((d, i) => <Cell key={i} fill={CLASS_COLORS[d.name as AllocationClass]} stroke="none" />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(25,25,25,0.9)', border: 'none', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', color: '#fff' }} formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {targetDonut.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: CLASS_COLORS[d.name as AllocationClass] }} />
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-white/40 truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={cn(glass, "p-10 flex flex-col items-center")}>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 mb-10 w-full">Drift Radar</h3>
            {allocations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-500 mb-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">No allocations</span>
              </div>
            ) : (
              <div className="w-full h-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="currentColor" strokeOpacity={0.05} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', opacity: 0.3, fontSize: 8, fontWeight: 900 }} />
                    <Radar name="Actual" dataKey="Actual" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Target" dataKey="Target" stroke="currentColor" fill="none" strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.2} />
                    <Tooltip contentStyle={{ background: 'rgba(25,25,25,0.9)', border: 'none', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* Rebalancing Table */}
        <div className={cn(glass, "overflow-hidden")}>
          <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              <ArrowUpDown size={20} className="text-zinc-400 dark:text-white/20" />
              Rebalancing Strategy
            </h2>
          </div>

          {enriched.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center px-8">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">No asset classes tracked</h3>
              <p className="text-zinc-500 dark:text-white/40 text-sm max-w-sm font-medium leading-relaxed">Add your equity, debt, and gold allocations to see real-time drift analysis and buy/sell actions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/30 border-b border-black/5 dark:border-white/5">
                    <th className="px-8 py-5 text-left">Asset Class</th>
                    <th className="px-8 py-5 text-left">Current Value</th>
                    <th className="px-8 py-5 text-left">Actual %</th>
                    <th className="px-8 py-5 text-left">Target %</th>
                    <th className="px-8 py-5 text-left">Drift</th>
                    <th className="px-8 py-5 text-left">Required Action</th>
                    <th className="px-8 py-5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {enriched.map(a => (
                    <tr key={a.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ background: CLASS_COLORS[a.assetClass] }} />
                          <span className="font-bold text-zinc-900 dark:text-white">{a.assetClass}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-zinc-900 dark:text-white">{fmtRupee(a.currentValue)}</td>
                      <td className="px-8 py-6 text-zinc-500 dark:text-white/60 font-medium">{a.actualPct.toFixed(1)}%</td>
                      <td className="px-8 py-6 text-zinc-500 dark:text-white/60 font-medium">{a.targetPercent}%</td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "font-black text-xs",
                          Math.abs(a.drift) < 2 ? "text-emerald-600 dark:text-emerald-400" : 
                          Math.abs(a.drift) < 5 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {a.drift >= 0 ? '+' : ''}{a.drift.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {Math.abs(a.rebalanceAmount) < 500 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Optimal</span>
                        ) : a.rebalanceAmount > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1">Buy</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white">{fmtRupee(a.rebalanceAmount)}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest mb-1">Sell</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white">{fmtRupee(Math.abs(a.rebalanceAmount))}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(a)} className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white"><Edit2 size={14} /></button>
                          <button onClick={() => deleteAllocation(a.id)} className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-red-500/10 dark:hover:bg-red-500/10 text-zinc-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelForm} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl rounded-[3rem] bg-white dark:bg-white/[0.08] border border-black/10 dark:border-white/20 backdrop-blur-[100px] shadow-2xl p-12 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{editId ? 'Refine Strategy' : 'New Asset Class'}</h3>
                  <button onClick={cancelForm} className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Asset Class</label>
                      <select value={form.assetClass} onChange={e => setForm(f => ({ ...f, assetClass: e.target.value as AllocationClass }))} disabled={!!editId}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none appearance-none disabled:opacity-50">
                        {ASSET_CLASSES.map(c => <option key={c} value={c} className="bg-white dark:bg-zinc-900">{c}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Current Value</label>
                        <input type="number" value={form.currentValue || ''} onChange={e => setForm(f => ({ ...f, currentValue: +e.target.value }))}
                          placeholder="₹ 0" className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Target (%)</label>
                        <input type="number" value={form.targetPercent || ''} onChange={e => setForm(f => ({ ...f, targetPercent: +e.target.value }))}
                          placeholder="e.g. 60" className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white font-bold focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {formError && <p className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{formError}</p>}

                  <div className="flex gap-4 pt-6">
                    <button onClick={cancelForm} className="flex-1 py-5 rounded-2xl text-zinc-400 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white font-bold transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-5 rounded-[2rem] bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-sm shadow-xl dark:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                      {editId ? 'Apply Strategy' : 'Lock Allocation'}
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
