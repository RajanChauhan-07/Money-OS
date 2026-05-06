/**
 * MONEY OS — Tax Rule Configuration
 * AY 2026-27 (FY 2025-26) | All values externalized — no hardcoding in engine logic.
 *
 * Source: Income Tax Department — Returns and Forms Applicable for Salaried Individuals, AY 2026-27
 * Page Last Reviewed or Updated: 21-Apr-2026
 *
 * To update for next AY: only change values in this file.
 */

// ── Age Category (affects Old Regime slabs only) ──────────────────────────
export type AgeCategory = 'below60' | 'senior' | 'superSenior'

export const FY_2025_26 = {
  // ── Old Regime ──────────────────────────────────────────────────────────
  // Age-based slab tables per government source
  old: {
    // Individual below 60 years of age
    slabsByAge: {
      below60: [
        { min: 0,       max: 250000,   rate: 0.00 },
        { min: 250000,  max: 500000,   rate: 0.05 },
        { min: 500000,  max: 1000000,  rate: 0.20 },
        { min: 1000000, max: Infinity,  rate: 0.30 },
      ],
      // Individual 60 years or more but less than 80 years (Senior Citizen)
      senior: [
        { min: 0,       max: 300000,   rate: 0.00 },
        { min: 300000,  max: 500000,   rate: 0.05 },
        { min: 500000,  max: 1000000,  rate: 0.20 },
        { min: 1000000, max: Infinity,  rate: 0.30 },
      ],
      // Individual 80 years of age or more (Super Senior Citizen)
      superSenior: [
        { min: 0,       max: 500000,   rate: 0.00 },
        { min: 500000,  max: 1000000,  rate: 0.20 },
        { min: 1000000, max: Infinity,  rate: 0.30 },
      ],
    },
    // Default slabs for backward compatibility (below 60)
    get slabs() {
      return this.slabsByAge.below60
    },
    standardDeduction: 50000,
    // Section 87A rebate: full rebate if taxable <= 5L
    rebate87A: {
      limit: 500000,
      rebate: 12500,
      marginalReliefLimit: 500000,  // no marginal relief in old regime
    },
  },

  // ── New Regime (u/s 115BAC) ─────────────────────────────────────────────
  // Same slabs for ALL age groups
  new: {
    slabs: [
      { min: 0,        max: 400000,   rate: 0.00 },
      { min: 400000,   max: 800000,   rate: 0.05 },
      { min: 800000,   max: 1200000,  rate: 0.10 },
      { min: 1200000,  max: 1600000,  rate: 0.15 },
      { min: 1600000,  max: 2000000,  rate: 0.20 },
      { min: 2000000,  max: 2400000,  rate: 0.25 },
      { min: 2400000,  max: Infinity,  rate: 0.30 },
    ],
    standardDeduction: 75000,
    // Section 87A: Full rebate if taxable <= 12L; marginal relief above
    rebate87A: {
      limit: 1200000,
      rebate: 60000,
      marginalReliefLimit: 1275000,  // upper bound for marginal relief
    },
  },

  // ── Education & Health Cess ──────────────────────────────────────────────
  cessRate: 0.04,

  // ── Surcharge (on income tax) — regime-specific ──────────────────────────
  // Per government source: bracket starts at ₹50L (not ₹50L of basic)
  surcharge: {
    old: [
      { min: 5000000,   max: 10000000,   rate: 0.10 },
      { min: 10000000,  max: 20000000,   rate: 0.15 },
      { min: 20000000,  max: 50000000,   rate: 0.25 },
      { min: 50000000,  max: Infinity,    rate: 0.37 },  // 37% cap for old regime
    ],
    new: [
      { min: 5000000,   max: 10000000,   rate: 0.10 },
      { min: 10000000,  max: 20000000,   rate: 0.15 },
      { min: 20000000,  max: Infinity,    rate: 0.25 },  // Capped at 25% in new regime
    ],
  },

  // ── Deduction Limits (all statutory caps) ─────────────────────────────────
  deductionLimits: {
    // ── Section 80C / 80CCC / 80CCD(1) — Combined limit ──────────────────
    section80C: 150000,

    // ── Section 80CCD(1B) — Extra NPS above 80C limit ────────────────────
    section80CCD1B: 50000,

    // ── Section 80CCD(2) — Employer NPS: max 14% of basic ────────────────
    section80CCD2_pct: 0.14,

    // ── Section 80D — Health Insurance ────────────────────────────────────
    section80D_self: 25000,               // Self + family (non-senior)
    section80D_self_senior: 50000,        // Self + family (if self is senior)
    section80D_parents: 25000,            // Parents (non-senior)
    section80D_parents_senior: 50000,     // Parents (senior citizens 60+)
    section80D_preventiveCheckup: 5000,   // Within the above limits

    // ── Section 80DD — Disabled Dependent ─────────────────────────────────
    section80DD: 75000,                   // Flat deduction
    section80DD_severe: 125000,           // Severe disability (80%+)

    // ── Section 80DDB — Medical Treatment for Specified Diseases ──────────
    section80DDB: 40000,                  // Below 60
    section80DDB_senior: 100000,          // Senior citizen (60+)

    // ── Section 80E — Interest on Education Loan ──────────────────────────
    section80E: Infinity,                 // No upper limit — actual interest paid

    // ── Section 80EE — Interest on Housing Loan (Apr 2016 – Mar 2017) ─────
    section80EE: 50000,

    // ── Section 80EEA — Interest on Housing Loan (Apr 2019 – Mar 2022) ────
    section80EEA: 150000,

    // ── Section 80EEB — Interest on Electric Vehicle Loan ─────────────────
    section80EEB: 150000,

    // ── Section 80G — Donations ───────────────────────────────────────────
    // Variable: 100% or 50% deduction depending on donee
    section80G_100pct: Infinity,          // 100% deduction funds
    section80G_50pct: Infinity,           // 50% deduction funds

    // ── Section 80GG — Rent paid (no HRA in salary) ──────────────────────
    section80GG_monthly: 5000,            // ₹5,000/month cap
    section80GG_pct: 0.25,               // 25% of total income

    // ── Section 80TTA — Savings bank interest (non-senior) ───────────────
    section80TTA: 10000,

    // ── Section 80TTB — Deposit interest (senior citizens) ───────────────
    section80TTB: 50000,

    // ── Section 80U — Person with Disability ─────────────────────────────
    section80U: 75000,                    // Flat deduction
    section80U_severe: 125000,            // Severe disability (80%+)

    // ── Section 24b — Home Loan Interest ──────────────────────────────────
    section24b: 200000,                   // Self-occupied property
    section24b_letout: Infinity,          // Let-out property: actual interest, no cap

    // ── Other ─────────────────────────────────────────────────────────────
    professionalTax: 2400,                // Max professional tax deduction per year
    ltaExemption: Infinity,               // Based on actual travel bills
  },
} as const

// ── Type helpers for slab array ───────────────────────────────────────────
export type TaxSlab = { min: number; max: number; rate: number }
export type SurchargeRule = { min: number; max: number; rate: number }
