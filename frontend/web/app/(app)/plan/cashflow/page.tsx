'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Plus, Trash2, Edit2, X, Check, ArrowDownCircle, ArrowUpCircle, Activity, Download } from 'lucide-react'
import { Button } from '@money-os/ui'
import {
  useTrackerStore,
  type IncomeEntry, type ExpenseEntry, type IncomeType, type ExpenseCategory,
  fmtRupee
} from '@/lib/stores/tracker-store'

const INCOME_TYPES: IncomeType[] = ['Salary', 'Freelance', 'Rental', 'Business', 'Other']
const EXPENSE_CATS: ExpenseCategory[] = [
  'Housing/Rent', 'EMI', 'Groceries', 'Dining Out', 'Transport',
  'Health/Medical', 'Insurance', 'Subscriptions', 'Entertainment',
  'Clothing', 'Education', 'Utilities', 'Investments/SIP', 'Other'
]

const EXPENSE_COLORS = [
  '#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#10b981',
  '#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#64748b'
]

const glass = 'rounded-[2rem] bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl'

export default function CashflowPage() {
  const { incomes, expenses, addIncome, updateIncome, deleteIncome, addExpense, updateExpense, deleteExpense } = useTrackerStore()

  const [incomeForm, setIncomeForm] = useState<Omit<IncomeEntry, 'id'>>({ label: '', type: 'Salary', monthlyAmount: 0 })
  const [expenseForm, setExpenseForm] = useState<Omit<ExpenseEntry, 'id'>>({ label: '', category: 'Housing/Rent', monthlyAmount: 0 })
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

  // 50-30-20 rule analysis
  const needs = expenses.filter(e => ['Housing/Rent','EMI','Groceries','Health/Medical','Insurance','Utilities','Transport'].includes(e.category)).reduce((s, e) => s + e.monthlyAmount, 0)
  const wants = expenses.filter(e => ['Dining Out','Entertainment','Subscriptions','Clothing'].includes(e.category)).reduce((s, e) => s + e.monthlyAmount, 0)
  const investments = expenses.filter(e => e.category === 'Investments/SIP').reduce((s, e) => s + e.monthlyAmount, 0)
  const others = totalExpenses - needs - wants - investments

  const needsPct = totalIncome > 0 ? (needs / totalIncome) * 100 : 0
  const wantsPct = totalIncome > 0 ? (wants / totalIncome) * 100 : 0
  const investPct = totalIncome > 0 ? ((investments + surplus) / totalIncome) * 100 : 0

  // Bar chart data: income vs expense by category
  const barData = [
    { label: 'Income', value: totalIncome, fill: '#10b981' },
    { label: 'Needs', value: needs, fill: '#6366f1' },
    { label: 'Wants', value: wants, fill: '#f59e0b' },
    { label: 'Invest', value: investments, fill: '#8b5cf6' },
    { label: 'Other', value: others, fill: '#64748b' },
  ]

  // Expense donut by category
  const expenseByCategory = EXPENSE_CATS.map((cat, i) => ({
    name: cat,
    value: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.monthlyAmount, 0),
    fill: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  })).filter(x => x.value > 0)

  // ── Income form ───────────────────────────────────────────────────────────
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
    setExpenseForm({ label: '', category: 'Housing/Rent', monthlyAmount: 0 })
    setShowExpenseForm(false); setExpenseError('')
  }

  const startEditIncome = (i: IncomeEntry) => {
    setIncomeForm({ label: i.label, type: i.type, monthlyAmount: i.monthlyAmount })
    setEditIncomeId(i.id); setShowIncomeForm(true)
  }

  const startEditExpense = (e: ExpenseEntry) => {
    setExpenseForm({ label: e.label, category: e.category, monthlyAmount: e.monthlyAmount })
    setEditExpenseId(e.id); setShowExpenseForm(true)
  }

  const ruleColor = (actual: number, target: number) => actual <= target ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="min-h-[calc(100vh-2rem)] m-4 rounded-[2.5rem] bg-white/20 dark:bg-white/[0.01] backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
      <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10"><Activity className="text-emerald-400" size={26} /></div>
              Cash Flow Planner
            </h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm">Track monthly income and expenses. Know your real savings rate.</p>
          </div>
          <div className="no-print">
            <Button onClick={() => window.print()} className="gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
              <Download size={16} /> Print Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Income', value: fmtRupee(totalIncome), color: 'text-emerald-400' },
            { label: 'Total Expenses', value: fmtRupee(totalExpenses), color: 'text-red-400' },
            { label: 'Surplus / Deficit', value: `${surplus >= 0 ? '+' : ''}${fmtRupee(surplus)}`, color: surplus >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 10 ? 'text-amber-400' : 'text-red-400' },
          ].map((c, i) => (
            <div key={i} className={`${glass} p-5`}>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] mb-1 opacity-70">{c.label}</p>
              <p className={`text-2xl font-black tracking-tight ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* 50-30-20 Rule */}
        <div className={`${glass} p-6`}>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">50/30/20 Rule Analysis</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-6">50% Needs • 30% Wants • 20% Savings/Investments — based on your income of {fmtRupee(totalIncome)}/mo</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Needs', actual: needsPct, target: 50, value: needs, desc: 'Rent, EMIs, Groceries, Utilities' },
              { label: 'Wants', actual: wantsPct, target: 30, value: wants, desc: 'Dining, Entertainment, Shopping' },
              { label: 'Savings', actual: investPct, target: 20, value: investments + surplus, desc: 'SIPs, Surplus after expenses' },
            ].map((r, i) => (
              <div key={i} className="rounded-2xl bg-white/30 dark:bg-white/5 border border-white/10 p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{r.label}</span>
                  <span className={`text-sm font-black ${ruleColor(r.actual, r.target)}`}>{r.actual.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 mb-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${r.actual <= r.target ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${Math.min(r.actual, 100)}%` }} />
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">{fmtRupee(r.value)} / target ≤{r.target}%</p>
                <p className="text-[10px] text-[var(--text-tertiary)] opacity-60">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className={`${glass} p-6`}>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Income vs Expense Breakdown</h2>
            {totalIncome === 0 && totalExpenses === 0 ? (
              <div className="flex items-center justify-center h-40 text-[var(--text-tertiary)] text-sm">Add income and expenses to see chart</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmtRupee(v)} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip formatter={(v: number) => fmtRupee(v)} contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className={`${glass} p-6`}>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Expense by Category</h2>
            {expenseByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[var(--text-tertiary)] text-sm">Add expenses to see breakdown</div>
            ) : (
              <div className="flex gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                      {expenseByCategory.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtRupee(v)} contentStyle={{ background: 'rgba(15,15,25,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 overflow-y-auto max-h-40 space-y-1.5 pr-1">
                  {expenseByCategory.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                        <span className="text-[var(--text-secondary)] truncate max-w-[90px]">{d.name}</span>
                      </div>
                      <span className="font-bold text-[var(--text-primary)] shrink-0">{totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(0) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Income & Expense Tables */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Income */}
          <div className={`${glass} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2"><ArrowUpCircle size={18} className="text-emerald-400" /> Income Sources</h2>
              <button onClick={() => { setEditIncomeId(null); setIncomeForm({ label: '', type: 'Salary', monthlyAmount: 0 }); setShowIncomeForm(true) }}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"><Plus size={16} /></button>
            </div>
            {incomes.length === 0 ? (
              <p className="text-center text-[var(--text-tertiary)] text-sm py-8">No income added yet</p>
            ) : (
              <div className="divide-y divide-white/5">
                {incomes.map(i => (
                  <div key={i.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{i.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{i.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-400">{fmtRupee(i.monthlyAmount)}/mo</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditIncome(i)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => deleteIncome(i.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className={`${glass} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2"><ArrowDownCircle size={18} className="text-red-400" /> Expenses</h2>
              <button onClick={() => { setEditExpenseId(null); setExpenseForm({ label: '', category: 'Housing/Rent', monthlyAmount: 0 }); setShowExpenseForm(true) }}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"><Plus size={16} /></button>
            </div>
            {expenses.length === 0 ? (
              <p className="text-center text-[var(--text-tertiary)] text-sm py-8">No expenses added yet</p>
            ) : (
              <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors group">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{e.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{e.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-red-400">{fmtRupee(e.monthlyAmount)}/mo</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditExpense(e)} className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Income Form Modal */}
        <AnimatePresence>
          {showIncomeForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm rounded-[2rem] bg-zinc-900/95 border border-white/10 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editIncomeId ? 'Edit Income' : 'Add Income'}</h3>
                  <button onClick={() => { setShowIncomeForm(false); setEditIncomeId(null) }} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Label *</label>
                    <input value={incomeForm.label} onChange={e => setIncomeForm(f => ({ ...f, label: e.target.value }))}
                      placeholder="e.g. TCS Salary, Freelance Project" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Type *</label>
                    <select value={incomeForm.type} onChange={e => setIncomeForm(f => ({ ...f, type: e.target.value as IncomeType }))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-400 transition-colors">
                      {INCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Monthly Amount (₹) *</label>
                    <input type="number" min="0" value={incomeForm.monthlyAmount || ''} onChange={e => setIncomeForm(f => ({ ...f, monthlyAmount: +e.target.value }))}
                      placeholder="e.g. 80000" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  {incomeError && <p className="text-red-400 text-sm">{incomeError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setShowIncomeForm(false); setEditIncomeId(null); setIncomeError('') }} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Cancel</button>
                    <button onClick={submitIncome} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                      <Check size={16} /> {editIncomeId ? 'Save' : 'Add'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expense Form Modal */}
        <AnimatePresence>
          {showExpenseForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm rounded-[2rem] bg-zinc-900/95 border border-white/10 shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{editExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
                  <button onClick={() => { setShowExpenseForm(false); setEditExpenseId(null) }} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Label *</label>
                    <input value={expenseForm.label} onChange={e => setExpenseForm(f => ({ ...f, label: e.target.value }))}
                      placeholder="e.g. House Rent, Netflix, EMI" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-400 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Category *</label>
                    <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-red-400 transition-colors">
                      {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5 block">Monthly Amount (₹) *</label>
                    <input type="number" min="0" value={expenseForm.monthlyAmount || ''} onChange={e => setExpenseForm(f => ({ ...f, monthlyAmount: +e.target.value }))}
                      placeholder="e.g. 15000" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-400 transition-colors" />
                  </div>
                  {expenseError && <p className="text-red-400 text-sm">{expenseError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setShowExpenseForm(false); setEditExpenseId(null); setExpenseError('') }} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all">Cancel</button>
                    <button onClick={submitExpense} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                      <Check size={16} /> {editExpenseId ? 'Save' : 'Add'}
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
