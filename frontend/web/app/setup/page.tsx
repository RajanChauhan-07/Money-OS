'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  IndianRupee,
  Building2,
  Home,
  Heart,
  PiggyBank,
  Check,
  Sparkles,
  Upload,
  FileText
} from 'lucide-react'
import { Button } from '@money-os/ui'
import { useTaxStore } from '@/lib/stores/tax-store'
import type { Form16DerivedProfile } from '@money-os/types'
import { cn } from '@/lib/utils'

/* ── tiny form primitives ── */

function NumberInput({
  label,
  value,
  onChange,
  hint,
  prefix = '₹',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
  prefix?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">{prefix}</span>
        )}
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={cn(
            "w-full h-11 rounded-xl border border-white/10 bg-white/[0.03] pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/20",
            prefix ? "pl-8" : "pl-3"
          )}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{hint}</p>}
    </div>
  )
}

function ToggleInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
        {hint && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-7 w-12 rounded-full border transition-all duration-300 shrink-0",
          value 
            ? "border-[var(--brand-secondary)] bg-[var(--brand-secondary)]" 
            : "border-white/10 bg-white/5"
        )}
      >
        <span className={cn(
          "absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-all duration-300",
          value ? "left-[24px]" : "left-0.5"
        )} />
      </button>
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/20"
      />
    </div>
  )
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/20"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-zinc-900 text-white">{opt}</option>
        ))}
      </select>
    </div>
  )
}

/* ── step definitions ── */

const STEPS = [
  { key: 'salary', label: 'Salary', icon: IndianRupee, description: 'Your annual compensation' },
  { key: 'employer', label: 'Employer', icon: Building2, description: 'Company and EPF details' },
  { key: 'housing', label: 'Housing', icon: Home, description: 'Rent, city, and home loans' },
  { key: 'health', label: 'Health & Medical', icon: Heart, description: 'Health insurance and medical' },
  { key: 'investments', label: 'Investments & More', icon: PiggyBank, description: '80C, NPS, and other deductions' },
] as const

type StepKey = (typeof STEPS)[number]['key']

