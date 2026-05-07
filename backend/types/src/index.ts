// ─────────────────────────────────────────────
// MONEY OS — Shared Type Definitions
// AY 2026-27 (FY 2025-26) | All limits from
// tax-engine config layer (slabs.ts).
// ─────────────────────────────────────────────

// ── Age Category (affects Old Regime slabs) ──
export type AgeCategory = 'below60' | 'senior' | 'superSenior'

// ── User & Profile ──────────────────────────
export interface UserProfile {
  id: string
  name: string
  pan: string
  dob: string
  gender?: 'male' | 'female' | 'other'
  mobile: string
  email: string
  kycStatus: 'pending' | 'verified' | 'expired'
  createdAt: string
}

// ── Salary & Structure ───────────────────────
export interface SalaryDetails {
  annualCTC: number
  inHandMonthly: number
  variablePayPercent: number
  payFrequency: 'monthly' | 'quarterly'
}

export interface SalaryStructure {
  basicSalary: number       // monthly
  hra: number               // monthly HRA component from employer
  lta: number               // monthly LTA component
  specialAllowance: number  // monthly
  otherAllowancesMonthly: number // monthly (fuel, telephone, etc)
  bonusAnnual: number       // annual performance bonus/incentive
  isMetroCity: boolean
  cityName: string
  monthlyRent: number       // actual rent paid per month (0 if not renting)
  professionalTaxMonthly: number // monthly professional tax deduction
}

export interface EmployerDetails {
  companyName: string
  employerType: 'Government' | 'PSU' | 'Private'
  isEPFApplicable: boolean
  epfEmployeeMonthly: number   // monthly deduction from payslip
  epfEmployerMonthly: number   // monthly contribution by employer (optional)
  epfEmployeePercent: number   // usually 12 (advanced)
  epfEmployerPercent: number   // usually 12 (advanced)
  hasEmployerNPS: boolean
  employerNPSMonthly: number   // monthly NPS contribution by employer (80CCD2)
  employerNPSPercent: number   // % of basic contributed by employer
}

// ── Life Situation ───────────────────────────
export interface LifeSituation {
  isRenting: boolean
  hasHomeLoan: boolean
  homeLoanEMI: number
  homeLoanOutstanding: number
  homeLoanInterestAnnual: number    // for Section 24b
  homeLoanPrincipalAnnual: number   // for 80C
  propertyType: 'Self-occupied' | 'Let-out' | 'Under construction'
  dependentChildren: number
  hasSeniorParents: boolean
  parentAge: number
  selfHealthPremium: number
  familyHealthPremium: number
  parentHealthPremium: number
  // ── Section 80DD — Disabled Dependent ───────
  hasDisabledDependent?: boolean
  disabilityType?: 'normal' | 'severe'    // severe = 80%+
  // ── Section 80DDB — Medical Treatment ───────
  medicalTreatmentExpense?: number         // Specified diseases
  // ── Section 80E — Education Loan ────────────
  educationLoanInterest?: number           // No upper limit
  // ── Section 80EE — Housing Loan Interest ────
  section80EEInterest?: number             // Loan sanctioned Apr 2016–Mar 2017
  // ── Section 80EEA — First-time Home Buyer ───
  section80EEAInterest?: number            // Loan sanctioned Apr 2019–Mar 2022
  // ── Section 80EEB — Electric Vehicle Loan ───
  evLoanInterest?: number                  // Loan sanctioned Apr 2019–Mar 2023
  // ── Section 80G — Donations ─────────────────
  donations100pct?: number                 // 100% deduction eligible donations
  donations50pct?: number                  // 50% deduction eligible donations
  // ── Section 80GG — Rent (no HRA in salary) ──
  section80GGRent?: number                 // Rent paid if no HRA component
  // ── Section 80TTA — Savings Interest ────────
  savingsInterest?: number                 // Interest on savings account
  // ── Section 80TTB — Deposit Interest (Sr.) ──
  depositInterest?: number                 // Senior citizen deposit interest
  // ── Section 80U — Self Disability ───────────
  hasSelfDisability?: boolean
  selfDisabilityType?: 'normal' | 'severe' // severe = 80%+
}

// ── Investments ───────────────────────────────
export interface ExistingInvestments {
  ppfAnnual: number
  licPremiumAnnual: number
  elssAnnual: number
  nscAnnual: number
  taxSavingFDAnnual: number
  scssAnnual: number
  ssyAnnual: number
  tuitionFees: number
  epfEmployee: number       // Annual EPF contribution (auto-deducted from salary)
  npsEmployee: number       // Employee NPS contribution (80CCD(1B) — extra ₹50K)
  otherSection80C: number   // Any other 80C eligible investment
}

