import { Form16Extraction } from '@money-os/types'

export async function parseForm16Local(text: string): Promise<Form16Extraction> {
  const extraction: Form16Extraction = {
    employerName: "unknown",
    employerTAN: "unknown",
    employeeName: "unknown",
    employeePAN: "unknown",
    financialYear: "unknown",
    assessmentYear: "unknown",
    totalSalaryPaid: 0,
    totalTDSDeducted: 0,
    totalTDSDeposited: 0,
    quarterlyTDS: {
      q1: { salaryPaid: 0, tdsDeducted: 0 },
      q2: { salaryPaid: 0, tdsDeducted: 0 },
      q3: { salaryPaid: 0, tdsDeducted: 0 },
      q4: { salaryPaid: 0, tdsDeducted: 0 }
    },
    grossSalary: 0,
    salaryComponents: {
      basicSalary: 0,
      hra: 0,
      specialAllowance: 0,
      lta: 0,
      perquisites: 0,
      otherAllowances: 0
    },
    standardDeduction: 50000,
    professionalTax: 0,
    hraExemptionClaimed: 0,
    section80C: 0,
    section80C_eligible: 0,
    epf_contribution: 0,
    section80D: 0,
    section80CCD1: 0,
    section80CCD1B: 0,
    section80CCD2: 0,
    section24b: 0,
    otherChapterVIA: 0,
    netTaxableIncome: 0,
    taxOnTotalIncome: 0,
    rebateUnder87A: 0,
    surcharge: 0,
    educationCess: 0,
    totalTaxPayable: 0,
    regimeChosen: "unknown",
    refundOrDue: 0,
    confidence: 70
  }

  // Regex Helpers
  const extractAmount = (regex: RegExp): number => {
    const match = text.match(regex)
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''))
    }
    return 0
  }

  // Basic Heuristic Extraction
  extraction.employeePAN = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/)?.[0] || "unknown"
  extraction.employerTAN = text.match(/[A-Z]{4}[0-9]{5}[A-Z]{1}/)?.[0] || "unknown"
  
  // Assessment Year
  const ayMatch = text.match(/Assessment Year\s*([0-9]{4}-[0-9]{2,4})/i)
  if (ayMatch) extraction.assessmentYear = ayMatch[1]

  // Financial Year
  const fyMatch = text.match(/Financial Year\s*([0-9]{4}-[0-9]{2,4})/i)
  if (fyMatch) extraction.financialYear = fyMatch[1]

  // Gross Salary
  extraction.grossSalary = extractAmount(/Gross Salary\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i) || 
                          extractAmount(/Total amount of salary\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i)

  // Standard Deduction
  extraction.standardDeduction = extractAmount(/Standard [Dd]eduction\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i) || 50000

  // 80C
  extraction.section80C = extractAmount(/Section 80C\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i) ||
                         extractAmount(/Deduction in respect of life insurance\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i)

  // 80D
  extraction.section80D = extractAmount(/Section 80D\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i) ||
                         extractAmount(/Health insurance [Pp]remium\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i)

  // Total Tax
  extraction.totalTaxPayable = extractAmount(/Total [Tt]ax [Pp]ayable\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i)
  extraction.totalTDSDeducted = extractAmount(/Total amount of tax deducted\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i)

  // Net Taxable Income
  extraction.netTaxableIncome = extractAmount(/Net Taxable Income\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i) ||
                               extractAmount(/Total Income\s*(?:Rs\.\s*)?([\d,]+\.?\d*)/i)

  // Regime Inference
  if (text.toLowerCase().includes('115bac') || text.toLowerCase().includes('new tax regime')) {
    extraction.regimeChosen = 'new'
  } else if (extraction.section80C > 0 || extraction.section80D > 0) {
    extraction.regimeChosen = 'old'
  }

  // Calculate Refund/Due
  extraction.refundOrDue = extraction.totalTDSDeducted - extraction.totalTaxPayable

  return extraction
}
