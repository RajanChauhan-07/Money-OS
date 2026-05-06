/**
 * MONEY OS — Tax Engine Public API
 * All exports for use in the web app.
 */

// ── Core computation ─────────────────────────────────────────────────────
export { computeOldRegime, computeDeductions, computeHRAExemption, computeLTAExemption } from './old-regime'
export { computeNewRegime } from './new-regime'

// ── Utility functions ────────────────────────────────────────────────────
export { computeTaxFromSlabs, calculateSurcharge, calculate87ARebate, roundTax, getMarginalRate, getOldRegimeSlabs } from './utils'

// ── Scenario & Comparison Engine ─────────────────────────────────────────
export { compareTaxRegimes, runScenarioEngine, runWhatIfScenario } from './compare'

// ── Investment Planner ───────────────────────────────────────────────────
export { generateInvestmentPlan, optimizeInput } from './planner'

// ── Insight & Recommendation Engines ────────────────────────────────────
export { generateInsights } from './insights'
export { generateRecommendations, computeBreakEvenMonthlyInvestment } from './recommendations'

// ── Validation ───────────────────────────────────────────────────────────
export { validateTaxInput } from './validation'
export type { ValidationResult, ValidationIssue } from './validation'

// ── Config (read-only) ───────────────────────────────────────────────────
export { FY_2025_26 } from './slabs'
export type { AgeCategory } from './slabs'
