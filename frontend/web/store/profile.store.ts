import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, SalaryDetails, SalaryStructure, EmployerDetails, LifeSituation, ExistingInvestments, FinancialGoal, RiskAssessment } from '@money-os/types'

interface ProfileStore {
  user: Partial<UserProfile>
  salary: Partial<SalaryDetails>
  structure: Partial<SalaryStructure>
  employer: Partial<EmployerDetails>
  life: Partial<LifeSituation>
  investments: Partial<ExistingInvestments>
  goals: FinancialGoal[]
  risk: Partial<RiskAssessment>
  onboardingStep: number
  isOnboarded: boolean
  setUser: (u: Partial<UserProfile>) => void
  setSalary: (s: Partial<SalaryDetails>) => void
  setStructure: (s: Partial<SalaryStructure>) => void
  setEmployer: (e: Partial<EmployerDetails>) => void
  setLife: (l: Partial<LifeSituation>) => void
  setInvestments: (i: Partial<ExistingInvestments>) => void
  addGoal: (g: FinancialGoal) => void
  removeGoal: (id: string) => void
  setRisk: (r: Partial<RiskAssessment>) => void
  setOnboardingStep: (step: number) => void
  completeOnboarding: () => void
  reset: () => void
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      user: {}, salary: {}, structure: {}, employer: {}, life: {},
      investments: {}, goals: [], risk: {}, onboardingStep: 0, isOnboarded: false,
      setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),
      setSalary: (sal) => set((s) => ({ salary: { ...s.salary, ...sal } })),
      setStructure: (str) => set((s) => ({ structure: { ...s.structure, ...str } })),
      setEmployer: (e) => set((s) => ({ employer: { ...s.employer, ...e } })),
      setLife: (l) => set((s) => ({ life: { ...s.life, ...l } })),
      setInvestments: (i) => set((s) => ({ investments: { ...s.investments, ...i } })),
      addGoal: (g) => set((s) => ({ goals: [...s.goals, g] })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      setRisk: (r) => set((s) => ({ risk: { ...s.risk, ...r } })),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: () => set({ isOnboarded: true }),
      reset: () => set({ user: {}, salary: {}, structure: {}, employer: {}, life: {}, investments: {}, goals: [], risk: {}, onboardingStep: 0, isOnboarded: false }),
    }),
    { name: 'money-os-profile' }
  )
)
