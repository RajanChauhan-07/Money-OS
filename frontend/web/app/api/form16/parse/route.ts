import { NextRequest, NextResponse } from 'next/server'
import type { Form16Extraction, Form16DerivedProfile, MissedOpportunity } from '@money-os/types'
import { PDFParse } from 'pdf-parse'
import { parseForm16Local } from '@/lib/form16-parser'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `You are an expert Indian tax document parser. You will receive a Form 16 PDF (TDS certificate issued by employers in India). 

Extract ALL the following fields with precision. If a field is not found, use 0 for numbers and "unknown" for strings.

Return a JSON object with EXACTLY this structure:

{
  "employerName": "string",
  "employerTAN": "string",
  "employeeName": "string",
  "employeePAN": "string",
  "financialYear": "string (e.g. 2024-25)",
  "assessmentYear": "string (e.g. 2025-26)",
  "totalSalaryPaid": number,
  "totalTDSDeducted": number,
  "totalTDSDeposited": number,
  "quarterlyTDS": {
    "q1": { "salaryPaid": number, "tdsDeducted": number },
    "q2": { "salaryPaid": number, "tdsDeducted": number },
    "q3": { "salaryPaid": number, "tdsDeducted": number },
    "q4": { "salaryPaid": number, "tdsDeducted": number }
  },
  "grossSalary": number,
  "salaryComponents": {
    "basicSalary": number (annual),
    "hra": number (annual),
    "specialAllowance": number (annual),
    "lta": number (annual),
    "perquisites": number (annual),
    "otherAllowances": number (annual)
  },
  "standardDeduction": number,
  "professionalTax": number,
  "hraExemptionClaimed": number,
  "section80C": number, // Actual amount claimed under 80C (capped at 1.5L)
  "section80C_eligible": number, // Total gross amount invested/eligible under 80C (before 1.5L cap)
  "epf_contribution": number, // Employee's PF contribution amount
  "section80D": number,
  "section80CCD1": number,
  "section80CCD1B": number,
  "section80CCD2": number,
  "section24b": number,
  "otherChapterVIA": number,
  "netTaxableIncome": number,
  "taxOnTotalIncome": number,
  "rebateUnder87A": number,
  "surcharge": number,
  "educationCess": number,
  "totalTaxPayable": number,
  "regimeChosen": "old" or "new" or "unknown",
  "refundOrDue": number (positive means refund to employee, negative means tax due),
  "confidence": number (0-100, your confidence in the extraction accuracy)
}

IMPORTANT:
- All monetary values must be ANNUAL amounts in INR (not monthly).
- basicSalary, hra, specialAllowance etc. in salaryComponents should be ANNUAL totals.
- If the document shows monthly values, multiply by 12.
- regimeChosen: Look for any mention of "new tax regime" or "section 115BAC" or "opted for new regime" → "new". Look for "old regime" → "old". If not explicitly mentioned, infer from deductions: if 80C and HRA are 0 but standard deduction is present, it's likely "new". Otherwise "old".
- refundOrDue: Carefully calculate totalTaxPayable - totalTDSDeducted. If totalTaxPayable > TDS, it's negative (due). If TDS > totalTaxPayable, positive (refund).
- confidence: rate how complete and clear the document was for extraction.
`

