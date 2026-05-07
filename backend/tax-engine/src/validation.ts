/**
 * MONEY OS — Input Validation Layer
 * Sanity-checks TaxInput before sending to the engine.
 * Returns structured warnings — never throws.
 */

import type { TaxInput } from '@money-os/types'

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  field: string
  severity: ValidationSeverity
  message: string
  suggestion?: string
}

export interface ValidationResult {
  isValid: boolean               // false = has at least one error
  hasWarnings: boolean
  issues: ValidationIssue[]
}

export function validateTaxInput(input: TaxInput): ValidationResult {
  const issues: ValidationIssue[] = []
  const { salary, structure, employer, life, investments } = input

  // ── Critical: income must be present ──────────────────────────────────
  if (!salary.annualCTC || salary.annualCTC <= 0) {
    issues.push({
      field: 'salary.annualCTC',
      severity: 'error',
      message: 'Annual CTC must be greater than zero.',
    })
  }

  if (salary.annualCTC < 250000) {
    issues.push({
      field: 'salary.annualCTC',
      severity: 'info',
      message: 'Income below ₹2.5L — no income tax liability under any regime.',
    })
  }

  // ── Salary structure plausibility ─────────────────────────────────────
  if (structure.basicSalary > 0) {
    const annualBasic = structure.basicSalary * 12
    if (annualBasic > salary.annualCTC) {
      issues.push({
        field: 'structure.basicSalary',
        severity: 'warning',
        message: `Monthly basic (₹${structure.basicSalary.toLocaleString('en-IN')}) × 12 exceeds annual CTC.`,
        suggestion: 'Check that basic salary is a monthly figure, not annual.',
      })
    }
    if (annualBasic < salary.annualCTC * 0.2) {
      issues.push({
        field: 'structure.basicSalary',
        severity: 'info',
        message: 'Basic salary is less than 20% of CTC — verify your pay slip.',
      })
    }
  }

  // ── HRA consistency ───────────────────────────────────────────────────
  if (life.isRenting && structure.monthlyRent === 0) {
    issues.push({
      field: 'structure.monthlyRent',
      severity: 'warning',
      message: 'You marked yourself as renting but entered ₹0 rent.',
      suggestion: 'Enter your actual monthly rent to claim HRA exemption.',
    })
  }
  if (!life.isRenting && structure.hra > 0) {
    issues.push({
      field: 'life.isRenting',
      severity: 'info',
      message: `You have an HRA component of ₹${structure.hra.toLocaleString('en-IN')}/month but didn't mark yourself as renting.`,
      suggestion: 'Toggle "Currently Renting" to claim HRA exemption.',
    })
  }

  // ── EPF plausibility ──────────────────────────────────────────────────
  if (investments.epfEmployee > 0 && structure.basicSalary > 0) {
    const maxEPF = structure.basicSalary * 12 * 0.12
    if (investments.epfEmployee > maxEPF * 1.1) { // 10% tolerance
      issues.push({
        field: 'investments.epfEmployee',
        severity: 'warning',
        message: `EPF contribution of ₹${investments.epfEmployee.toLocaleString('en-IN')} seems higher than 12% of annual basic.`,
        suggestion: 'EPF is usually 12% of basic salary. Check your pay slip.',
      })
    }
  }

  // ── 80C limit awareness ───────────────────────────────────────────────
  const raw80C = investments.ppfAnnual + investments.licPremiumAnnual + investments.elssAnnual +
    investments.nscAnnual + investments.ssyAnnual + investments.tuitionFees +
    investments.epfEmployee + investments.otherSection80C + (life.homeLoanPrincipalAnnual || 0)
  if (raw80C > 150000 * 1.5) {
    issues.push({
      field: 'investments',
      severity: 'info',
      message: '80C investments exceed ₹1.5L limit — only ₹1,50,000 is deductible regardless of total invested.',
    })
  }

  // ── NPS limit ─────────────────────────────────────────────────────────
  if (investments.npsEmployee > 50000) {
    issues.push({
      field: 'investments.npsEmployee',
      severity: 'info',
      message: 'Employee NPS deduction under 80CCD(1B) is capped at ₹50,000.',
      suggestion: 'Only ₹50,000 will be used for deduction even if you contribute more.',
    })
  }

  // ── Home loan checks ──────────────────────────────────────────────────
  if (life.hasHomeLoan && life.homeLoanInterestAnnual === 0 && life.homeLoanPrincipalAnnual === 0) {
    issues.push({
      field: 'life.homeLoan',
      severity: 'warning',
      message: 'Home loan is marked as active but no interest or principal amount entered.',
      suggestion: 'Enter your annual home loan interest (for Section 24b) and principal (for 80C).',
    })
  }
  if (life.homeLoanInterestAnnual > 200000 && life.propertyType !== 'Let-out') {
    issues.push({
      field: 'life.homeLoanInterestAnnual',
      severity: 'info',
      message: `Home loan interest of ₹${life.homeLoanInterestAnnual.toLocaleString('en-IN')} exceeds ₹2L limit for self-occupied property.`,
      suggestion: 'Only ₹2,00,000 is deductible under Section 24b unless the property is let-out.',
    })
  }

  // ── Employer NPS ──────────────────────────────────────────────────────
  if (employer.hasEmployerNPS && employer.employerNPSPercent === 0 && (employer.employerNPSMonthly || 0) === 0) {
    issues.push({
      field: 'employer.employerNPSMonthly',
      severity: 'warning',
      message: 'Employer NPS is enabled but no amount or percentage is entered.',
    })
  }
  if (employer.employerNPSPercent > 14) {
    issues.push({
      field: 'employer.employerNPSPercent',
      severity: 'warning',
      message: 'Employer NPS contribution exceeding 14% of basic is not deductible under 80CCD(2).',
      suggestion: 'Only the 14% portion will be treated as a deduction.',
    })
  }

  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    issues,
  }
}