// ── Goals ────────────────────────────────────
export type GoalType = 'retirement' | 'home' | 'education' | 'emergency' | 'vehicle' | 'travel' | 'custom'

export interface FinancialGoal {
  id: string
  type: GoalType
  name: string
  targetAmount: number
  targetYear: number
  currentSavings: number
  priority: 1 | 2 | 3 | 4 | 5
  monthlyRequired?: number
}

// ── Risk Profile ──────────────────────────────
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'

export interface RiskAssessment {
  score: number
  profile: RiskProfile
  equityPercent: number
  debtPercent: number
  completedAt: string
}

// ── Tax Calculation Input ─────────────────────
export interface TaxInput {
  salary: SalaryDetails
  structure: SalaryStructure
  employer: EmployerDetails
  life: LifeSituation
  investments: ExistingInvestments
  financialYear: string         // e.g. "FY 2025-26"
  investmentIntent?: boolean    // Does the user plan to invest this year?
  ltaClaimed?: boolean          // Has LTA been claimed this year?
  ageCategory?: AgeCategory     // Affects Old Regime slabs (below60 | senior | superSenior)
}

// ── Deduction Breakdown (per-section itemization) ──
export interface DeductionItem {
  section: string               // e.g. "80C", "80D", "80CCD(1B)", "HRA", "24b"
  label: string                 // e.g. "ELSS + PPF + EPF"
  amount: number                // Actual amount claimed/eligible
  limit: number                 // Statutory maximum
  headroom: number              // limit - amount (opportunity remaining)
  confidence: 'declared' | 'assumed' | 'eligible'
  // declared = from Form 16, assumed = auto-calculated, eligible = gap not yet used
}

// ── Audit Trail Step ─────────────────────────
export interface AuditStep {
  step: number
  label: string                 // e.g. "Gross Income", "Less: HRA Exemption"
  amount: number                // Value at this step
  running: number               // Running total after this step
  formula?: string              // Human-readable formula: "12,00,000 − 1,80,000 = 10,20,000"
  isDeduction: boolean
}

// ── Tax Deductions ─────────────────────────────
export interface TaxDeductions {
  section80C: number
  section80CMax: number
  section80D_self: number
  section80D_parents: number
  section80D_max_self: number
  section80D_max_parents: number
  section80CCD1B: number
  section80CCD2: number
  hraExemption: number
  ltaExemption: number
  section24b: number
  professionalTax: number
  standardDeduction: number
  // ── Additional deductions (AY 2026-27) ──────
  section80DD: number             // Disabled dependent
  section80DDB: number            // Medical treatment
  section80E: number              // Education loan interest
  section80EE: number             // Housing loan interest (2016-17)
  section80EEA: number            // Housing loan interest (2019-22)
  section80EEB: number            // EV loan interest
  section80G: number              // Donations
  section80GG: number             // Rent (no HRA)
  section80TTA: number            // Savings interest (non-senior)
  section80TTB: number            // Deposit interest (senior)
  section80U: number              // Self disability
  otherDeductions: number
}

// ── Insight (human-readable findings) ────────
export interface Insight {
  id: string
  section: string               // e.g. "80C", "regime", "HRA"
  severity: 'success' | 'warning' | 'danger' | 'info'
  title: string                 // Short headline: "You used ₹0 of ₹1.5L under 80C"
  description: string           // Full explanation: "Investing ₹1.5L in ELSS, PPF, or EPF..."
  actionText?: string           // CTA: "Start investing now →"
  actionRoute?: string          // e.g. "/plan/summary"
  potentialSaving: number       // ₹ amount saved if this insight is acted upon
  icon: string                  // lucide icon name, e.g. "AlertCircle"
}

// ── Recommendation (strategy-level advice) ───
export interface Recommendation {
  id: string
  title: string                 // "Switch to Old Regime after investing ₹12K/month"
  body: string                  // Detailed explanation
  impact: number                // Annual tax saving in ₹
  investmentRequired: number    // Annual investment needed
  monthlyAmount: number         // Monthly SIP required
  switchRegime: boolean         // Should user switch regime?
  targetRegime?: 'old' | 'new'
  priority: number              // 1 = highest priority
  feasibility: 'easy' | 'moderate' | 'stretch'
}

// ── What-If Simulator State ───────────────────
export interface WhatIfState {
  section80C: number            // 0 to 150000
  section80D_self: number       // 0 to 25000
  section80D_parents: number    // 0 to 50000
  nps: number                   // 0 to 50000 (80CCD(1B))
  homeLoanInterest: number      // 0 to 200000 (Section 24b)
  monthlyRent: number           // 0 to any (for HRA)
}

