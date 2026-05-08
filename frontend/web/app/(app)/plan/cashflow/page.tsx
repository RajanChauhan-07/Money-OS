'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, ArrowDownCircle, ArrowUpCircle, Activity, Download, AlertCircle, ShoppingBag, ShieldCheck, Wallet } from 'lucide-react'
import { Button } from '@money-os/ui'
import {
  useTrackerStore,
  type IncomeEntry, type ExpenseEntry, type IncomeType, type ExpenseCategory,
  fmtRupee
} from '@/lib/stores/tracker-store'
import { cn } from '@/lib/utils'

const INCOME_TYPES: IncomeType[] = ['Salary', 'Freelance', 'Rental', 'Business', 'Other']
const EXPENSE_CATS: ExpenseCategory[] = [
  'Housing/Rent', 'EMI', 'Groceries', 'Dining Out', 'Transport',
  'Health/Medical', 'Insurance', 'Subscriptions', 'Entertainment',
  'Clothing', 'Education', 'Utilities', 'Investments/SIP', 'Other'
]

// Premium Palette
const COLORS = {
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  slate: '#94a3b8'
}

const EXPENSE_COLORS = [
  '#f43f5e', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#64748b'
]

const glass = 'rounded-[2rem] bg-white/70 dark:bg-black/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl transition-all duration-300'

// Helper to suggest classification based on category
const suggestClassification = (cat: ExpenseCategory): 'Need' | 'Want' | 'Investment' => {
  if (cat === 'Investments/SIP') return 'Investment'
  if (['Housing/Rent','EMI','Groceries','Health/Medical','Insurance','Utilities','Transport','Education'].includes(cat)) return 'Need'
  return 'Want'
}

