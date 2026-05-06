'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  IndianRupee,
  Building2,
  Home,
  Heart,
  PiggyBank,
} from 'lucide-react'
import { Button } from '@money-os/ui'
import { useTaxStore } from '@/lib/stores/tax-store'
import { formatRupee } from '@/lib/utils/format'
import type { Form16DerivedProfile } from '@money-os/types'
import { validateTaxInput } from '@money-os/tax-engine'
import { cn } from '@/lib/utils'

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
            "w-full h-11 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] pr-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20",
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
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-7 w-12 rounded-full border transition-all",
          value ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]" : "border-[var(--border-default)] bg-[var(--bg-elevated)]"
        )}
      >
        <span className={cn(
          "absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white transition-all",
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
        className="w-full h-11 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="surface-panel p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
          <Icon size={20} className="text-[var(--brand-primary)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  )
}

export default function ReviewPage() {
  const router = useRouter()
  const {
    derivedProfile,
    form16Extraction,
    missedOpportunities,
    setTaxInput,
    buildTaxInputFromProfile,
    computeTax,
  } = useTaxStore()

  // Local editable state, initialized from the derived profile
  const [profile, setProfile] = useState<Form16DerivedProfile | null>(null)
  const [isComputing, setIsComputing] = useState(false)
  const investmentIntent = useTaxStore(s => s.investmentIntent)

  useEffect(() => {
    if (derivedProfile) {
      setProfile(JSON.parse(JSON.stringify(derivedProfile))) // deep clone
    } else {
      // No data — redirect to upload
      router.push('/upload')
    }
  }, [derivedProfile, router])

  if (!profile) return null

  const updateSalary = (key: keyof typeof profile.salary, value: number) => {
    setProfile({ ...profile, salary: { ...profile.salary, [key]: value } })
  }
  const updateStructure = (key: keyof typeof profile.structure, value: number | string | boolean) => {
    let newStructure = { ...profile.structure, [key]: value }
    if (key === 'cityName') {
      const city = String(value).toLowerCase().trim()
      if (['mumbai', 'delhi', 'new delhi', 'kolkata', 'chennai'].includes(city)) {
        newStructure.isMetroCity = true
      }
    }
    setProfile({ ...profile, structure: newStructure })
  }
  const updateEmployer = (key: keyof typeof profile.employer, value: string | number | boolean) => {
    setProfile({ ...profile, employer: { ...profile.employer, [key]: value } })
  }
  const updateLife = (key: keyof typeof profile.life, value: number | boolean) => {
    setProfile({ ...profile, life: { ...profile.life, [key]: value } })
  }
  const updateInvestments = (key: keyof typeof profile.investments, value: number) => {
    setProfile({ ...profile, investments: { ...profile.investments, [key]: value } })
  }

  // Live validation
  const currentInput = buildTaxInputFromProfile(profile)
  const validation = validateTaxInput(currentInput)
  const hasErrors = validation.issues.some(w => w.severity === 'error')

  const handleCalculate = async () => {
    if (hasErrors) return // Block calculate if there are high severity errors
    setIsComputing(true)
    // Build TaxInput from the (potentially edited) profile
    setTaxInput(currentInput)
    // Small delay for the animation
    await new Promise(r => setTimeout(r, 600))
    computeTax()
    router.push('/result')
  }

  return (
    <div className="min-h-screen flex flex-col relative z-20">
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-[72px] pb-24">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--success)]/20 bg-[var(--success-bg)] px-4 py-1.5 mb-4">
            <CheckCircle2 size={14} className="text-[var(--success)]" />
            <span className="text-xs font-semibold text-[var(--success)]">
              {form16Extraction?.confidence ? `${form16Extraction.confidence}% confidence` : 'Extracted successfully'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
            Review and adjust for this year
          </h1>
          <p className="text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            We pre-filled everything from your Form 16. Update anything that changed this year — salary hike, new rent, different investments — then we'll calculate both regimes.
          </p>
        </motion.div>

        {/* Investment Intent Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 p-6 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--brand-primary)]" />
                Do you plan to make new investments this year?
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                If yes, we'll build an optimized monthly investment roadmap to minimize your tax.
              </p>
            </div>
            <ToggleInput 
              label="" 
              value={investmentIntent} 
              onChange={(v) => useTaxStore.getState().setInvestmentIntent(v)} 
            />
          </div>
        </motion.div>

        {/* Missed Opportunities Banner */}
        {missedOpportunities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-5 rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning-bg)]"
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={18} className="text-[var(--warning)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--warning)]">
                  {missedOpportunities.length} missed {missedOpportunities.length === 1 ? 'opportunity' : 'opportunities'} found in last year's Form 16
                </p>
              </div>
            </div>
            <div className="space-y-2 ml-8">
              {missedOpportunities.map((opp, i) => (
                <div key={i} className="text-sm text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">{opp.section}:</span>{' '}
                  {opp.description}
                  {opp.potentialSaving > 0 && (
                    <span className="text-[var(--success)] font-medium"> → Save {formatRupee(opp.potentialSaving)}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Validation Errors */}
        {validation.issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5"
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={18} className="text-[var(--danger)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--danger)]">
                  Please review the following input notifications:
                </p>
              </div>
            </div>
            <ul className="space-y-2 ml-8 list-disc text-sm text-[var(--text-secondary)]">
              {validation.issues.map((w, i) => (
                <li key={i} className={cn(
                  w.severity === 'error' && "text-[var(--danger)] font-medium",
                  w.severity === 'warning' && "text-[var(--warning)] font-medium"
                )}>
                  {w.message} {w.suggestion && <span className="block mt-0.5 opacity-70 text-xs">{w.suggestion}</span>}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Editable Sections */}
        <div className="space-y-6">
          <SectionCard icon={IndianRupee} title="Salary" description="Your annual compensation">
            <NumberInput label="Annual CTC" value={profile.salary.annualCTC} onChange={(v) => updateSalary('annualCTC', v)} />
            <NumberInput label="In-hand monthly" value={profile.salary.inHandMonthly} onChange={(v) => updateSalary('inHandMonthly', v)} />
            <NumberInput label="Monthly basic" value={profile.structure.basicSalary} onChange={(v) => updateStructure('basicSalary', v)} />
            <NumberInput label="Monthly HRA" value={profile.structure.hra} onChange={(v) => updateStructure('hra', v)} />
            <NumberInput label="Monthly special allowance" value={profile.structure.specialAllowance} onChange={(v) => updateStructure('specialAllowance', v)} />
            <NumberInput label="Monthly LTA" value={profile.structure.lta} onChange={(v) => updateStructure('lta', v)} />
          </SectionCard>

          <SectionCard icon={Building2} title="Employer" description="Company and EPF details">
            <TextInput label="Company name" value={profile.employer.companyName} onChange={(v) => updateEmployer('companyName', v)} />
            <NumberInput label="EPF employee %" value={profile.employer.epfEmployeePercent} onChange={(v) => updateEmployer('epfEmployeePercent', v)} prefix="%" />
            <ToggleInput label="Employer NPS available" value={profile.employer.hasEmployerNPS} onChange={(v) => updateEmployer('hasEmployerNPS', v)} />
            {profile.employer.hasEmployerNPS && (
              <NumberInput label="Employer NPS %" value={profile.employer.employerNPSPercent} onChange={(v) => updateEmployer('employerNPSPercent', v)} prefix="%" />
            )}
          </SectionCard>

          <SectionCard icon={Home} title="Housing" description="Rent, city, and home loan">
            <ToggleInput label="Currently renting" value={profile.structure.isMetroCity} onChange={(v) => updateStructure('isMetroCity', v)} />
            <ToggleInput label="Metro city" value={profile.structure.isMetroCity} onChange={(v) => updateStructure('isMetroCity', v)} />
            <TextInput label="City" value={profile.structure.cityName} onChange={(v) => updateStructure('cityName', v)} />
            <NumberInput label="Monthly rent" value={profile.structure.monthlyRent} onChange={(v) => updateStructure('monthlyRent', v)} />
            <ToggleInput label="Has home loan" value={profile.life.hasHomeLoan} onChange={(v) => updateLife('hasHomeLoan', v)} />
            {profile.life.hasHomeLoan && (
              <NumberInput label="Annual home loan interest" value={profile.life.homeLoanInterestAnnual} onChange={(v) => updateLife('homeLoanInterestAnnual', v)} />
            )}
          </SectionCard>

          <SectionCard icon={Heart} title="Health Insurance" description="80D deduction inputs">
            <NumberInput label="Self/family premium" value={profile.life.selfHealthPremium} onChange={(v) => updateLife('selfHealthPremium', v)} />
            <NumberInput label="Parents premium" value={profile.life.parentHealthPremium} onChange={(v) => updateLife('parentHealthPremium', v)} />
            <ToggleInput label="Parents are senior citizens (60+)" value={profile.life.hasSeniorParents} onChange={(v) => updateLife('hasSeniorParents', v)} />
          </SectionCard>

          <SectionCard icon={PiggyBank} title="Investments" description="80C, NPS, and existing commitments">
            <NumberInput label="EPF employee (annual)" value={profile.investments.epfEmployee} onChange={(v) => updateInvestments('epfEmployee', v)} />
            <NumberInput label="ELSS (annual)" value={profile.investments.elssAnnual} onChange={(v) => updateInvestments('elssAnnual', v)} />
            <NumberInput label="PPF (annual)" value={profile.investments.ppfAnnual} onChange={(v) => updateInvestments('ppfAnnual', v)} />
            <NumberInput label="LIC premium (annual)" value={profile.investments.licPremiumAnnual} onChange={(v) => updateInvestments('licPremiumAnnual', v)} />
            <NumberInput label="NPS employee (annual)" value={profile.investments.npsEmployee} onChange={(v) => updateInvestments('npsEmployee', v)} hint="80CCD(1B) — extra ₹50K above 80C" />
            <NumberInput label="Tuition fees" value={profile.investments.tuitionFees} onChange={(v) => updateInvestments('tuitionFees', v)} />
          </SectionCard>
        </div>

        {/* Sticky Calculate Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-md border-t border-[var(--border-subtle)] p-4 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-secondary)] hidden md:block">
              <Sparkles size={14} className="inline mr-1 text-[var(--brand-primary)]" />
              We'll compare both regimes and build your optimal plan
            </p>
            <Button
              size="lg"
              onClick={handleCalculate}
              isLoading={isComputing}
              disabled={isComputing || profile.salary.annualCTC === 0}
              className="w-full md:w-auto px-10 group"
            >
              Calculate & Compare
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
