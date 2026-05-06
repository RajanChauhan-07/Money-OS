/**
 * Form 16 parsed data types.
 * Represents all fields extractable from a Form 16 PDF (Part A + Part B).
 */

// Raw extraction from Form 16 PDF — everything the AI parser can pull
export interface Form16Extraction {
  // Employer info (Part A)
  employerName: string
  employerTAN: string

  // Employee info
  employeeName: string
  employeePAN: string

  // Financial year
  financialYear: string // e.g., "2024-25"
  assessmentYear: string // e.g., "2025-26"

  // Part A — TDS summary
  totalSalaryPaid: number
  totalTDSDeducted: number
  totalTDSDeposited: number
  quarterlyTDS: {
    q1: { salaryPaid: number; tdsDeducted: number }
    q2: { salaryPaid: number; tdsDeducted: number }
    q3: { salaryPaid: number; tdsDeducted: number }
    q4: { salaryPaid: number; tdsDeducted: number }
  }

  // Part B — Salary breakdown
  grossSalary: number
  salaryComponents: {
    basicSalary: number
    hra: number
    specialAllowance: number
    lta: number
    perquisites: number
    otherAllowances: number
  }

  // Part B — Deductions claimed
  standardDeduction: number
  professionalTax: number
  hraExemptionClaimed: number

  // Chapter VI-A
  section80C: number
  section80C_eligible: number
  epf_contribution: number
  section80D: number
  section80CCD1: number // Employee NPS under 80CCD(1) — within 80C limit
  section80CCD1B: number // Additional NPS ₹50K
  section80CCD2: number // Employer NPS
  section24b: number // Home loan interest
  otherChapterVIA: number

  // Tax computation
  netTaxableIncome: number
  taxOnTotalIncome: number
  rebateUnder87A: number
  surcharge: number
  educationCess: number
  totalTaxPayable: number
  regimeChosen: 'old' | 'new' | 'unknown'

  // Derived
  refundOrDue: number // positive = refund, negative = due
  confidence: number // 0-100, how confident the parser is
}

// What we derive from Form 16 to pre-fill the current year's profile
export interface Form16DerivedProfile {
  salary: {
    annualCTC: number
    inHandMonthly: number
    variablePayPercent: number
  }
  structure: {
    basicSalary: number // monthly
    hra: number // monthly
    lta: number // monthly
    specialAllowance: number // monthly
    otherAllowances: number // monthly
    isMetroCity: boolean
    cityName: string
    monthlyRent: number
  }
  employer: {
    companyName: string
    epfEmployeePercent: number
    epfEmployerPercent: number
    hasEmployerNPS: boolean
    employerNPSPercent: number
  }
  life: {
    isRenting: boolean
    hasHomeLoan: boolean
    homeLoanInterestAnnual: number
    homeLoanPrincipalAnnual: number
    selfHealthPremium: number
    familyHealthPremium: number
    parentHealthPremium: number
    hasSeniorParents: boolean
    dependentChildren: number
    hasDisabledDependent: boolean
    disabilityType: 'normal' | 'severe'
    medicalTreatmentExpense: number
    educationLoanInterest: number
    section80EEInterest: number
    section80EEAInterest: number
    evLoanInterest: number
    donations100pct: number
    donations50pct: number
    section80GGRent: number
    savingsInterest: number
    depositInterest: number
    hasSelfDisability: boolean
    selfDisabilityType: 'normal' | 'severe'
  }
  investments: {
    ppfAnnual: number
    licPremiumAnnual: number
    elssAnnual: number
    nscAnnual: number
    ssyAnnual: number
    tuitionFees: number
    epfEmployee: number
    npsEmployee: number
    otherSection80C: number
  }

  // What the AI thinks the user missed
  missedOpportunities: MissedOpportunity[]
}

export interface MissedOpportunity {
  section: string // e.g., "80CCD(1B)", "80D Parents"
  description: string // e.g., "You didn't claim the extra ₹50K NPS deduction"
  potentialSaving: number // e.g., 15600
  action: string // e.g., "Invest ₹50,000 in NPS Tier 1"
}

// Upload state machine
export type UploadState =
  | 'idle'
  | 'uploading'
  | 'reading'
  | 'extracting'
  | 'reviewing'
  | 'done'
  | 'error'
