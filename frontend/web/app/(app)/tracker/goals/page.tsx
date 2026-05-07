'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useTrackerStore, type Goal, fvSIP, fvLumpsum, pmtRequired, monthsBetween, fmtRupee } from '@/lib/stores/tracker-store'

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '💍', '🎓', '👶', '🏖️', '💼', '🏋️', '📱', '🌍', '💰', '🏥', '🎯']

const glass = 'rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl'

const emptyForm = (): Omit<Goal, 'id'> => ({
  name: '', emoji: '🎯',
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

  // ── Enrich each goal ─────────────────────────────────────────────────────
  const enriched = goals.map(g => {
    const monthsLeft = Math.max(0, monthsBetween(today, g.targetDate))
    const yearsLeft = monthsLeft / 12

    // Projected corpus = FV of lumpsum (current saved) + FV of SIP (monthly contributions)
    const projectedCorpus = fvLumpsum(g.currentSaved, g.expectedCAGR, yearsLeft)
      + fvSIP(g.monthlyContribution, g.expectedCAGR, monthsLeft)

    const gap = g.targetAmount - projectedCorpus
    const progressPct = Math.min(100, (projectedCorpus / g.targetAmount) * 100)
    const onTrack = projectedCorpus >= g.targetAmount

    // Required monthly SIP if user had nothing and needed to start fresh
    const requiredSIP = pmtRequired(
      Math.max(0, g.targetAmount - fvLumpsum(g.currentSaved, g.expectedCAGR, yearsLeft)),
      g.expectedCAGR,
      monthsLeft
    )

    // Projection chart: year-by-year corpus
    const projectionData = Array.from({ length: Math.min(Math.ceil(yearsLeft) + 1, 31) }, (_, yr) => {
      const months = yr * 12
      const corpus = fvLumpsum(g.currentSaved, g.expectedCAGR, yr)
        + fvSIP(g.monthlyContribution, g.expectedCAGR, months)
      return { year: `Y${yr}`, corpus: Math.round(corpus), target: g.targetAmount }
    })

    return { ...g, monthsLeft, yearsLeft, projectedCorpus, gap, progressPct, onTrack, requiredSIP, projectionData }
  })

  const totalTargetAmount = goals.reduce((s, g) => s + g.targetAmount, 0)
  const totalCurrentSaved = goals.reduce((s, g) => s + g.currentSaved, 0)
  const goalsOnTrack = enriched.filter(g => g.onTrack).length

  // ── Form ─────────────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.name.trim()) return 'Goal name is required'
    if (form.targetAmount <= 0) return 'Target amount must be > 0'
    if (new Date(form.targetDate) <= new Date()) return 'Target date must be in the future'
    if (form.expectedCAGR <= 0 || form.expectedCAGR > 30) return 'CAGR must be between 1-30%'
    return ''
  }

  const handleSubmit = () => {
    const err = validate()
    if (err) { setFormError(err); return }
    if (editId) { updateGoal(editId, form); setEditId(null) }
    else addGoal(form)
    setForm(emptyForm()); setShowForm(false); setFormError('')
  }

  const startEdit = (g: Goal) => {
    setForm({ name: g.name, emoji: g.emoji, targetAmount: g.targetAmount, targetDate: g.targetDate, currentSaved: g.currentSaved, monthlyContribution: g.monthlyContribution, expectedCAGR: g.expectedCAGR })
    setEditId(g.id); setShowForm(true)
  }

  const cancelForm = () => { setForm(emptyForm()); setShowForm(false); setEditId(null); setFormError('') }

  return (
    <div className="min-h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-white/20 dark:bg-white/[0.01] backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10"><Target className="text-amber-400" size={26} /></div>
              Goals Tracker
            </h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm">Define financial goals. See if you're on track with real projections.</p>
          </div>
          <button onClick={() => { setEditId(null); setForm(emptyForm()); setShowForm(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95">
            <Plus size={18} /> Add Goal
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Goals', value: `${goals.length}`, color: 'text-[var(--text-primary)]' },
            { label: 'Total Target', value: fmtRupee(totalTargetAmount), color: 'text-amber-400' },
            { label: 'Currently Saved', value: fmtRupee(totalCurrentSaved), color: 'text-emerald-400' },
            { label: 'On Track', value: `${goalsOnTrack} / ${goals.length}`, color: goalsOnTrack === goals.length && goals.length > 0 ? 'text-emerald-400' : 'text-amber-400' },
          ].map((c, i) => (
            <div key={i} className={`${glass} p-5`}>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1 opacity-70">{c.label}</p>
              <p className={`text-2xl font-black tracking-tight ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Goal Cards */}
        {enriched.length === 0 ? (
          <div className={`${glass} flex flex-col items-center justify-center py-20 text-center`}>
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-5 text-4xl">🎯</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No goals yet</h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm">Add your financial goals — house down payment, car, vacation, retirement — and we'll tell you exactly what SIP you need.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {enriched.map(g => (
              <motion.div key={g.id} layout className={`${glass} overflow-hidden`}>

                {/* Goal Header */}
                <div className="px-6 py-5 flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedGoal(expandedGoal === g.id ? null : g.id)}>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 dark:bg-white/10 flex items-center justify-center text-3xl shrink-0 shadow-inner">{g.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{g.name}</h3>
                      {g.onTrack ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                          <CheckCircle2 size={11} /> On Track
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                          <AlertTriangle size={11} /> Needs Attention
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${g.progressPct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full rounded-full ${g.onTrack ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)] shrink-0">{g.progressPct.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-6 mt-2 flex-wrap">
                      <span className="text-xs text-[var(--text-tertiary)]">Target: <strong className="text-[var(--text-primary)]">{fmtRupee(g.targetAmount)}</strong></span>
                      <span className="text-xs text-[var(--text-tertiary)]">Projected: <strong className={g.onTrack ? 'text-emerald-400' : 'text-amber-400'}>{fmtRupee(g.projectedCorpus)}</strong></span>
                      <span className="text-xs text-[var(--text-tertiary)]">{Math.floor(g.yearsLeft)}y {Math.round((g.yearsLeft % 1) * 12)}m left</span>
                      <span className="text-xs text-[var(--text-tertiary)]">by {new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={e => { e.stopPropagation(); startEdit(g) }} className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={15} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteGoal(g.id) }} className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expandedGoal === g.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10">
                      <div className="px-6 py-6 grid lg:grid-cols-[1fr_280px] gap-6">

                        {/* Projection Chart */}
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-amber-400" /> Corpus Projection</h4>
                          <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={g.projectionData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`grad-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis tickFormatter={v => fmtRupee(v)} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                              <Tooltip formatter={(v: number) => fmtRupee(v)} contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                              <Area type="monotone" dataKey="corpus" name="Projected" stroke="#f59e0b" fill={`url(#grad-${g.id})`} strokeWidth={2.5} />
                              <Area type="monotone" dataKey="target" name="Target" stroke="#6366f1" fill="none" strokeDasharray="6 4" strokeWidth={1.5} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Stats Panel */}
                        <div className="space-y-3">
                          {[
                            { label: 'Currently Saved', value: fmtRupee(g.currentSaved) },
                            { label: 'Monthly Contribution', value: fmtRupee(g.monthlyContribution) },
                            { label: 'Expected CAGR', value: `${g.expectedCAGR}%` },
                            { label: 'Months Left', value: `${g.monthsLeft}` },
                          ].map((s, i) => (
                            <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5">
                              <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
                              <span className="text-sm font-bold text-[var(--text-primary)]">{s.value}</span>
                            </div>
                          ))}

                          {/* Required SIP */}
                          <div className={`mt-4 p-4 rounded-2xl ${g.onTrack ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            {g.onTrack ? (
                              <>
                                <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest mb-1">✓ You're on track!</p>
                                <p className="text-xs text-emerald-300 leading-relaxed">Your current SIP of <strong>{fmtRupee(g.monthlyContribution)}/mo</strong> is sufficient to reach this goal.</p>
                              </>
                            ) : (
                              <>
                                <p className="text-[10px] uppercase font-bold text-red-400 tracking-widest mb-1">Required Monthly SIP</p>
                                <p className="text-2xl font-black text-red-400">{fmtRupee(g.requiredSIP)}<span className="text-sm font-semibold">/mo</span></p>
                                <p className="text-xs text-red-300 mt-1">You're contributing <strong>{fmtRupee(g.monthlyContribution)}/mo</strong>. Increase by <strong>{fmtRupee(Math.max(0, g.requiredSIP - g.monthlyContribution))}</strong> to stay on track.</p>
                              </>
                            )}
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

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-lg rounded-[2rem] bg-zinc-900/95 border border-white/10 shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editId ? 'Edit Goal' : 'Add Goal'}</h3>
                  <button onClick={cancelForm} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  {/* Emoji picker */}
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">Pick an emoji</label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_EMOJIS.map(e => (
                        <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.emoji === e ? 'bg-amber-500/30 border border-amber-500/50 scale-110' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Goal Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. House Down Payment, Retirement Fund" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Target Amount (₹) *</label>
                      <input type="number" min="0" value={form.targetAmount || ''} onChange={e => setForm(f => ({ ...f, targetAmount: +e.target.value }))}
                        placeholder="e.g. 5000000" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Target Date *</label>
                      <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Currently Saved (₹)</label>
                      <input type="number" min="0" value={form.currentSaved || ''} onChange={e => setForm(f => ({ ...f, currentSaved: +e.target.value }))}
                        placeholder="Amount saved so far" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Monthly Contribution (₹)</label>
                      <input type="number" min="0" value={form.monthlyContribution || ''} onChange={e => setForm(f => ({ ...f, monthlyContribution: +e.target.value }))}
                        placeholder="Current monthly SIP" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Expected CAGR (%) *</label>
                      <input type="number" min="1" max="30" value={form.expectedCAGR || ''} onChange={e => setForm(f => ({ ...f, expectedCAGR: +e.target.value }))}
                        placeholder="e.g. 10 for balanced fund" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400 transition-colors" />
                      <p className="text-[10px] text-white/40 mt-1">FD ~6.5%, Debt MF ~7%, Balanced ~10%, Equity ~12%</p>
                    </div>
                  </div>
                  {formError && <p className="text-red-400 text-sm font-medium">{formError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={cancelForm} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Cancel</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30">
                      <Check size={16} /> {editId ? 'Save Changes' : 'Add Goal'}
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