// ── Regime Result ─────────────────────────────
export interface RegimeResult {
  regime: 'old' | 'new'
  grossIncome: number
  totalDeductions: number
  taxableIncome: number
  taxBeforeSurcharge: number
  surcharge: number
  taxBeforeRebate: number
  rebate87A: number
  taxBeforeCess: number
  cess: number
  totalTax: number
  monthlyTDS: number
  annualTakeHome: number
  monthlyTakeHome: number
  effectiveTaxRate: number      // As percentage of gross
  marginalRate: number          // Marginal slab rate %
  deductionBreakdown: DeductionItem[]
  auditTrail: AuditStep[]
}

export type ScenarioMode = 'current' | 'optimized' | 'custom'

// ── Tax Comparison Result ─────────────────────
export interface TaxComparisonResult {
  old: RegimeResult
  new: RegimeResult
  recommendedRegime: 'old' | 'new'
  savingsWithRecommended: number
  deductions: TaxDeductions
  reasoning: string
  taxEfficiencyScore: number    // 0–100 (100 = fully optimized)
  lossMeter: number             // ₹ overpaid vs theoretical minimum
  insights: Insight[]
  recommendations: Recommendation[]
  switchStrategy: string        // Plain-English: "Stay in New Regime unless you invest ₹18K/month"
  breakEvenMonthlyInvestment: number  // Monthly investment to make old regime worth it
}

// ── Scenario Engine Result ────────────────────
export interface ScenarioEngineResult {
  current: TaxComparisonResult
  optimized: TaxComparisonResult
  custom?: TaxComparisonResult      // populated when user adjusts what-if sliders
  bestScenario: ScenarioMode
}

// ── Allocation Plan ───────────────────────────
export interface AllocationItem {
  instrument: string
  section: '80C' | '80D' | 'NPS' | 'Other'
  annualAmount: number
  monthlyAmount: number
  goalId?: string
  risk: 'low' | 'medium' | 'high'
  lockIn: number
  expectedReturn: number
  taxSaving: number             // Tax saved by this specific allocation
  priority: number              // 1 = invest first
}

export interface MonthlyPlan {
  month: number
  year: number
  income: number
  fixedOutflows: number
  investableAmount: number
  sipDebitDate: number
  isLumpsumMonth: boolean
  lumpsumSuggestion?: number
  remainingAfterSIP: number     // Take-home after SIP deductions
}

export interface InvestmentPlan {
  allocations: AllocationItem[]
  totalAnnualInvestment: number
  section80CUsed: number
  section80DUsed: number
  npsUsed: number
  projectedTaxSaving: number
  monthlyPlan: MonthlyPlan[]
  feasibility: 'easy' | 'moderate' | 'stretch'
  monthlyAffordability: number  // Max monthly investment without stretching
  generatedAt: string
}

// ── Instruments ───────────────────────────────
export interface MutualFund {
  id: string
  name: string
  amcName: string
  category: 'ELSS' | 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'Hybrid' | 'Debt' | 'Index'
  nav: number
  navDate: string
  returns1Y: number
  returns3Y: number
  returns5Y: number
  rating: number
  riskLevel: 'Low' | 'Moderately Low' | 'Moderate' | 'Moderately High' | 'High' | 'Very High'
  minSIP: number
  minLumpsum: number
  exitLoad: string
  isElss: boolean
}

export interface SIPMandate {
  id: string
  fundId: string
  fundName: string
  amount: number
  frequency: 'monthly' | 'quarterly'
  sipDate: number
  startDate: string
  status: 'active' | 'paused' | 'cancelled' | 'mandate_expired'
  nextDebitDate: string
}

export interface Transaction {
  id: string
  type: 'SIP' | 'Lumpsum' | 'Redemption' | 'Switch'
  fundId: string
  fundName: string
  amount: number
  units?: number
  nav?: number
  date: string
  status: 'processing' | 'allotted' | 'failed' | 'cancelled'
  orderId: string
}

export interface Holding {
  fundId: string
  fundName: string
  units: number
  avgNav: number
  currentNav: number
  investedAmount: number
  currentValue: number
  gainLoss: number
  gainLossPercent: number
  xirr: number
  goalId?: string
  section?: '80C' | 'Other'
}

// ── Form 16 types ──────────────────────────────
export type { Form16Extraction, Form16DerivedProfile, MissedOpportunity, UploadState } from './form16'
