'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, PieChart as PieIcon, AlertTriangle, ArrowUpDown, ArrowLeft, ShieldCheck, Zap, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTrackerStore, type AllocationEntry, type AllocationClass, fmtRupee } from '@/lib/stores/tracker-store'
import { cn } from '@/lib/utils'

const ASSET_CLASSES: AllocationClass[] = ['Equity', 'Debt', 'Gold', 'Cash', 'Real Estate', 'Crypto']

// Premium Palette Standardized
const CLASS_COLORS: Record<AllocationClass, string> = {
  'Equity': '#10b981',      // Emerald
  'Debt': '#6366f1',        // Indigo
  'Gold': '#f59e0b',        // Amber
  'Cash': '#3b82f6',        // Blue
  'Real Estate': '#f43f5e',   // Rose
  'Crypto': '#8b5cf6',      // Violet
}

const RISK_WEIGHTS: Record<AllocationClass, number> = {
  'Cash': 1, 'Debt': 2, 'Gold': 3, 'Real Estate': 4, 'Equity': 5, 'Crypto': 7,
}

// Premium UI Tokens
const glass = 'rounded-[2.5rem] bg-white/70 dark:bg-black/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl transition-all duration-300'
const surface = 'rounded-[2rem] bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/10'

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
    if (score < 3) return { label: 'Conservative', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    if (score < 5) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    if (score < 7) return { label: 'Aggressive', color: 'text-orange-500', bg: 'bg-orange-500/10' }
    return { label: 'Very Aggressive', color: 'text-rose-500', bg: 'bg-rose-500/10' }
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
    <div className="min-h-screen pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <PieIcon className="text-zinc-900 dark:text-white" size={28} />
              </div>
              Asset Allocation
            </h1>
            <p className="text-zinc-500 dark:text-white/40 text-lg font-medium leading-relaxed max-w-2xl">Define your target strategy, monitor drift, and execute precision rebalancing.</p>
          </div>
          <button 
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center justify-center gap-3 h-14 px-8 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] shadow-xl shadow-black/10 dark:shadow-white/10 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} strokeWidth={4} /> Add Asset Class
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Portfolio', value: fmtRupee(totalValue), color: 'text-zinc-900 dark:text-white' },
            { label: 'Diversification', value: `${allocations.length} Classes`, color: 'text-zinc-900 dark:text-white' },
            { label: 'Target Alignment', value: `${totalTargetPct.toFixed(0)}%`, isWarning: totalTargetPct !== 100, color: totalTargetPct !== 100 ? 'text-amber-500' : 'text-emerald-500' },
            { label: 'Risk Profile', value: risk.label, isRisk: true, color: risk.color },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-8 group hover:bg-black/5 dark:hover:bg-white/5 transition-all")}>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 dark:text-white/30 mb-3">{c.label}</p>
              <p className={cn("text-2xl font-black tracking-tight", c.color)}>
                {c.value}
              </p>
              {c.isRisk && (
                <div className="mt-3 flex items-center gap-2">
                   <div className={cn("w-2 h-2 rounded-full", c.color.replace('text-', 'bg-'))} />
                   <span className={cn("text-[9px] font-black uppercase tracking-widest", c.color)}>Score: {riskScore.toFixed(1)}/10</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Alerts */}
        {totalTargetPct !== 0 && totalTargetPct !== 100 && (
          <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 backdrop-blur-3xl animate-pulse">
            <AlertTriangle className="text-amber-500" size={20} />
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400/80 tracking-tight">Your target allocation totals <span className="font-black underline">{totalTargetPct.toFixed(0)}%</span>. Adjust them to 100% for precision rebalancing.</p>
          </div>
        )}

        {/* Visualization Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className={cn(glass, "p-10 flex flex-col")}>
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40">Current Mix</h3>
              <div className="p-2 rounded-lg bg-emerald-500/10"><ShieldCheck size={14} className="text-emerald-500" /></div>
            </div>
            {currentDonut.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                <PieIcon size={48} className="mb-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Data</span>
              </div>
            ) : (
              <div className="w-full space-y-10">
                <div className="h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentDonut} cx="50%" cy="50%" innerRadius={70} outerRadius={95} dataKey="value" paddingAngle={6} stroke="none">
                        {currentDonut.map((d, i) => <Cell key={i} fill={CLASS_COLORS[d.name as AllocationClass]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(25,25,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', backdropFilter: 'blur(10px)', color: '#fff' }} formatter={(v: number) => fmtRupee(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Active</span>
                     <span className="text-lg font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(totalValue)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  {currentDonut.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ background: CLASS_COLORS[d.name as AllocationClass] }} />
                      <span className="text-[10px] font-black text-zinc-500 dark:text-white/60 truncate uppercase tracking-widest">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={cn(glass, "p-10 flex flex-col")}>
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40">Target Strategy</h3>
              <div className="p-2 rounded-lg bg-indigo-500/10"><Zap size={14} className="text-indigo-500" /></div>
            </div>
            {targetDonut.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                <Activity size={48} className="mb-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Define Targets</span>
              </div>
            ) : (
              <div className="w-full space-y-10">
                <div className="h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={targetDonut} cx="50%" cy="50%" innerRadius={70} outerRadius={95} dataKey="value" paddingAngle={6} stroke="none">
                        {targetDonut.map((d, i) => <Cell key={i} fill={CLASS_COLORS[d.name as AllocationClass]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'rgba(25,25,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', backdropFilter: 'blur(10px)', color: '#fff' }} formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Objective</span>
                     <span className="text-lg font-black text-zinc-900 dark:text-white tabular-nums">{totalTargetPct}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  {targetDonut.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ background: CLASS_COLORS[d.name as AllocationClass] }} />
                      <span className="text-[10px] font-black text-zinc-500 dark:text-white/60 truncate uppercase tracking-widest">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={cn(glass, "p-10 flex flex-col")}>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 mb-10 w-full">Drift Radar</h3>
            {allocations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-500 mb-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Analysis</span>
              </div>
            ) : (
              <div className="w-full h-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="currentColor" strokeOpacity={0.1} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 9, fontWeight: 900 }} />
                    <Radar name="Actual" dataKey="Actual" stroke={CLASS_COLORS.Equity} fill={CLASS_COLORS.Equity} fillOpacity={0.3} strokeWidth={3} />
                    <Radar name="Target" dataKey="Target" stroke="currentColor" fill="none" strokeWidth={2} strokeDasharray="6 6" strokeOpacity={0.2} />
                    <Tooltip contentStyle={{ background: 'rgba(25,25,25,0.95)', border: 'none', borderRadius: '1.25rem', backdropFilter: 'blur(10px)', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* Rebalancing Strategy Ledger */}
        <div className={cn(glass, "overflow-hidden border-t-0")}>
          <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-zinc-900/5 dark:bg-white/[0.02]">
            <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-3 uppercase tracking-widest">
              <ArrowUpDown size={20} className="text-zinc-400 dark:text-white/20" />
              Rebalancing Strategy
            </h2>
          </div>

          {enriched.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center px-8">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight uppercase">Ledger Inactive</h3>
              <p className="text-zinc-500 dark:text-white/40 text-sm max-w-sm font-medium leading-relaxed">Add your equity, debt, and gold allocations to reveal the roadmap to your target strategy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/30 border-b border-black/5 dark:border-white/5">
                    <th className="px-8 py-6 text-left">Asset Class</th>
                    <th className="px-8 py-6 text-left">Capital Deployed</th>
                    <th className="px-8 py-6 text-left">Actual Weight</th>
                    <th className="px-8 py-6 text-left">Target Weight</th>
                    <th className="px-8 py-6 text-left">Strategic Drift</th>
                    <th className="px-8 py-6 text-left">Required Action</th>
                    <th className="px-8 py-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {enriched.map(a => (
                    <tr key={a.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full shadow-lg" style={{ background: CLASS_COLORS[a.assetClass] }} />
                          <span className="font-black text-zinc-900 dark:text-white uppercase tracking-widest text-[11px]">{a.assetClass}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(a.currentValue)}</td>
                      <td className="px-8 py-6 text-zinc-500 dark:text-white/60 font-black tabular-nums">{a.actualPct.toFixed(1)}%</td>
                      <td className="px-8 py-6 text-zinc-500 dark:text-white/60 font-black tabular-nums">{a.targetPercent}%</td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "font-black text-[11px] tabular-nums",
                          Math.abs(a.drift) < 2 ? "text-emerald-500" : 
                          Math.abs(a.drift) < 5 ? "text-amber-500" : "text-rose-500"
                        )}>
                          {a.drift >= 0 ? '+' : ''}{a.drift.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {Math.abs(a.rebalanceAmount) < 500 ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-lg shadow-emerald-500/5">Optimized</span>
                        ) : a.rebalanceAmount > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-1">Buy / Accumulate</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(a.rebalanceAmount)}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-rose-500 tracking-[0.2em] mb-1">Sell / Trim</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">{fmtRupee(Math.abs(a.rebalanceAmount))}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => startEdit(a)} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center justify-center"><Edit2 size={14} /></button>
                          <button onClick={() => deleteAllocation(a.id)} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-rose-500/10 text-zinc-400 dark:text-white/40 hover:text-rose-500 transition-all flex items-center justify-center"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal with Ultra-Premium Glass */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelForm} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
                className="relative w-full max-w-xl rounded-[3rem] bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden p-0"
              >
                <div className="px-10 py-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-[0.2em]">{editId ? 'Refine Strategy' : 'Strategic Asset'}</h3>
                  <button onClick={cancelForm} className="w-12 h-12 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center"><X size={24} /></button>
                </div>
                
                <div className="p-10 space-y-10">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Select Asset Class</label>
                      <select value={form.assetClass} onChange={e => setForm(f => ({ ...f, assetClass: e.target.value as AllocationClass }))} disabled={!!editId}
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black uppercase tracking-widest text-xs focus:outline-none focus:border-emerald-500 appearance-none disabled:opacity-50 transition-all">
                        {ASSET_CLASSES.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Current Value (₹)</label>
                        <input type="number" value={form.currentValue || ''} onChange={e => setForm(f => ({ ...f, currentValue: +e.target.value }))}
                          placeholder="e.g. 5,00,000" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-white/10" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Target Strategy (%)</label>
                        <input type="number" value={form.targetPercent || ''} onChange={e => setForm(f => ({ ...f, targetPercent: +e.target.value }))}
                          placeholder="e.g. 60" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black text-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-white/10" />
                      </div>
                    </div>
                  </div>

                  {formError && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] text-center"
                    >
                      {formError}
                    </motion.p>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button onClick={cancelForm} className="flex-1 h-14 rounded-2xl text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">Discard</button>
                    <button onClick={handleSubmit} className="flex-1 h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] shadow-xl shadow-white/10 hover:scale-[1.02] active:scale-95 transition-all">
                      {editId ? 'Update Strategy' : 'Confirm Allocation'}
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
