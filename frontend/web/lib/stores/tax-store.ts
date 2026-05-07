'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  TaxInput,
  TaxComparisonResult,
  SalaryDetails,
  SalaryStructure,
  EmployerDetails,
  LifeSituation,
  ExistingInvestments,
  WhatIfState,
  ScenarioMode,
  ScenarioEngineResult,
  Insight,
  Recommendation,
} from '@money-os/types'
import type {
  Form16Extraction,
  Form16DerivedProfile,
  MissedOpportunity,
  UploadState,
} from '@money-os/types/src/form16'
import { compareTaxRegimes, runScenarioEngine, runWhatIfScenario } from '@money-os/tax-engine'
import { validateTaxInput } from '@money-os/tax-engine'
import type { ValidationResult } from '@money-os/tax-engine'

interface TaxStore {
  // ── Upload state ──────────────────────────────────────────────────────
  uploadState: UploadState
  uploadError: string | null
  pdfUrl: string | null
  setUploadState: (state: UploadState) => void
  setUploadError: (error: string | null) => void
  setPdfUrl: (url: string | null) => void

  // ── Form 16 raw extraction ────────────────────────────────────────────
  form16Extraction: Form16Extraction | null
  setForm16Extraction: (extraction: Form16Extraction) => void

  // ── Derived profile (pre-filled from Form 16 or manually entered) ─────
  derivedProfile: Form16DerivedProfile | null
  setDerivedProfile: (profile: Form16DerivedProfile) => void

  // ── User-editable tax input ───────────────────────────────────────────
  taxInput: TaxInput | null
  setTaxInput: (input: TaxInput) => void

  // ── What-If Simulator state ───────────────────────────────────────────
  whatIfState: WhatIfState | null
  setWhatIfState: (state: WhatIfState) => void
  whatIfResult: TaxComparisonResult | null
  computeWhatIf: (state: WhatIfState) => void

  // ── Computed results & Scenarios ─────────────────────────────────────
  taxResult: TaxComparisonResult | null
  scenarios: ScenarioEngineResult | null
  activeScenarioMode: ScenarioMode
  setActiveScenarioMode: (mode: ScenarioMode) => void

  // ── Validation ────────────────────────────────────────────────────────
  validation: ValidationResult | null

  // ── Missed opportunities from AI ─────────────────────────────────────
  missedOpportunities: MissedOpportunity[]
  setMissedOpportunities: (opportunities: MissedOpportunity[]) => void

  // ── User intent ───────────────────────────────────────────────────────
  investmentIntent: boolean
  setInvestmentIntent: (intent: boolean) => void

  // ── Actions ───────────────────────────────────────────────────────────
  computeTax: () => void
  buildTaxInputFromProfile: (profile: Form16DerivedProfile) => TaxInput
  savePlan: () => Promise<{ success: boolean; error?: string }>
  reset: () => void

  // ── Derived state ─────────────────────────────────────────────────────
  hasResult: boolean
}

// ── Defaults ──────────────────────────────────────────────────────────────
const defaultSalary: SalaryDetails = {
  annualCTC: 0,
  inHandMonthly: 0,
  variablePayPercent: 0,
  payFrequency: 'monthly',
}

const defaultStructure: SalaryStructure = {
  basicSalary: 0,
  hra: 0,
  lta: 0,
  specialAllowance: 0,
  otherAllowancesMonthly: 0,
  bonusAnnual: 0,
  isMetroCity: false,
  cityName: '',
  monthlyRent: 0,
}

const defaultEmployer: EmployerDetails = {
  companyName: '',
  employerType: 'Private',
  isEPFApplicable: true,
  epfEmployeeMonthly: 0,
  epfEmployerMonthly: 0,
  epfEmployeePercent: 12,
  epfEmployerPercent: 12,
  hasEmployerNPS: false,
  employerNPSMonthly: 0,
  employerNPSPercent: 0,
}

const defaultLife: LifeSituation = {
  isRenting: false,
  hasHomeLoan: false,
  homeLoanEMI: 0,
  homeLoanOutstanding: 0,
  homeLoanInterestAnnual: 0,
  homeLoanPrincipalAnnual: 0,
  propertyType: 'Self-occupied',
  dependentChildren: 0,
  hasSeniorParents: false,
  parentAge: 0,
  selfHealthPremium: 0,
  familyHealthPremium: 0,
  parentHealthPremium: 0,
}

