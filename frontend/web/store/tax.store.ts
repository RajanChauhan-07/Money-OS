import { create } from 'zustand'
import type { TaxComparisonResult, InvestmentPlan } from '@money-os/types'

interface TaxStore {
  result: TaxComparisonResult | null
  plan: InvestmentPlan | null
  isCalculating: boolean
  lastCalculated: string | null
  setResult: (r: TaxComparisonResult) => void
  setPlan: (p: InvestmentPlan) => void
  setCalculating: (v: boolean) => void
  reset: () => void
}

export const useTaxStore = create<TaxStore>()((set) => ({
  result: null, plan: null, isCalculating: false, lastCalculated: null,
  setResult: (r) => set({ result: r, lastCalculated: new Date().toISOString() }),
  setPlan: (p) => set({ plan: p }),
  setCalculating: (v) => set({ isCalculating: v }),
  reset: () => set({ result: null, plan: null, isCalculating: false, lastCalculated: null }),
}))
