'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useTrackerStore, type Goal, fvSIP, fvLumpsum, pmtRequired, monthsBetween, fmtRupee } from '@/lib/stores/tracker-store'
import { cn } from '@/lib/utils'

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '💍', '🎓', '👶', '🏖️', '💼', '🏋️', '📱', '🌍', '💰', '🏥', '💎']

// Pure Frosted Glass Utility - Optimized for both modes
const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

const emptyForm = (): Omit<Goal, 'id'> => ({
  name: '', emoji: '💎',
  targetAmount: 0,
  targetDate: new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
  currentSaved: 0,
  monthlyContribution: 0,
  expectedCAGR: 10,
})

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useTrackerStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  const today = new Date().toISOString()

  const enriched = goals.map(g => {
    const monthsLeft = Math.max(0, monthsBetween(today, g.targetDate))
    const yearsLeft = monthsLeft / 12
    const projectedCorpus = fvLumpsum(g.currentSaved, g.expectedCAGR, yearsLeft) + fvSIP(g.monthlyContribution, g.expectedCAGR, monthsLeft)
    const gap = g.targetAmount - projectedCorpus
    const progressPct = Math.min(100, (projectedCorpus / g.targetAmount) * 100)
    const onTrack = projectedCorpus >= g.targetAmount
    const requiredSIP = pmtRequired(Math.max(0, g.targetAmount - fvLumpsum(g.currentSaved, g.expectedCAGR, yearsLeft)), g.expectedCAGR, monthsLeft)
    const projectionData = Array.from({ length: Math.min(Math.ceil(yearsLeft) + 1, 31) }, (_, yr) => ({
      year: `Y${yr}`, corpus: Math.round(fvLumpsum(g.currentSaved, g.expectedCAGR, yr) + fvSIP(g.monthlyContribution, g.expectedCAGR, yr * 12)),
      target: g.targetAmount
    }))
    return { ...g, monthsLeft, yearsLeft, projectedCorpus, gap, progressPct, onTrack, requiredSIP, projectionData }
  })

  const totalTargetAmount = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalCurrentSaved = goals.reduce((s, g) => s + g.currentSaved, 0)
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-3xl shadow-inner border border-black/5 dark:border-white/10">
                <TrendingUp className="text-zinc-900 dark:text-white" size={24} />
              </div>
              Goals Tracker
            </h1>
            <p className="text-zinc-500 dark:text-white/50 mt-3 text-lg font-medium">Map your financial future with precision.</p>
          </div>
          <button 
            onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-3xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm transition-all hover:bg-zinc-800 dark:hover:bg-white/90 active:scale-95 shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            <Plus size={20} strokeWidth={3} /> Add New Goal
          </button>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Active Goals', value: `${goals.length}` },
            { label: 'Total Target', value: fmtRupee(totalTargetAmount) },
            { label: 'Saved Assets', value: fmtRupee(totalCurrentSaved) },
            { label: 'Health Status', value: goals.length > 0 ? `${Math.round((goalsOnTrack/goals.length)*100)}% on track` : '0 goals' },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-8 group hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all duration-500")}>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 dark:text-white/40 mb-3">{c.label}</p>
              <p className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-white">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Goals Container */}
        <div className="space-y-8">
          {enriched.length === 0 ? (
            <div className={cn(glass, "py-48 flex flex-col items-center justify-center text-center border-dashed border-black/10 dark:border-white/20 px-8")}>
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">Your vision is empty</h3>
              <p className="text-zinc-500 dark:text-white/40 text-sm md:text-base max-w-lg leading-relaxed font-medium">Add a milestone like retirement, a home, or travel to start projecting your growth and building your financial future.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {enriched.map(g => (
                <motion.div key={g.id} layout className={cn(glass, "overflow-hidden group")}>
                  <div 
                    className="px-8 py-8 flex flex-col md:flex-row items-center gap-8 cursor-pointer"
                    onClick={() => setExpandedGoal(expandedGoal === g.id ? null : g.id)}
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-black/5 dark:bg-white/5 flex items-center justify-center text-4xl shadow-inner border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">{g.emoji}</div>
                    
                    <div className="flex-1 w-full space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{g.name}</h3>
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-3xl",
                            g.onTrack ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-zinc-500 dark:text-white/60"
                          )}>
                            {g.onTrack ? 'Safe' : 'Action Required'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={e => { e.stopPropagation(); startEdit(g) }} className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"><Edit2 size={16} /></button>
                          <button onClick={e => { e.stopPropagation(); deleteGoal(g.id) }} className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-red-500/10 dark:hover:bg-red-500/10 text-zinc-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      {/* Frosted Progress */}
                      <div className="relative h-4 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${g.progressPct}%` }}
                          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                          className="h-full bg-zinc-900/40 dark:bg-white/60 backdrop-blur-3xl rounded-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-8">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-1">Target</span>
                            <span className="font-bold text-zinc-600 dark:text-white/80">{fmtRupee(g.targetAmount)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-1">Projected</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{fmtRupee(g.projectedCorpus)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest mb-1">Time Horizon</span>
                            <span className="font-bold text-zinc-500 dark:text-white/60">{Math.floor(g.yearsLeft)}y {Math.round((g.yearsLeft % 1) * 12)}m</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-black/10 dark:text-white/20">{g.progressPct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedGoal === g.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-8 pb-10 pt-4 border-t border-black/5 dark:border-white/5 grid lg:grid-cols-[1fr_320px] gap-12">
                          
                          <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={g.projectionData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id={`grad-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="year" tick={{ fill: 'currentColor', opacity: 0.3, fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ background: 'var(--tooltip-bg, rgba(25,25,25,0.9))', border: '1px solid rgba(128,128,128,0.2)', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', color: 'inherit' }}
                                  formatter={(v: number) => fmtRupee(v)}
                                />
                                <Area type="monotone" dataKey="corpus" stroke="currentColor" fill={`url(#grad-${g.id})`} strokeWidth={3} strokeOpacity={0.8} className="text-zinc-900 dark:text-white" />
                                <Area type="monotone" dataKey="target" stroke="currentColor" fill="none" strokeDasharray="10 10" strokeWidth={1} strokeOpacity={0.2} className="text-zinc-900 dark:text-white" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="space-y-6">
                            <div className={cn(surface, "p-8 space-y-4")}>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Efficiency</span>
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{g.expectedCAGR}% pa</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest">Current Monthly</span>
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{fmtRupee(g.monthlyContribution)}</span>
                              </div>
                              
                              <div className="pt-6 border-t border-black/5 dark:border-white/5">
                                {g.onTrack ? (
                                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={20} />
                                    <span className="text-xs font-bold tracking-tight uppercase">Perfectly on track</span>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <p className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em]">Required Monthly</p>
                                    <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{fmtRupee(g.requiredSIP)}</p>
                                    <p className="text-xs text-zinc-500 dark:text-white/50 leading-relaxed">Increase by {fmtRupee(Math.max(0, g.requiredSIP - g.monthlyContribution))} to meet your goal.</p>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelForm} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md" />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-xl rounded-[3rem] bg-white dark:bg-white/[0.08] border border-black/10 dark:border-white/20 backdrop-blur-[100px] shadow-2xl p-12 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{editId ? 'Refine Vision' : 'New Goal'}</h3>
                  <button onClick={cancelForm} className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all hover:bg-black/10 dark:hover:bg-white/10"><X size={20} /></button>
                </div>

                <div className="space-y-8">
                  <div className="flex flex-wrap gap-3">
                    {GOAL_EMOJIS.map(e => (
                      <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                        className={cn(
                          "w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all",
                          form.emoji === e ? "bg-zinc-900 dark:bg-white text-white dark:text-black scale-110 shadow-lg" : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Goal Name</label>
                      <input 
                        value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Dream Villa" 
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5 text-zinc-900 dark:text-white text-lg placeholder-zinc-400 dark:placeholder-white/20 focus:outline-none focus:bg-black/[0.08] dark:focus:bg-white/10 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Target Amount</label>
                        <input 
                          type="number" value={form.targetAmount || ''} onChange={e => setForm(f => ({ ...f, targetAmount: +e.target.value }))}
                          placeholder="₹ 0" className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-black/[0.08] dark:focus:bg-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Target Date</label>
                        <input 
                          type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-black/[0.08] dark:focus:bg-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Existing Savings</label>
                        <input 
                          type="number" value={form.currentSaved || ''} onChange={e => setForm(f => ({ ...f, currentSaved: +e.target.value }))}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-black/[0.08] dark:focus:bg-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Current SIP</label>
                        <input 
                          type="number" value={form.monthlyContribution || ''} onChange={e => setForm(f => ({ ...f, monthlyContribution: +e.target.value }))}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-black/[0.08] dark:focus:bg-white/10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2">Expected CAGR (%)</label>
                      <input 
                        type="number" value={form.expectedCAGR || ''} onChange={e => setForm(f => ({ ...f, expectedCAGR: +e.target.value }))}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 text-zinc-900 dark:text-white font-bold focus:outline-none focus:bg-black/[0.08] dark:focus:bg-white/10"
                      />
                    </div>
                  </div>

                  {formError && <p className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{formError}</p>}

                  <div className="flex gap-4 pt-6">
                    <button onClick={cancelForm} className="flex-1 py-5 rounded-2xl text-zinc-400 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white font-bold transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-5 rounded-[2rem] bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-sm shadow-xl dark:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all">
                      {editId ? 'Apply Changes' : 'Ignite Goal'}
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