const defaultProfile: Form16DerivedProfile = {
  salary: { annualCTC: 0, inHandMonthly: 0, variablePayPercent: 0 },
  structure: {
    basicSalary: 0, hra: 0, lta: 0, specialAllowance: 0, 
    otherAllowancesMonthly: 0, bonusAnnual: 0,
    isMetroCity: true, cityName: 'Mumbai', monthlyRent: 0,
  },
  employer: {
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
  },
  life: {
    isRenting: false, hasHomeLoan: false, 
    homeLoanInterestAnnual: 0, homeLoanPrincipalAnnual: 0,
    propertyType: 'Self-occupied',
    selfHealthPremium: 0, familyHealthPremium: 0, parentHealthPremium: 0,
    hasSeniorParents: false, dependentChildren: 0,
    hasDisabledDependent: false, disabilityType: 'normal', medicalTreatmentExpense: 0,
    educationLoanInterest: 0, section80EEInterest: 0, section80EEAInterest: 0, evLoanInterest: 0,
    donations100pct: 0, donations50pct: 0, section80GGRent: 0, savingsInterest: 0, depositInterest: 0,
    hasSelfDisability: false, selfDisabilityType: 'normal',
  },
  investments: {
    ppfAnnual: 0, licPremiumAnnual: 0, elssAnnual: 0, nscAnnual: 0,
    ssyAnnual: 0, tuitionFees: 0, epfEmployee: 0, npsEmployee: 0, otherSection80C: 0,
  },
  missedOpportunities: [],
}

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState<Form16DerivedProfile>(JSON.parse(JSON.stringify(defaultProfile)))
  const [isComputing, setIsComputing] = useState(false)

  const { setDerivedProfile, setTaxInput, buildTaxInputFromProfile, computeTax } = useTaxStore()

  const step = STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === STEPS.length - 1

  const updateSalary = (key: string, value: number) =>
    setProfile({ ...profile, salary: { ...profile.salary, [key]: value } })
  const updateStructure = (key: string, value: number | string | boolean) =>
    setProfile({ ...profile, structure: { ...profile.structure, [key]: value } })
  const updateEmployer = (key: string, value: string | number | boolean) =>
    setProfile({ ...profile, employer: { ...profile.employer, [key]: value } })
  const updateLife = (key: string, value: number | boolean | string) =>
    setProfile({ ...profile, life: { ...profile.life, [key]: value } })
  const updateInvestments = (key: string, value: number) =>
    setProfile({ ...profile, investments: { ...profile.investments, [key]: value } })

  // Auto-calculate basic and EPF from CTC when salary step changes
  const handleCTCChange = (ctc: number) => {
    updateSalary('annualCTC', ctc)
    // Auto-estimate structure from CTC if fields are empty
    if (profile.structure.basicSalary === 0 && ctc > 0) {
      const basic = Math.round(ctc * 0.4 / 12) // ~40% of CTC
      const hra = Math.round(basic * 0.5) // 50% of basic for metro
      const special = Math.round((ctc / 12) - basic - hra)
      setProfile(prev => ({
        ...prev,
        salary: { ...prev.salary, annualCTC: ctc, inHandMonthly: Math.round(ctc * 0.72 / 12) },
        structure: { ...prev.structure, basicSalary: basic, hra: hra, specialAllowance: Math.max(0, special) },
      }))
    }
  }

  const handleNext = () => {
    if (isLast) {
      handleCalculate()
    } else {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep === 0) {
      router.push('/')
    } else {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleCalculate = async () => {
    setIsComputing(true)
    setDerivedProfile(profile)
    const taxInput = buildTaxInputFromProfile(profile)
    setTaxInput(taxInput)
    await new Promise(r => setTimeout(r, 600))
    computeTax()
    router.push('/result')
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative z-20">


      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-[72px] pb-28">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => i <= currentStep && setCurrentStep(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                i === currentStep
                  ? "bg-[var(--brand-primary)] text-[var(--text-inverse)]"
                  : i < currentStep
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
              )}
            >
              {i < currentStep ? <Check size={14} /> : <s.icon size={14} />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Step Title */}
        <motion.div
          key={step.key}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{step.label}</h1>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="surface-panel p-8"
          >
            <div className="flex justify-between items-start md:items-center mb-8 flex-col md:flex-row gap-4 md:gap-0">
              <p className="text-[var(--text-secondary)] font-medium">{step.description}</p>
              {step.key === 'salary' && (
                <button
                  onClick={() => router.push('/upload')}
                  className="group flex items-center gap-1.5 text-xs font-bold tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors uppercase"
                >
                  <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                  Upload Form 16 instead
                </button>
              )}
            </div>
            {step.key === 'salary' && (
              <div className="grid gap-5 md:grid-cols-2">
                <NumberInput
                  label="Annual CTC"
                  value={profile.salary.annualCTC}
                  onChange={handleCTCChange}
                  hint="Your total cost-to-company for the year"
                />
                <NumberInput
                  label="In-hand per month"
                  value={profile.salary.inHandMonthly}
                  onChange={(v) => updateSalary('inHandMonthly', v)}
                  hint="Your monthly take-home after tax/PF"
                />
                <SelectInput
                  label="Age category"
                  value={profile.ageCategory || 'below60'}
                  onChange={(v) => setProfile({ ...profile, ageCategory: v as any })}
                  options={['below60', 'senior', 'superSenior']}
                  hint="Senior: 60+, Super Senior: 80+"
                />
                <NumberInput
                  label="Monthly basic salary"
                  value={profile.structure.basicSalary}
                  onChange={(v) => updateStructure('basicSalary', v)}
                  hint="Check your pay slip — this drives HRA and PF"
                />
                <NumberInput
                  label="Monthly HRA"
                  value={profile.structure.hra}
                  onChange={(v) => updateStructure('hra', v)}
                />
                <NumberInput
                  label="Monthly special allowance"
                  value={profile.structure.specialAllowance}
                  onChange={(v) => updateStructure('specialAllowance', v)}
                />
                <NumberInput
                  label="Monthly LTA"
                  value={profile.structure.lta}
                  onChange={(v) => updateStructure('lta', v)}
                />
                <NumberInput
                  label="Other allowances (monthly)"
                  value={profile.structure.otherAllowancesMonthly}
                  onChange={(v) => updateStructure('otherAllowancesMonthly', v)}
                  hint="fuel, telephone, etc."
                />
                <NumberInput
                  label="Annual bonus / incentive"
                  value={profile.structure.bonusAnnual}
                  onChange={(v) => updateStructure('bonusAnnual', v)}
                  hint="performance bonus, TPP"
                />
                <NumberInput
                  label="Professional Tax (monthly)"
                  value={profile.structure.professionalTaxMonthly}
                  onChange={(v) => updateStructure('professionalTaxMonthly', v)}
                  hint="Usually ₹200"
                />
              </div>
            )}

            {step.key === 'employer' && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <TextInput
                    label="Company name"
                    value={profile.employer.companyName}
                    onChange={(v) => updateEmployer('companyName', v)}
                  />
                </div>
                <SelectInput
                  label="Employer type"
                  value={profile.employer.employerType}
                  onChange={(v) => updateEmployer('employerType', v)}
                  options={['Private', 'Government', 'PSU']}
                />
                <div className="md:col-span-2">
                  <ToggleInput
                    label="EPF applicable"
                    value={profile.employer.isEPFApplicable}
                    onChange={(v) => updateEmployer('isEPFApplicable', v)}
                    hint="Does your employer deduct EPF from your salary?"
                  />
                </div>
                {profile.employer.isEPFApplicable && (
                  <>
                    <NumberInput
                      label="EPF monthly deduction (₹)"
                      value={profile.employer.epfEmployeeMonthly}
                      onChange={(v) => {
                        updateEmployer('epfEmployeeMonthly', v)
                        updateInvestments('epfEmployee', v * 12)
                      }}
                      hint="Check your payslip"
                    />
                    <NumberInput
                      label="Employer EPF monthly (₹)"
                      value={profile.employer.epfEmployerMonthly}
                      onChange={(v) => updateEmployer('epfEmployerMonthly', v)}
                      hint="Optional, for reference"
                    />
                  </>
                )}
                <div className="md:col-span-2">
                  <ToggleInput
                    label="Employer provides NPS (80CCD2)"
                    value={profile.employer.hasEmployerNPS}
                    onChange={(v) => updateEmployer('hasEmployerNPS', v)}
                    hint="Some companies contribute to NPS under 80CCD(2)"
                  />
                </div>
                {profile.employer.hasEmployerNPS && (
                  <NumberInput
                    label="Monthly NPS contribution by employer (₹)"
                    value={profile.employer.employerNPSMonthly}
                    onChange={(v) => updateEmployer('employerNPSMonthly', v)}
                  />
                )}
              </div>
            )}

            {step.key === 'housing' && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <ToggleInput
                    label="Currently renting"
                    value={profile.life.isRenting}
                    onChange={(v) => updateLife('isRenting', v)}
                  />
                </div>
                {profile.life.isRenting && (
                  <>
                    <NumberInput
                      label="Monthly rent paid (₹)"
                      value={profile.structure.monthlyRent}
                      onChange={(v) => updateStructure('monthlyRent', v)}
                    />
                    <SelectInput
                      label="City type"
                      value={profile.structure.isMetroCity ? 'Metro' : 'Non-metro'}
                      onChange={(v) => {
                        updateStructure('isMetroCity', v === 'Metro')
                      }}
                      options={['Metro', 'Non-metro']}
                      hint="Mumbai, Delhi, Kolkata, Chennai = metro"
                    />
                    {!profile.structure.hra && (
                      <NumberInput
                        label="Monthly Rent (u/s 80GG)"
                        value={profile.life.section80GGRent || 0}
                        onChange={(v) => updateLife('section80GGRent', v)}
                        hint="Claimable if you don't receive HRA"
                      />
                    )}
                  </>
                )}
                <div className="md:col-span-2">
                  <ToggleInput
                    label="Have a home loan"
                    value={profile.life.hasHomeLoan}
                    onChange={(v) => updateLife('hasHomeLoan', v)}
                  />
                </div>
                {profile.life.hasHomeLoan && (
                  <>
                    <NumberInput
                      label="Annual interest paid (₹)"
                      value={profile.life.homeLoanInterestAnnual}
                      onChange={(v) => updateLife('homeLoanInterestAnnual', v)}
                      hint="Section 24b, max ₹2L for self-occupied"
                    />
                    <NumberInput
                      label="Annual principal repaid (₹)"
                      value={profile.life.homeLoanPrincipalAnnual}
                      onChange={(v) => updateLife('homeLoanPrincipalAnnual', v)}
                      hint="Counts under 80C limit"
                    />
                    <SelectInput
                      label="Property status"
                      value={profile.life.propertyType}
                      onChange={(v) => updateLife('propertyType', v)}
                      options={['Self-occupied', 'Let-out', 'Under construction']}
                    />
                  </>
                )}
                
                <div className="md:col-span-2 pt-4 border-t border-white/5 mt-2">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Other Loans</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <NumberInput
                      label="Education loan interest (80E)"
                      value={profile.life.educationLoanInterest || 0}
                      onChange={(v) => updateLife('educationLoanInterest', v)}
                      hint="No upper limit"
                    />
                    <NumberInput
                      label="EV loan interest (80EEB)"
                      value={profile.life.evLoanInterest || 0}
                      onChange={(v) => updateLife('evLoanInterest', v)}
                      hint="Max ₹1.5L (loans sanctioned by Mar 2023)"
                    />
                  </div>
                </div>
              </div>
            )}

            {step.key === 'health' && (
              <div className="grid gap-5 md:grid-cols-2">
                <NumberInput
                  label="Self/family health premium"
                  value={profile.life.selfHealthPremium}
                  onChange={(v) => updateLife('selfHealthPremium', v)}
                  hint="Max ₹25,000 deduction under 80D"
                />
                <NumberInput
                  label="Parents health premium"
                  value={profile.life.parentHealthPremium}
                  onChange={(v) => updateLife('parentHealthPremium', v)}
                  hint="Max ₹25K (or ₹50K if senior citizen)"
                />
                <div className="md:col-span-2">
                  <ToggleInput
                    label="Parents are senior citizens (60+)"
                    value={profile.life.hasSeniorParents}
                    onChange={(v) => updateLife('hasSeniorParents', v)}
                    hint="Increases 80D limit from ₹25K to ₹50K for parents"
                  />
                </div>
                <NumberInput
                  label="Dependent children"
                  value={profile.life.dependentChildren}
                  onChange={(v) => updateLife('dependentChildren', v)}
                  prefix=""
                  hint="For tuition fee deduction under 80C"
                />
                
                <div className="md:col-span-2 pt-4 border-t border-[var(--border-subtle)] mt-2">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Special Medical & Disability</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <NumberInput
                      label="Specified Medical Treatment (80DDB)"
                      value={profile.life.medicalTreatmentExpense || 0}
                      onChange={(v) => updateLife('medicalTreatmentExpense', v)}
                      hint="For specific critical illnesses"
                    />
                    <div className="space-y-4">
                      <ToggleInput
                        label="Disabled Dependent (80DD)"
                        value={profile.life.hasDisabledDependent || false}
                        onChange={(v) => updateLife('hasDisabledDependent', v)}
                      />
                      {profile.life.hasDisabledDependent && (
                        <SelectInput
                          label="Disability severity"
                          value={profile.life.disabilityType || 'normal'}
                          onChange={(v) => updateLife('disabilityType', v)}
                          options={['normal', 'severe']}
                          hint="Normal = ₹75,000 | Severe = ₹1,25,000"
                        />
                      )}
                    </div>
                    <div className="space-y-4">
                      <ToggleInput
                        label="Self Disability (80U)"
                        value={profile.life.hasSelfDisability || false}
                        onChange={(v) => updateLife('hasSelfDisability', v)}
                      />
                      {profile.life.hasSelfDisability && (
                        <SelectInput
                          label="Disability type"
                          value={profile.life.selfDisabilityType || 'normal'}
                          onChange={(v) => updateLife('selfDisabilityType', v)}
                          options={['normal', 'severe']}
                          hint="Normal (40%+) / Severe (80%+)"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step.key === 'investments' && (
              <div className="grid gap-5 md:grid-cols-2">
                <NumberInput
                  label="EPF employee (annual)"
                  value={profile.investments.epfEmployee}
                  onChange={(v) => updateInvestments('epfEmployee', v)}
                  hint="Auto-deducted from salary — counts in 80C"
                />
                <NumberInput
                  label="NSC (annual)"
                  value={profile.investments.nscAnnual}
                  onChange={(v) => updateInvestments('nscAnnual', v)}
                  hint="National Savings Certificate"
                />
                <NumberInput
                  label="ELSS mutual funds (annual)"
                  value={profile.investments.elssAnnual}
                  onChange={(v) => updateInvestments('elssAnnual', v)}
                  hint="Tax-saving funds with 3-year lock-in"
                />
                <NumberInput
                  label="Tax-saving FD (annual)"
                  value={profile.investments.taxSavingFDAnnual}
                  onChange={(v) => updateInvestments('taxSavingFDAnnual', v)}
                  hint="5-year bank fixed deposit"
                />
                <NumberInput
                  label="PPF (annual)"
                  value={profile.investments.ppfAnnual}
                  onChange={(v) => updateInvestments('ppfAnnual', v)}
                />
                {profile.ageCategory !== 'below60' && (
                  <NumberInput
                    label="SCSS (annual)"
                    value={profile.investments.scssAnnual}
                    onChange={(v) => updateInvestments('scssAnnual', v)}
                    hint="Senior Citizen Savings Scheme"
                  />
                )}
                <NumberInput
                  label="LIC premium (annual)"
                  value={profile.investments.licPremiumAnnual}
                  onChange={(v) => updateInvestments('licPremiumAnnual', v)}
                />
                <NumberInput
                  label="NPS employee contribution"
                  value={profile.investments.npsEmployee}
                  onChange={(v) => updateInvestments('npsEmployee', v)}
                  hint="Extra ₹50K deduction under 80CCD(1B)"
                />
                <NumberInput
                  label="Tuition fees"
                  value={profile.investments.tuitionFees}
                  onChange={(v) => updateInvestments('tuitionFees', v)}
                  hint="For up to 2 children — counts in 80C"
                />
                
                <div className="md:col-span-2 pt-4 border-t border-[var(--border-subtle)] mt-2">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Other Deductions</h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    {profile.ageCategory === 'below60' ? (
                      <NumberInput
                        label="Savings Account Interest (80TTA)"
                        value={profile.life.savingsInterest}
                        onChange={(v) => updateLife('savingsInterest', v)}
                        hint="Up to ₹10K deduction"
                      />
                    ) : (
                      <NumberInput
                        label="Senior Deposit Interest (80TTB)"
                        value={profile.life.depositInterest}
                        onChange={(v) => updateLife('depositInterest', v)}
                        hint="Up to ₹50K deduction for senior citizens"
                      />
                    )}
                    <div />
                    <NumberInput
                      label="Donations - 100% Eligible (80G)"
                      value={profile.life.donations100pct}
                      onChange={(v) => updateLife('donations100pct', v)}
                      hint="E.g., PM CARES, National Relief Fund"
                    />
                    <NumberInput
                      label="Donations - 50% Eligible (80G)"
                      value={profile.life.donations50pct}
                      onChange={(v) => updateLife('donations50pct', v)}
                      hint="Other approved charitable institutions"
                    />
                  </div>
                </div>

                {/* 80C summary */}
                {(() => {
                  const total80C = profile.investments.epfEmployee + profile.investments.elssAnnual +
                    profile.investments.ppfAnnual + profile.investments.licPremiumAnnual +
                    profile.investments.nscAnnual + profile.investments.taxSavingFDAnnual +
                    (profile.investments.scssAnnual || 0) + profile.investments.ssyAnnual +
                    profile.investments.tuitionFees + profile.investments.otherSection80C +
                    (profile.life.homeLoanPrincipalAnnual || 0)
                  const pct = Math.min(100, Math.round((total80C / 150000) * 100))
                  return (
                    <div className="md:col-span-2 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[var(--text-secondary)]">80C usage</span>
                        <span className="font-semibold text-[var(--text-primary)]">₹{(total80C / 1000).toFixed(0)}K / ₹1.5L</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-base)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-[var(--brand-primary)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {total80C < 150000 && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">
                          ₹{((150000 - total80C) / 1000).toFixed(0)}K headroom remaining
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-md border-t border-[var(--border-subtle)] p-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 0 ? 'Home' : 'Back'}
            </button>
            <div className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
            >
              Dashboard
            </button>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <p className="text-sm text-[var(--text-secondary)] hidden md:block">
              {step.description}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={handleNext}
              className="px-10 group"
            >
              {currentStep === STEPS.length - 1 ? (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Calculate & Compare
                </>
              ) : (
                <>
                  Next
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