const defaultInvestments: ExistingInvestments = {
  ppfAnnual: 0,
  licPremiumAnnual: 0,
  elssAnnual: 0,
  nscAnnual: 0,
  taxSavingFDAnnual: 0,
  scssAnnual: 0,
  ssyAnnual: 0,
  tuitionFees: 0,
  epfEmployee: 0,
  npsEmployee: 0,
  otherSection80C: 0,
}

// ── Store ─────────────────────────────────────────────────────────────────
export const useTaxStore = create<TaxStore>()(
  persist(
    (set, get) => ({
      // State
      uploadState: 'idle',
      uploadError: null,
      pdfUrl: null,
      form16Extraction: null,
      derivedProfile: null,
      taxInput: null,
      taxResult: null,
      scenarios: null,
      whatIfState: null,
      whatIfResult: null,
      activeScenarioMode: 'current',
      missedOpportunities: [],
      hasResult: false,
      validation: null,
      investmentIntent: true,

      // Setters
      setUploadState: (state) => set({ uploadState: state }),
      setUploadError: (error) => set({ uploadError: error, uploadState: error ? 'error' : get().uploadState }),
      setPdfUrl: (url) => set({ pdfUrl: url }),
      setForm16Extraction: (extraction) => set({ form16Extraction: extraction }),
      setDerivedProfile: (profile) => set({ derivedProfile: profile }),
      setTaxInput: (input) => set({ taxInput: input }),
      setMissedOpportunities: (opportunities) => set({ missedOpportunities: opportunities }),
      setInvestmentIntent: (intent) => set({ investmentIntent: intent }),

      setWhatIfState: (state) => set({ whatIfState: state }),

      computeWhatIf: (state: WhatIfState) => {
        const { taxInput } = get()
        if (!taxInput) return
        try {
          const result = runWhatIfScenario(taxInput, state)
          set({ whatIfState: state, whatIfResult: result })
        } catch (e) {
          console.error('What-if computation error:', e)
        }
      },

      setActiveScenarioMode: (mode) => {
        const { scenarios } = get()
        if (!scenarios) return
        let taxResult: TaxComparisonResult | null = null
        if (mode === 'optimized') taxResult = scenarios.optimized
        else if (mode === 'custom') taxResult = get().whatIfResult
        else taxResult = scenarios.current

        set({ activeScenarioMode: mode, taxResult })
      },

      // Build TaxInput from the derived profile
      buildTaxInputFromProfile: (profile: Form16DerivedProfile): TaxInput => {
        const salary: SalaryDetails = {
          annualCTC: profile.salary.annualCTC,
          inHandMonthly: profile.salary.inHandMonthly,
          variablePayPercent: profile.salary.variablePayPercent,
          payFrequency: 'monthly',
        }
        const structure: SalaryStructure = {
          basicSalary: profile.structure.basicSalary,
          hra: profile.structure.hra,
          lta: profile.structure.lta,
          specialAllowance: profile.structure.specialAllowance,
          otherAllowancesMonthly: profile.structure.otherAllowancesMonthly,
          bonusAnnual: profile.structure.bonusAnnual,
          isMetroCity: profile.structure.isMetroCity,
          cityName: profile.structure.cityName,
          monthlyRent: profile.structure.monthlyRent,
        }
        const employer: EmployerDetails = {
          companyName: profile.employer.companyName,
          employerType: profile.employer.employerType,
          isEPFApplicable: profile.employer.isEPFApplicable,
          epfEmployeeMonthly: profile.employer.epfEmployeeMonthly,
          epfEmployerMonthly: profile.employer.epfEmployerMonthly,
          epfEmployeePercent: profile.employer.epfEmployeePercent,
          epfEmployerPercent: profile.employer.epfEmployerPercent,
          hasEmployerNPS: profile.employer.hasEmployerNPS,
          employerNPSMonthly: profile.employer.employerNPSMonthly,
          employerNPSPercent: profile.employer.employerNPSPercent,
        }
        const life: LifeSituation = {
          isRenting: profile.life.isRenting,
          hasHomeLoan: profile.life.hasHomeLoan,
          homeLoanEMI: 0,
          homeLoanOutstanding: 0,
          homeLoanInterestAnnual: profile.life.homeLoanInterestAnnual,
          homeLoanPrincipalAnnual: profile.life.homeLoanPrincipalAnnual,
          propertyType: profile.life.propertyType,
          dependentChildren: profile.life.dependentChildren,
          hasSeniorParents: profile.life.hasSeniorParents,
          parentAge: profile.life.hasSeniorParents ? 65 : 55,
          selfHealthPremium: profile.life.selfHealthPremium,
          familyHealthPremium: profile.life.familyHealthPremium,
          parentHealthPremium: profile.life.parentHealthPremium,
          hasDisabledDependent: profile.life.hasDisabledDependent,
          disabilityType: profile.life.disabilityType,
          medicalTreatmentExpense: profile.life.medicalTreatmentExpense,
          educationLoanInterest: profile.life.educationLoanInterest,
          section80EEInterest: profile.life.section80EEInterest,
          section80EEAInterest: profile.life.section80EEAInterest,
          evLoanInterest: profile.life.evLoanInterest,
          donations100pct: profile.life.donations100pct,
          donations50pct: profile.life.donations50pct,
          section80GGRent: profile.life.section80GGRent,
          savingsInterest: profile.life.savingsInterest,
          depositInterest: profile.life.depositInterest,
          hasSelfDisability: profile.life.hasSelfDisability,
          selfDisabilityType: profile.life.selfDisabilityType,
        }
        const investments: ExistingInvestments = {
          ppfAnnual: profile.investments.ppfAnnual,
          licPremiumAnnual: profile.investments.licPremiumAnnual,
          elssAnnual: profile.investments.elssAnnual,
          nscAnnual: profile.investments.nscAnnual,
          taxSavingFDAnnual: profile.investments.taxSavingFDAnnual,
          scssAnnual: profile.investments.scssAnnual,
          ssyAnnual: profile.investments.ssyAnnual,
          tuitionFees: profile.investments.tuitionFees,
          epfEmployee: profile.investments.epfEmployee,
          npsEmployee: profile.investments.npsEmployee,
          otherSection80C: profile.investments.otherSection80C,
        }
        return {
          salary,
          structure,
          employer,
          life,
          investments,
          financialYear: 'FY 2025-26',
          investmentIntent: get().investmentIntent,
        }
      },

      // Run the full tax engine + scenario engine
      computeTax: () => {
        const { taxInput } = get()
        if (!taxInput) return
        try {
          // Validate first
          const validation = validateTaxInput(taxInput)
          const scenarios = runScenarioEngine(taxInput)
          set({
            scenarios,
            taxResult: scenarios.current,
            activeScenarioMode: 'current',
            hasResult: true,
            validation,
          })
        } catch (error) {
          console.error('Tax computation error:', error)
        }
      },

      // Save plan to database
      savePlan: async () => {
        const { taxResult, derivedProfile } = get()
        if (!taxResult || !derivedProfile) {
          return { success: false, error: 'No plan to save' }
        }
        try {
          const response = await fetch('/api/tax/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taxResult, derivedProfile }),
          })
          if (!response.ok) {
            const data = await response.json()
            return { success: false, error: data.error || 'Failed to save plan' }
          }
          return { success: true }
        } catch (error) {
          console.error('Save plan error:', error)
          return { success: false, error: 'Internal server error' }
        }
      },

      // Reset everything
      reset: () =>
        set({
          uploadState: 'idle',
          uploadError: null,
          pdfUrl: null,
          form16Extraction: null,
          derivedProfile: null,
          taxInput: null,
          taxResult: null,
          scenarios: null,
          whatIfState: null,
          whatIfResult: null,
          missedOpportunities: [],
          hasResult: false,
          validation: null,
          activeScenarioMode: 'current',
        }),
    }),
    {
      name: 'money-os-tax-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        form16Extraction: state.form16Extraction,
        derivedProfile: state.derivedProfile,
        taxInput: state.taxInput,
        taxResult: state.taxResult,
        scenarios: state.scenarios,
        missedOpportunities: state.missedOpportunities,
        hasResult: state.hasResult,
        investmentIntent: state.investmentIntent,
        validation: state.validation,
      }),
    }
  )
)