export default function CashflowPage() {
  const { incomes, expenses, addIncome, updateIncome, deleteIncome, addExpense, updateExpense, deleteExpense } = useTrackerStore()

  const [incomeForm, setIncomeForm] = useState<Omit<IncomeEntry, 'id'>>({ label: '', type: 'Salary', monthlyAmount: 0 })
  const [expenseForm, setExpenseForm] = useState<Omit<ExpenseEntry, 'id'>>({ label: '', category: 'Housing/Rent', monthlyAmount: 0, classification: 'Need' })
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editIncomeId, setEditIncomeId] = useState<string | null>(null)
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null)
  const [incomeError, setIncomeError] = useState('')
  const [expenseError, setExpenseError] = useState('')

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalIncome = incomes.reduce((s, i) => s + i.monthlyAmount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.monthlyAmount, 0)
  const surplus = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0

  // Helper to get effective classification (field or suggested fallback)
  const getClassification = (e: ExpenseEntry) => e.classification || suggestClassification(e.category)

  // 50-30-20 rule analysis (Using Robust Classification logic)
  const needs = expenses.filter(e => getClassification(e) === 'Need').reduce((s, e) => s + e.monthlyAmount, 0)
  const wants = expenses.filter(e => getClassification(e) === 'Want').reduce((s, e) => s + e.monthlyAmount, 0)
  const investments = expenses.filter(e => getClassification(e) === 'Investment').reduce((s, e) => s + e.monthlyAmount, 0)
  const others = totalExpenses - (needs + wants + investments)

  const needsPct = totalIncome > 0 ? (needs / totalIncome) * 100 : 0
  const wantsPct = totalIncome > 0 ? (wants / totalIncome) * 100 : 0
  const investPct = totalIncome > 0 ? ((investments + surplus) / totalIncome) * 100 : 0

  // Bar chart data
  const barData = [
    { label: 'Income', value: totalIncome, fill: COLORS.emerald },
    { label: 'Needs', value: needs, fill: COLORS.indigo },
    { label: 'Wants', value: wants, fill: COLORS.amber },
    { label: 'Invest', value: investments, fill: COLORS.violet },
    { label: 'Other', value: others, fill: COLORS.slate },
  ]

  // Expense donut
  const expenseByCategory = EXPENSE_CATS.map((cat, i) => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.monthlyAmount, 0),
    fill: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  })).filter(x => x.value > 0)

  const submitIncome = () => {
    if (!incomeForm.label.trim()) { setIncomeError('Label is required'); return }
    if (incomeForm.monthlyAmount <= 0) { setIncomeError('Amount must be > 0'); return }
    if (editIncomeId) { updateIncome(editIncomeId, incomeForm); setEditIncomeId(null) }
    else addIncome(incomeForm)
    setIncomeForm({ label: '', type: 'Salary', monthlyAmount: 0 })
    setShowIncomeForm(false); setIncomeError('')
  }

  const submitExpense = () => {
    if (!expenseForm.label.trim()) { setExpenseError('Label is required'); return }
    if (expenseForm.monthlyAmount <= 0) { setExpenseError('Amount must be > 0'); return }
    if (editExpenseId) { updateExpense(editExpenseId, expenseForm); setEditExpenseId(null) }
    else addExpense(expenseForm)
    setExpenseForm({ label: '', category: 'Housing/Rent', monthlyAmount: 0, classification: 'Need' })
    setShowExpenseForm(false); setExpenseError('')
  }

  const startEditIncome = (i: IncomeEntry) => {
    setIncomeForm({ label: i.label, type: i.type, monthlyAmount: i.monthlyAmount })
    setEditIncomeId(i.id); setShowIncomeForm(true)
  }

  const startEditExpense = (e: ExpenseEntry) => {
    setExpenseForm({ label: e.label, category: e.category, monthlyAmount: e.monthlyAmount, classification: getClassification(e) })
    setEditExpenseId(e.id); setShowExpenseForm(true)
  }

  return (
    <div className="min-h-screen pb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10"><Activity className="text-emerald-500" size={32} /></div>
              Cash Flow Planner
            </h1>
            <p className="text-zinc-500 dark:text-white/40 mt-2 text-base font-medium">Real-time lifestyle optimization and savings tracking.</p>
          </div>
          <div className="flex items-center gap-4 no-print">
            <Button onClick={() => window.print()} className="gap-2 rounded-[1.25rem] bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-transform px-6 h-12 font-black uppercase tracking-widest text-[10px]">
              <Download size={16} /> Export Statement
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Monthly Income', value: fmtRupee(totalIncome), color: 'text-emerald-500' },
            { label: 'Total Expenses', value: fmtRupee(totalExpenses), color: 'text-rose-500' },
            { label: 'Net Surplus', value: `${surplus >= 0 ? '+' : ''}${fmtRupee(surplus)}`, color: surplus >= 0 ? 'text-emerald-500' : 'text-rose-500', glow: surplus >= 0 ? 'shadow-emerald-500/10' : 'shadow-rose-500/10' },
            { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-amber-500' : 'text-rose-500' },
          ].map((c, i) => (
            <div key={i} className={cn(glass, "p-7 border-l-4", c.color.replace('text-', 'border-'), c.glow)}>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400 dark:text-white/30 mb-2">{c.label}</p>
              <p className={cn("text-3xl font-black tracking-tighter tabular-nums", c.color)}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* 50-30-20 Rule */}
        <div className={cn(glass, "p-8")}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Financial Health: 50/30/20 Analysis</h2>
              <p className="text-sm font-medium text-zinc-500 dark:text-white/40 mt-1">Optimization based on your manual "Need vs Want" classifications</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Needs', actual: needsPct, target: 50, value: needs, desc: 'Essential lifestyle commitments', color: 'emerald', inverse: false },
              { label: 'Wants', actual: wantsPct, target: 30, value: wants, desc: 'Quality of life & discretionary', color: 'amber', inverse: false },
              { label: 'Savings', actual: investPct, target: 20, value: investments + surplus, desc: 'SIPs, Surplus, Life Capital', color: 'violet', inverse: true },
            ].map((r, i) => {
              const isGood = r.inverse ? r.actual >= r.target : r.actual <= r.target
              return (
                <div key={i} className="rounded-[1.75rem] bg-white/50 dark:bg-white/[0.03] border border-white/10 p-6 group hover:border-emerald-500/30 transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">{r.label}</span>
                    <div className="flex flex-col items-end">
                      <span className={cn("text-lg font-black tabular-nums", isGood ? 'text-emerald-500' : 'text-rose-500')}>{r.actual.toFixed(1)}%</span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-white/20 tracking-tighter">Target: {r.inverse ? '≥' : '≤'}{r.target}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-900/5 dark:bg-white/5 mb-4 overflow-hidden p-[2px] border border-black/5 dark:border-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(r.actual, 100)}%` }}
                      className={cn(
                        "h-full rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)]",
                        isGood ? 'bg-emerald-500' : 'bg-rose-500'
                      )} 
                    />
                  </div>
                  <p className="text-sm font-black text-zinc-900 dark:text-white mb-1 tracking-tight">{fmtRupee(r.value)}</p>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-white/60 leading-relaxed">{r.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className={cn(glass, "p-8")}>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-8">Income vs Expense Variance</h2>
            {totalIncome === 0 && totalExpenses === 0 ? (
              <div className="flex flex-col items-center justify-center h-[260px] text-zinc-400 dark:text-white/20 gap-4">
                <Activity size={48} className="opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest">No transaction data detected</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis hide domain={[0, 'dataMax + 10000']} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    content={({ active, payload }) => {
                      if (active && payload?.length) return (
                        <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl shadow-2xl">
                          <p className="text-[10px] font-black uppercase text-white/40 mb-1">{payload[0].payload.label}</p>
                          <p className="text-sm font-black text-white">{fmtRupee(payload[0].value as number)}</p>
                        </div>
                      )
                      return null
                    }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 4, 4]} barSize={40}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} fillOpacity={0.9} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={cn(glass, "p-8")}>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-8">Spending Architecture</h2>
            {expenseByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[260px] text-zinc-400 dark:text-white/20 gap-4">
                <AlertCircle size={48} className="opacity-20" />
                <p className="text-sm font-black uppercase tracking-widest">Add expenses to reveal distribution</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="relative w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie 
                        data={expenseByCategory} 
                        cx="50%" cy="50%" 
                        innerRadius={65} outerRadius={85} 
                        dataKey="value" paddingAngle={4}
                        stroke="none"
                      >
                        {expenseByCategory.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtRupee(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Outflow</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-white">{fmtRupee(totalExpenses)}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-2 scrollbar-hide">
                  {expenseByCategory.sort((a,b) => b.value - a.value).map((d, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-lg" style={{ background: d.fill }} />
                        <span className="text-xs font-bold text-zinc-600 dark:text-white/60 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black text-zinc-900 dark:text-white tabular-nums">{((d.value / totalExpenses) * 100).toFixed(0)}%</span>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-white/20">{fmtRupee(d.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ledger Tables */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Income */}
          <div className={cn(glass, "overflow-hidden border-t-0")}>
            <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-zinc-900/5 dark:bg-white/[0.02]">
              <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-3 uppercase tracking-widest">
                <ArrowUpCircle size={20} className="text-emerald-500" /> Income Sources
              </h2>
              <button 
                onClick={() => { setEditIncomeId(null); setIncomeForm({ label: '', type: 'Salary', monthlyAmount: 0 }); setShowIncomeForm(true) }}
                className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus size={20} />
              </button>
            </div>
            {incomes.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-white/20">Empty Ledger</p>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-white/20">Add your first income source to start planning</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {incomes.map(i => (
                  <div key={i.id} className="flex items-center justify-between px-8 py-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{i.label}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30">{i.type}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-black text-emerald-500 tabular-nums">{fmtRupee(i.monthlyAmount)}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => startEditIncome(i)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => deleteIncome(i.id)} className="w-8 h-8 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className={cn(glass, "overflow-hidden border-t-0")}>
            <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-zinc-900/5 dark:bg-white/[0.02]">
              <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-3 uppercase tracking-widest">
                <ArrowDownCircle size={20} className="text-rose-500" /> Active Expenses
              </h2>
              <button 
                onClick={() => { setEditExpenseId(null); setExpenseForm({ label: '', category: 'Housing/Rent', monthlyAmount: 0, classification: 'Need' }); setShowExpenseForm(true) }}
                className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
              >
                <Plus size={20} />
              </button>
            </div>
            {expenses.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-white/20">No Expenses Tracked</p>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-white/20">Enter your recurring outflows to see analysis</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[400px] overflow-y-auto scrollbar-hide">
                {expenses.map(e => {
                  const effectiveClass = getClassification(e)
                  return (
                    <div key={e.id} className="flex items-center justify-between px-8 py-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-black text-zinc-900 dark:text-white">{e.label}</p>
                           <span className={cn(
                             "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                             effectiveClass === 'Need' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                             effectiveClass === 'Want' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                             'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                           )}>
                             {effectiveClass}
                           </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/30">{e.category}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-black text-rose-500 tabular-nums">{fmtRupee(e.monthlyAmount)}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => startEditExpense(e)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => deleteExpense(e.id)} className="w-8 h-8 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Form Modals */}
        <AnimatePresence>
          {(showIncomeForm || showExpenseForm) && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md rounded-[2.5rem] bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className={cn(
                  "px-8 py-6 border-b border-white/10 flex items-center justify-between",
                  showIncomeForm ? "bg-emerald-500/5" : "bg-rose-500/5"
                )}>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">
                    {showIncomeForm ? (editIncomeId ? 'Refine Income' : 'Inject Income') : (editExpenseId ? 'Refine Outflow' : 'Track Outflow')}
                  </h3>
                  <button onClick={() => { setShowIncomeForm(false); setShowExpenseForm(false); setEditIncomeId(null); setEditExpenseId(null) }} className="w-10 h-10 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center"><X size={20} /></button>
                </div>
                
                <div className="p-8 space-y-6">
                  {showIncomeForm ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Source Label</label>
                        <input value={incomeForm.label} onChange={e => setIncomeForm(f => ({ ...f, label: e.target.value }))}
                          placeholder="e.g. Primary Salary" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Income Type</label>
                        <select value={incomeForm.type} onChange={e => setIncomeForm(f => ({ ...f, type: e.target.value as IncomeType }))}
                          className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium appearance-none">
                          {INCOME_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Monthly Flow (₹)</label>
                        <input type="number" min="0" value={incomeForm.monthlyAmount || ''} onChange={e => setIncomeForm(f => ({ ...f, monthlyAmount: +e.target.value }))}
                          placeholder="e.g. 120000" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium" />
                      </div>
                      {incomeError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{incomeError}</p>}
                      <Button onClick={submitIncome} className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 gap-2">
                        <Check size={18} /> {editIncomeId ? 'Update Ledger' : 'Confirm Income'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Lifestyle Classification</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'Need', icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
                            { id: 'Want', icon: ShoppingBag, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
                            { id: 'Investment', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setExpenseForm(f => ({ ...f, classification: t.id as any }))}
                              className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1.5",
                                expenseForm.classification === t.id 
                                  ? `${t.bg} ${t.border} ${t.color} scale-105 shadow-xl` 
                                  : "border-white/5 bg-white/5 text-white/20 grayscale"
                              )}
                            >
                              <t.icon size={16} />
                              <span className="text-[8px] font-black uppercase tracking-widest">{t.id}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Expense Label</label>
                        <input value={expenseForm.label} onChange={e => setExpenseForm(f => ({ ...f, label: e.target.value }))}
                          placeholder="e.g. Rent / Housing" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-rose-500 transition-all font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Category</label>
                        <select 
                          value={expenseForm.category} 
                          onChange={e => {
                            const cat = e.target.value as ExpenseCategory
                            setExpenseForm(f => ({ ...f, category: cat, classification: suggestClassification(cat) }))
                          }}
                          className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-rose-500 transition-all font-medium appearance-none"
                        >
                          {EXPENSE_CATS.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Monthly Outflow (₹)</label>
                        <input type="number" min="0" value={expenseForm.monthlyAmount || ''} onChange={e => setExpenseForm(f => ({ ...f, monthlyAmount: +e.target.value }))}
                          placeholder="e.g. 45000" className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-5 text-white text-sm focus:outline-none focus:border-rose-500 transition-all font-medium" />
                      </div>
                      {expenseError && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{expenseError}</p>}
                      <Button onClick={submitExpense} className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-500/20 gap-2">
                        <Check size={18} /> {editExpenseId ? 'Update Record' : 'Record Outflow'}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