// Derive a planning profile from the raw extraction (Keep existing logic)
function deriveProfileFromForm16(extraction: Form16Extraction): Form16DerivedProfile {
  const annualCTC = extraction.grossSalary
  const basicAnnual = extraction.salaryComponents.basicSalary
  const hraAnnual = extraction.salaryComponents.hra
  const specialAnnual = extraction.salaryComponents.specialAllowance
  const ltaAnnual = extraction.salaryComponents.lta
  const otherAnnual = extraction.salaryComponents.otherAllowances + extraction.salaryComponents.perquisites

  const basicMonthly = Math.round(basicAnnual / 12)
  const hraMonthly = Math.round(hraAnnual / 12)
  const ltaMonthly = Math.round(ltaAnnual / 12)
  const specialMonthly = Math.round(specialAnnual / 12)
  const otherMonthly = Math.round(otherAnnual / 12)

  const epfAnnual = extraction.epf_contribution || Math.round(basicAnnual * 0.12)
  const isRenting = extraction.hraExemptionClaimed > 0
  const estimatedMonthlyRent = isRenting ? Math.round(extraction.hraExemptionClaimed / 12 * 1.3) : 0

  const hraRatio = basicAnnual > 0 ? hraAnnual / basicAnnual : 0
  const isMetroCity = hraRatio >= 0.45
  const hasHomeLoan = extraction.section24b > 0
  const intentional80C = Math.max(0, extraction.section80C - epfAnnual)

  const missedOpportunities: MissedOpportunity[] = []
  const _80cGap = 150000 - extraction.section80C
  if (_80cGap > 10000) {
    missedOpportunities.push({
      section: '80C',
      description: `You used only ₹${(extraction.section80C / 1000).toFixed(0)}K of the ₹1.5L limit.`,
      potentialSaving: Math.round(_80cGap * 0.312),
      action: `Invest ₹${(_80cGap / 1000).toFixed(0)}K more in ELSS, PPF, or increase VPF.`,
    })
  }

  if (extraction.section80CCD1B === 0) {
    missedOpportunities.push({
      section: '80CCD(1B)',
      description: 'You didn\'t claim the additional ₹50,000 NPS deduction outside of 80C.',
      potentialSaving: 15600,
      action: 'Invest ₹50,000 in NPS Tier 1 for an extra ₹15,600 tax saving.',
    })
  }

  if (extraction.section80D < 50000) {
    const _80dGap = 50000 - extraction.section80D
    missedOpportunities.push({
      section: '80D',
      description: `Your health insurance deduction was ₹${(extraction.section80D / 1000).toFixed(0)}K. You could claim up to ₹50K (self + parents).`,
      potentialSaving: Math.round(_80dGap * 0.312),
      action: 'Consider health insurance for parents (₹25K-50K additional deduction).',
    })
  }

  // TDS Reconciliation Check
  if (extraction.refundOrDue < 0) {
    missedOpportunities.push({
      section: 'TDS Shortfall',
      description: `Your employer deducted less TDS than your actual tax liability. You have a tax due of ₹${Math.abs(extraction.refundOrDue).toLocaleString('en-IN')}.`,
      potentialSaving: 0,
      action: 'Pay advance tax or self-assessment tax immediately to avoid Section 234B/234C interest penalties.',
    })
  } else if (extraction.refundOrDue > 0) {
    missedOpportunities.push({
      section: 'Excess TDS',
      description: `Your employer deducted excess TDS. You are eligible for a refund of ₹${extraction.refundOrDue.toLocaleString('en-IN')}.`,
      potentialSaving: extraction.refundOrDue,
      action: 'File your ITR on time to claim this refund from the Income Tax Department.',
    })
  }

  return {
    salary: {
      annualCTC: annualCTC,
      inHandMonthly: Math.round((annualCTC - extraction.totalTDSDeducted) / 12),
      variablePayPercent: 0,
    },
    structure: {
      basicSalary: basicMonthly,
      hra: hraMonthly,
      lta: ltaMonthly,
      specialAllowance: specialMonthly,
      otherAllowances: otherMonthly,
      isMetroCity,
      cityName: isMetroCity ? 'Metro City' : 'Non-Metro',
      monthlyRent: estimatedMonthlyRent,
    },
    employer: {
      companyName: extraction.employerName,
      epfEmployeePercent: 12,
      epfEmployerPercent: 12,
      hasEmployerNPS: extraction.section80CCD2 > 0,
      employerNPSPercent: extraction.section80CCD2 > 0 ? Math.round((extraction.section80CCD2 / annualCTC) * 100) : 0,
    },
    life: {
      isRenting,
      hasHomeLoan,
      homeLoanInterestAnnual: extraction.section24b,
      homeLoanPrincipalAnnual: 0,
      selfHealthPremium: Math.min(extraction.section80D, 25000),
      familyHealthPremium: 0,
      parentHealthPremium: Math.max(0, extraction.section80D - 25000),
      hasSeniorParents: false,
      dependentChildren: 0,
      hasDisabledDependent: false,
      disabilityType: 'normal',
      medicalTreatmentExpense: 0,
      educationLoanInterest: 0,
      section80EEInterest: 0,
      section80EEAInterest: 0,
      evLoanInterest: 0,
      donations100pct: 0,
      donations50pct: 0,
      section80GGRent: 0,
      savingsInterest: 0,
      depositInterest: 0,
      hasSelfDisability: false,
      selfDisabilityType: 'normal',
    },
    investments: {
      ppfAnnual: 0,
      licPremiumAnnual: 0,
      elssAnnual: intentional80C,
      nscAnnual: 0,
      ssyAnnual: 0,
      tuitionFees: 0,
      epfEmployee: epfAnnual,
      npsEmployee: extraction.section80CCD1B,
      otherSection80C: 0,
    },
    missedOpportunities,
  }
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to Buffer for PDFParse
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    console.log(`[Parse] Attempting local rule-based parsing first...`)
    let extraction: Form16Extraction | null = null
    let localErrorOccurred = false
    
    try {
      const parser = new PDFParse({ data: buffer })
      const pdfData = await parser.getText()
      extraction = await parseForm16Local(pdfData.text)
      await parser.destroy()
      console.log(`[Parse] Local parsing successful (Confidence: ${extraction.confidence}%)`)
    } catch (localError) {
      console.warn(`[Parse] Local parsing failed, falling back to Gemini...`, localError)
      localErrorOccurred = true
    }

    // If local parsing was insufficient (e.g. couldn't find gross salary) and Gemini key is available, try Gemini
    if (!extraction || extraction.grossSalary === 0 || localErrorOccurred) {
      if (!GEMINI_API_KEY) {
        if (extraction && extraction.grossSalary > 0) {
          console.warn(`[Parse] Gemini key missing, but local extraction has some data. Proceeding with local.`)
        } else {
          return NextResponse.json(
            { error: 'Gemini API key not configured and local parsing failed to find key data.' },
            { status: 500 }
          )
        }
      } else {
        console.log(`[Parse] Local results insufficient. Calling Native Gemini API (${GEMINI_MODEL}) for PDF parsing...`)
        
        let apiResponse;
        let lastError;
        
        // Retry logic (3 attempts)
        for (let i = 0; i < 3; i++) {
          try {
            apiResponse = await fetch(GEMINI_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: SYSTEM_PROMPT },
                    { text: "Extract data from this Form 16 PDF. Return only the JSON." },
                    {
                      inline_data: {
                        mime_type: "application/pdf",
                        data: base64
                      }
                    }
                  ]
                }]
              })
            })
            
            if (apiResponse.ok) break;
            
            const err = await apiResponse.text();
            console.warn(`[Parse] Gemini attempt ${i+1} failed:`, err);
            lastError = err;
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
          } catch (e) {
            console.warn(`[Parse] Gemini attempt ${i+1} threw:`, e);
            lastError = e;
          }
        }

        if (apiResponse && apiResponse.ok) {
          const apiData = await apiResponse.json()
          const rawText = apiData.candidates?.[0]?.content?.parts?.[0]?.text
          
          if (rawText) {
            const cleanedText = rawText
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim()

            try {
              extraction = JSON.parse(cleanedText)
              console.log(`[Parse] Gemini parsing successful.`)
            } catch (pErr) {
              console.error('Failed to parse Gemini response JSON:', pErr)
            }
          }
        } else if (!extraction || extraction.grossSalary === 0) {
          console.error(`[Parse] Gemini API final failure and no local fallback available.`, lastError)
          return NextResponse.json(
            { error: 'AI parsing failed and local parsing was insufficient. Please check document format.' },
            { status: 502 }
          )
        }
      }
    }

    if (!extraction) {
      return NextResponse.json({ error: 'Failed to extract any data from the PDF.' }, { status: 422 })
    }

    const derivedProfile = deriveProfileFromForm16(extraction)

    return NextResponse.json({
      extraction,
      derivedProfile,
      missedOpportunities: derivedProfile.missedOpportunities,
    })
  } catch (error) {
    console.error('Form 16 parse error:', error)
    return NextResponse.json(
      { error: 'Internal server error during parsing.' },
      { status: 500 }
    )
  }
}
