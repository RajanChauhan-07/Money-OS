'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Portfolio Types ──────────────────────────────────────────────────────────
export type AssetType = 'Stock' | 'Mutual Fund' | 'ETF' | 'FD' | 'Bond' | 'Gold' | 'Real Estate' | 'Crypto' | 'Other'

export interface Holding {
  id: string
  name: string
  type: AssetType
  units: number
  buyPrice: number
  currentPrice: number
  buyDate: string // ISO date string
}

// ─── SIP / Invest Types ───────────────────────────────────────────────────────
export type SIPCategory = 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'ELSS' | 'Debt' | 'Hybrid' | 'Index' | 'Gold' | 'Other'

export interface SIPEntry {
  id: string
  fundName: string
  category: SIPCategory
  monthlyAmount: number
  startDate: string // ISO date string
  expectedCAGR: number // percentage e.g. 12
}

// ─── Cashflow Types ───────────────────────────────────────────────────────────
export type IncomeType = 'Salary' | 'Freelance' | 'Rental' | 'Business' | 'Other'
export type ExpenseCategory = 'Housing/Rent' | 'EMI' | 'Groceries' | 'Dining Out' | 'Transport' | 'Health/Medical' | 'Insurance' | 'Subscriptions' | 'Entertainment' | 'Clothing' | 'Education' | 'Utilities' | 'Investments/SIP' | 'Other'

export interface IncomeEntry {
  id: string
  label: string
  type: IncomeType
  monthlyAmount: number
}

export interface ExpenseEntry {
  id: string
  label: string
  category: ExpenseCategory
  monthlyAmount: number
  classification: 'Need' | 'Want' | 'Investment'
}

// ─── Allocation Types ─────────────────────────────────────────────────────────
export type AllocationClass = 'Equity' | 'Debt' | 'Gold' | 'Cash' | 'Real Estate' | 'Crypto'

export interface AllocationEntry {
  id: string
  assetClass: AllocationClass
  currentValue: number   // in ₹
  targetPercent: number  // 0-100
}

// ─── Goals Types ──────────────────────────────────────────────────────────────
export interface Goal {
  id: string
  name: string
  emoji: string
  targetAmount: number
  targetDate: string   // ISO date string
  currentSaved: number
  monthlyContribution: number
  expectedCAGR: number // percentage
}

// ─── Store Interface ──────────────────────────────────────────────────────────
interface TrackerStore {
  // Portfolio
  holdings: Holding[]
  addHolding: (h: Omit<Holding, 'id'>) => void
  updateHolding: (id: string, h: Partial<Holding>) => void
  deleteHolding: (id: string) => void

  // Invest
  sips: SIPEntry[]
  addSIP: (s: Omit<SIPEntry, 'id'>) => void
  updateSIP: (id: string, s: Partial<SIPEntry>) => void
  deleteSIP: (id: string) => void

  // Cashflow
  incomes: IncomeEntry[]
  expenses: ExpenseEntry[]
  addIncome: (i: Omit<IncomeEntry, 'id'>) => void
  updateIncome: (id: string, i: Partial<IncomeEntry>) => void
  deleteIncome: (id: string) => void
  addExpense: (e: Omit<ExpenseEntry, 'id'>) => void
  updateExpense: (id: string, e: Partial<ExpenseEntry>) => void
  deleteExpense: (id: string) => void

  // Allocation
  allocations: AllocationEntry[]
  addAllocation: (a: Omit<AllocationEntry, 'id'>) => void
  updateAllocation: (id: string, a: Partial<AllocationEntry>) => void
  deleteAllocation: (id: string) => void

  // Goals
  goals: Goal[]
  addGoal: (g: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, g: Partial<Goal>) => void
  deleteGoal: (id: string) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const useTrackerStore = create<TrackerStore>()(
  persist(
    (set, get) => ({
      // Portfolio
      holdings: [],
      addHolding: (h) => set((s) => ({ holdings: [...s.holdings, { ...h, id: uid() }] })),
      updateHolding: (id, h) => set((s) => ({ holdings: s.holdings.map(x => x.id === id ? { ...x, ...h } : x) })),
      deleteHolding: (id) => set((s) => ({ holdings: s.holdings.filter(x => x.id !== id) })),

      // Invest
      sips: [],
      addSIP: (s) => set((st) => ({ sips: [...st.sips, { ...s, id: uid() }] })),
      updateSIP: (id, s) => set((st) => ({ sips: st.sips.map(x => x.id === id ? { ...x, ...s } : x) })),
      deleteSIP: (id) => set((st) => ({ sips: st.sips.filter(x => x.id !== id) })),

      // Cashflow
      incomes: [],
      expenses: [],
      addIncome: (i) => set((s) => ({ incomes: [...s.incomes, { ...i, id: uid() }] })),
      updateIncome: (id, i) => set((s) => ({ incomes: s.incomes.map(x => x.id === id ? { ...x, ...i } : x) })),
      deleteIncome: (id) => set((s) => ({ incomes: s.incomes.filter(x => x.id !== id) })),
      addExpense: (e) => set((s) => ({ expenses: [...s.expenses, { ...e, id: uid() }] })),
      updateExpense: (id, e) => set((s) => ({ expenses: s.expenses.map(x => x.id === id ? { ...x, ...e } : x) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter(x => x.id !== id) })),

      // Allocation
      allocations: [],
      addAllocation: (a) => set((s) => ({ allocations: [...s.allocations, { ...a, id: uid() }] })),
      updateAllocation: (id, a) => set((s) => ({ allocations: s.allocations.map(x => x.id === id ? { ...x, ...a } : x) })),
      deleteAllocation: (id) => set((s) => ({ allocations: s.allocations.filter(x => x.id !== id) })),

      // Goals
      goals: [],
      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid() }] })),
      updateGoal: (id, g) => set((s) => ({ goals: s.goals.map(x => x.id === id ? { ...x, ...g } : x) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter(x => x.id !== id) })),
    }),
    {
      name: 'money-os-tracker-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ─── Pure Calculation Utilities ───────────────────────────────────────────────

/** Compound annual growth: FV = PV * (1 + r)^n */
export function fvLumpsum(pv: number, ratePercent: number, years: number): number {
  return pv * Math.pow(1 + ratePercent / 100, years)
}

/** SIP future value: FV = P * [((1+r)^n - 1) / r] * (1+r) */
export function fvSIP(monthlyAmount: number, annualRatePercent: number, months: number): number {
  if (annualRatePercent === 0) return monthlyAmount * months
  const r = annualRatePercent / 100 / 12
  return monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r)
}

/** SIP required to reach target: PMT formula */
export function pmtRequired(target: number, annualRatePercent: number, months: number): number {
  if (months <= 0) return target
  if (annualRatePercent === 0) return target / months
  const r = annualRatePercent / 100 / 12
  return target * r / ((Math.pow(1 + r, months) - 1) * (1 + r))
}

/** Years between two dates */
export function yearsBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return ms / (1000 * 60 * 60 * 24 * 365.25)
}

/** Months between two dates */
export function monthsBetween(from: string, to: string): number {
  const a = new Date(from), b = new Date(to)
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
}

/** CAGR from buy to now */
export function cagr(buyPrice: number, currentPrice: number, years: number): number {
  if (years <= 0 || buyPrice <= 0) return 0
  return (Math.pow(currentPrice / buyPrice, 1 / years) - 1) * 100
}

/** Format as ₹ with abbreviation */
export function fmtRupee(n: number): string {
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`
  if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n.toFixed(0)}`
}
