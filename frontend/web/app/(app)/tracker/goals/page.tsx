'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Rocket, ShieldCheck } from 'lucide-react'
import { useTrackerStore, type Goal, fvSIP, fvLumpsum, pmtRequired, monthsBetween, fmtRupee } from '@/lib/stores/tracker-store'
import { cn } from '@/lib/utils'

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '💍', '🎓', '👶', '🏖️', '💼', '🏋️', '📱', '🌍', '💰', '🏥', '💎']

// Executive Slate & Emerald Palette
const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none transition-all duration-500'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

const emptyForm = (): Omit<Goal, 'id'> => ({
  name: '', emoji: '💎',
  targetAmount: 0,
  targetDate: new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
  currentSaved: 0,
  monthlyContribution: 0,
  expectedCAGR: 12,
})

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, sips, holdings, incomes, expenses } = useTrackerStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  const today = new Date().toISOString()

  // ── Unified Wealth Sync ──────────────────────────────────────────────────
  const totalSIPValue = sips.reduce((s, x) => s + fvSIP(x.monthlyAmount, x.expectedCAGR, Math.max(0, monthsBetween(x.startDate, today))), 0)
  const totalHoldingsValue = holdings.reduce((s, h) => s + (h.units * h.currentPrice), 0)
  const globalNetWorth = totalSIPValue + totalHoldingsValue

  const totalMonthlyIncome = incomes.reduce((s, x) => s + x.monthlyAmount, 0)
  const totalMonthlyExpenses = expenses.reduce((s, x) => s + x.monthlyAmount, 0)
  const monthlySurplus = Math.max(0, totalMonthlyIncome - totalMonthlyExpenses)
  let currentRemainingSurplus = monthlySurplus

  const enriched = goals.map(g => {
    // If goal has 0 saved, we suggest using a portion of globalNetWorth
    const monthsLeft = Math.max(0, monthsBetween(today, g.targetDate))
    const yearsLeft = monthsLeft / 12
    const projectedCorpus = fvLumpsum(g.currentSaved, g.expectedCAGR, yearsLeft) + fvSIP(g.monthlyContribution, g.expectedCAGR, monthsLeft)
    const gap = g.targetAmount - projectedCorpus
    const progressPct = Math.min(100, (projectedCorpus / g.targetAmount) * 100)
    const onTrack = projectedCorpus >= g.targetAmount
    const requiredSIP = pmtRequired(Math.max(0, g.targetAmount - fvLumpsum(g.currentSaved, g.expectedCAGR, yearsLeft)), g.expectedCAGR, monthsLeft)
    
    // Calculate how much of the surplus is actually left for THIS goal
    const availableForThisGoal = Math.max(0, currentRemainingSurplus)
    const surplusNeeded = Math.max(0, requiredSIP - g.monthlyContribution)
    
    // Subtract this goal's commitment from the running total
    currentRemainingSurplus -= g.monthlyContribution

    const projectionData = Array.from({ length: Math.min(Math.ceil(yearsLeft) + 1, 31) }, (_, yr) => ({
      year: `Y${yr}`, 
      corpus: Math.round(fvLumpsum(g.currentSaved, g.expectedCAGR, yr) + fvSIP(g.monthlyContribution, g.expectedCAGR, yr * 12)),
      target: g.targetAmount
    }))
    
    return { ...g, monthsLeft, yearsLeft, projectedCorpus, gap, progressPct, onTrack, requiredSIP, projectionData, availableForThisGoal, surplusNeeded }
  })

  const totalTargetAmount = goals.reduce((s, g) => s + g.targetAmount, 0)
  const goalsOnTrack = enriched.filter(g => g.onTrack).length

  const handleSubmit = () => {
    if (!form.name.trim()) { setFormError('Goal name is required'); return }
    if (form.targetAmount <= 0) { setFormError('Target amount must be > 0'); return }
    if (editId) updateGoal(editId, form)
    else addGoal(form)
    setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('')
  }

  const startEdit = (g: Goal) => {
    setForm({ name: g.name, emoji: g.emoji, targetAmount: g.targetAmount, targetDate: g.targetDate, currentSaved: g.currentSaved, monthlyContribution: g.monthlyContribution, expectedCAGR: g.expectedCAGR })
    setEditId(g.id); setShowForm(true)
  }

  const cancelForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('') }

  return (
    <div className="min-h-screen p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.5rem] bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <TrendingUp className="text-emerald-500" size={28} />
              </div>
              Goals Tracker
            </h1>
            <p className="text-zinc-500 dark:text-white/40 text-base font-medium flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              Mapping your financial vision with real-time portfolio sync.
            </p>
          </div>
          <button 
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center justify-center gap-3 px-8 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shadow-2xl dark:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            <Plus size={18} strokeWidth={3} /> Add New Goal
          </button>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Goals', value: `${goals.length}` },
            { label: 'Total Target', value: fmtRupee(totalTargetAmount) },
            { label: 'Saved Assets', value: fmtRupee(globalNetWorth), color: 'text-emerald-500', sub: 'Synced Portfolio' },
            { label: 'Surplus Runway', value: fmtRupee(monthlySurplus), sub: 'Investable Cash', color: 'text-cyan-500' },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-8 group hover:border-emerald-500/30 transition-all border-l-4", i === 2 ? 'border-l-emerald-500' : i === 3 ? 'border-l-cyan-500' : 'border-l-black/5')}>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 dark:text-white/30 mb-3">{c.label}</p>
              <p className={cn("text-3xl font-black tracking-tighter tabular-nums", c.color || "text-zinc-900 dark:text-white")}>{c.value}</p>
              <p className="text-[11px] font-bold text-zinc-400 dark:text-white/40 mt-1">{c.sub || 'Vision Totals'}</p>
            </div>
          ))}
        </div>

        {/* Goals Container */}
        <div className="space-y-8">
          {enriched.length === 0 ? (
            <div className={cn(glass, "py-32 flex flex-col items-center justify-center text-center px-8 bg-zinc-900/5 dark:bg-white/[0.01]")}>
              <div className="w-16 h-16 rounded-3xl bg-zinc-900/5 dark:bg-white/5 flex items-center justify-center mb-6">
                <Rocket className="text-zinc-300 dark:text-white/10" size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Your vision is empty</h3>
              <p className="text-zinc-500 dark:text-white/40 text-sm max-w-sm font-medium leading-relaxed">Add a milestone like retirement, a home, or travel to start projecting your growth and building your financial future.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {enriched.map(g => (
                <motion.div key={g.id} layout className={cn(glass, "overflow-hidden group hover:border-emerald-500/20")}>
                  <div 
                    className="px-8 py-8 flex flex-col md:flex-row items-center gap-8 cursor-pointer"
                    onClick={() => setExpandedGoal(expandedGoal === g.id ? null : g.id)}
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-black/5 dark:bg-white/5 flex items-center justify-center text-4xl shadow-inner border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">{g.emoji}</div>
                    
                    <div className="flex-1 w-full space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{g.name}</h3>
                          <div className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border backdrop-blur-3xl",
                            g.onTrack ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                          )}>
                            {g.onTrack ? 'Safe' : 'Action Required'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); startEdit(g) }} className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"><Edit2 size={16} /></button>
                          <button onClick={e => { e.stopPropagation(); deleteGoal(g.id) }} className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-red-500/10 dark:hover:bg-red-500/10 text-zinc-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${g.progressPct}%` }}
                          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                          className={cn("h-full rounded-full transition-colors", g.onTrack ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-amber-500")}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-10">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-1">Target</span>
                            <span className="font-black text-zinc-900 dark:text-white tabular-nums text-lg tracking-tighter">{fmtRupee(g.targetAmount)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-1">Projected</span>
                            <span className={cn("font-black tabular-nums text-lg tracking-tighter", g.onTrack ? "text-emerald-500" : "text-zinc-900 dark:text-white")}>{fmtRupee(g.projectedCorpus)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-1">Horizon</span>
                            <span className="font-bold text-zinc-500 dark:text-white/60 tabular-nums uppercase text-[11px] mt-1">{Math.floor(g.yearsLeft)}y {Math.round((g.yearsLeft % 1) * 12)}m</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-4xl font-black text-black/10 dark:text-white/10">{g.progressPct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedGoal === g.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-8 pb-10 pt-4 border-t border-black/5 dark:border-white/5 grid lg:grid-cols-[1fr_340px] gap-12 bg-zinc-900/5 dark:bg-white/[0.01]">
                          
                          <div className="h-[280px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={g.projectionData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id={`grad-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={g.onTrack ? "#10b981" : "#3b82f6"} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={g.onTrack ? "#10b981" : "#3b82f6"} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                                  itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#fff' }}
                                  labelStyle={{ display: 'none' }}
                                  formatter={(v: number) => [fmtRupee(v), '']}
                                />
                                <Area type="monotone" dataKey="corpus" stroke={g.onTrack ? "#10b981" : "#3b82f6"} fill={`url(#grad-${g.id})`} strokeWidth={4} />
                                <Area type="monotone" dataKey="target" stroke="#94a3b8" fill="none" strokeDasharray="8 8" strokeWidth={1} strokeOpacity={0.3} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="space-y-6">
                            <div className={cn(surface, "p-8 space-y-5")}>
                              <div className="flex justify-between items-center pb-4 border-b border-black/5 dark:border-white/5">
                                <span className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest">Growth Rate</span>
                                <span className="text-sm font-black text-zinc-900 dark:text-white">{g.expectedCAGR}% pa</span>
                              </div>
                              
                              <div className="pt-2">
                                {g.onTrack ? (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-500">
                                      <ShieldCheck size={20} />
                                      <span className="text-[11px] font-black uppercase tracking-widest">Vision Secured</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-white/40 leading-relaxed font-medium">Your current allocation covers this milestone. Maintain velocity.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-5">
                                    <div className="flex items-center gap-3 text-amber-500">
                                      <AlertTriangle size={20} />
                                      <span className="text-[11px] font-black uppercase tracking-widest">Correction Required</span>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-black text-zinc-400 dark:text-white/30 uppercase tracking-widest">Target Monthly</p>
                                      <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter tabular-nums">{fmtRupee(g.requiredSIP)}</p>
                                    </div>
                                    {g.availableForThisGoal > 0 && !g.onTrack && (
                                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                                          <Sparkles size={12} /> Surplus Tip
                                        </p>
                                        <p className="text-[11px] font-bold text-zinc-600 dark:text-emerald-400/80 leading-snug">
                                          Allocating {fmtRupee(Math.min(g.availableForThisGoal, g.surplusNeeded))} of your available surplus would put this goal back on track.
                                        </p>
                                      </div>
                                    )}
                                    {g.availableForThisGoal <= 0 && !g.onTrack && (
                                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                                          <AlertTriangle size={12} /> Budget Alert
                                        </p>
                                        <p className="text-[11px] font-bold text-zinc-600 dark:text-amber-400/80 leading-snug">
                                          No uncommitted surplus left. Consider reducing 'Want' expenses or adjusting other goals.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelForm} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl rounded-[3rem] bg-zinc-900 border border-white/10 shadow-2xl p-10 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">{editId ? 'Refine Vision' : 'New Goal Milestone'}</h3>
                  <button onClick={cancelForm} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={20} /></button>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-wrap gap-3">
                    {GOAL_EMOJIS.map(e => (
                      <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                        className={cn(
                          "w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all",
                          form.emoji === e ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" : "bg-white/5 border border-white/5 hover:bg-white/10"
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Goal Label</label>
                      <input 
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Retirement 2045" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg placeholder-white/20 focus:outline-none focus:border-emerald-500 transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Target Amount</label>
                        <input 
                          type="number" value={form.targetAmount || ''} onChange={e => setForm(f => ({ ...f, targetAmount: +e.target.value }))}
                          placeholder="₹ 0" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Target Date</label>
                        <input 
                          type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2 px-2">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Already Saved</label>
                          <button onClick={() => setForm(f => ({ ...f, currentSaved: globalNetWorth }))} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:underline transition-all">Use Portfolio Value</button>
                        </div>
                        <input 
                          type="number" value={form.currentSaved || ''} onChange={e => setForm(f => ({ ...f, currentSaved: +e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Monthly Committed</label>
                        <input 
                          type="number" value={form.monthlyContribution || ''} onChange={e => setForm(f => ({ ...f, monthlyContribution: +e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {formError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{formError}</p>}

                  <div className="flex gap-4 pt-6">
                    <button onClick={cancelForm} className="flex-1 py-5 rounded-2xl text-white/30 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                      {editId ? 'Commit Changes' : 'Ignite Goal'}
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
