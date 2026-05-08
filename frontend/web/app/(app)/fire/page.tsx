'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTaxStore } from '@/lib/stores/tax-store'
import { formatRupee } from '@/lib/utils/format'
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Info, 
  ArrowRight,
  TrendingDown,
  Coins,
  AlertCircle,
  PartyPopper
} from 'lucide-react'
import { cn } from '@/lib/utils'
import * as Slider from '@radix-ui/react-slider'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

// Premium UI Tokens
const glass = "bg-white/70 dark:bg-black/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-2xl"
const card = "p-6 rounded-[2rem] overflow-hidden relative group"

export default function FIREPlannerPage() {
  const { taxResult, taxInput, scenarios } = useTaxStore()

  // Base state from tax store - Force Number to avoid NaN from storage
  const monthlySalary = Number(taxInput?.salary?.inHandMonthly || 0)
  
  // Calculate ACTUAL tax savings (Current vs Optimized)
  const monthlyTaxSavings = useMemo(() => {
    if (!scenarios) return 0
    const currentAnnualTax = Number(scenarios.current?.totalTax || 0)
    const optimizedAnnualTax = Number(scenarios.optimized?.totalTax || 0)
    return Math.max(0, (currentAnnualTax - optimizedAnnualTax) / 12)
  }, [scenarios])

  // Simulation state
  const [userAge, setUserAge] = useState(25) // Default 25
  const [monthlyExpenses, setMonthlyExpenses] = useState(0)
  const [currentSavings, setCurrentSavings] = useState(1000000) // Default 10L
  const [expectedReturn, setExpectedReturn] = useState(12) // Default 12%
  const [inflation, setInflation] = useState(6) // Default 6%
  const [fireMultiplier, setFireMultiplier] = useState(25) // Default 25x

  // Initialize expenses based on salary if not set
  useEffect(() => {
    if (monthlySalary > 0 && monthlyExpenses === 0) {
      setMonthlyExpenses(Math.floor(monthlySalary * 0.7))
    }
  }, [monthlySalary, monthlyExpenses])

  // Calculations
  const annualExpenses = Number(monthlyExpenses || 0) * 12
  const baseFireNumber = annualExpenses * Number(fireMultiplier || 25)

  // Savings rates
  const currentMonthlySavings = Math.max(0, monthlySalary - Number(monthlyExpenses || 0))
  const optimizedMonthlySavings = currentMonthlySavings + monthlyTaxSavings
  const hasDeficit = Number(monthlyExpenses || 0) > monthlySalary
  const isAlreadyFree = Number(currentSavings || 0) >= baseFireNumber

  // Projected Data Generation
  const projectionData = useMemo(() => {
    const data = []
    let currentPortfolio = Number(currentSavings || 0)
    let optimizedPortfolio = Number(currentSavings || 0)
    
    // Project until age 100 or for 75 years
    const maxYears = Math.min(75, 100 - userAge)
    
    for (let year = 0; year <= maxYears; year++) {
      const age = userAge + year
      const inflationFactor = Math.pow(1 + inflation / 100, year)
      const targetAtAge = Math.floor(baseFireNumber * inflationFactor)
      
      data.push({
        year,
        age,
        current: Math.floor(currentPortfolio),
        optimized: Math.floor(optimizedPortfolio),
        fireTarget: targetAtAge
      })

      // Update for next year with compounding
      currentPortfolio = (currentPortfolio + currentMonthlySavings * 12) * (1 + expectedReturn / 100)
      optimizedPortfolio = (optimizedPortfolio + optimizedMonthlySavings * 12) * (1 + expectedReturn / 100)
    }
    return data
  }, [currentSavings, currentMonthlySavings, optimizedMonthlySavings, expectedReturn, baseFireNumber, inflation, userAge])

  // Find intersections
  const currentFIRE = projectionData.find(d => d.current >= d.fireTarget)
  const optimizedFIRE = projectionData.find(d => d.optimized >= d.fireTarget)
  const yearsSaved = (currentFIRE?.year || 75) - (optimizedFIRE?.year || 75)
  
  // Real Momentum Check
  const isUnreachable = !optimizedFIRE && inflation >= expectedReturn
  
  // Adjusted Target at FIRE age
  const targetAtFIRE = optimizedFIRE?.fireTarget || baseFireNumber

  if (!taxResult) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={cn(glass, "p-12 rounded-[3rem] text-center max-w-md")}>
        <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Info className="text-white dark:text-black" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Plan required</h2>
        <p className="text-zinc-500 dark:text-white/40 text-sm font-medium leading-relaxed">
          We need your tax profile to calculate your monthly investable surplus. Upload your Form 16 or enter details manually to start planning your freedom.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header with Strategy Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Freedom Architect</h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-white/40">Simulation-first planning for your financial independence.</p>
         </div>
         <div className="flex p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl">
            {[
              { label: 'Lean', value: 20 },
              { label: 'Standard', value: 25 },
              { label: 'Fat', value: 35 }
            ].map((strategy) => (
              <button
                key={strategy.label}
                onClick={() => setFireMultiplier(strategy.value)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  fireMultiplier === strategy.value 
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xl" 
                    : "text-zinc-400 dark:text-white/30 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {strategy.label}
              </button>
            ))}
         </div>
      </div>

      {/* STEP 1: Simulation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={cn(glass, "p-8 rounded-[3rem] relative")}>
          <h4 className="text-lg font-black mb-8 flex items-center gap-2">
            <Coins size={20} className="text-[var(--brand-primary)]" /> Lifestyle Simulation
          </h4>
          <div className="space-y-10">
            <SliderControl 
              label="Current Age" 
              value={userAge} 
              max={70} 
              min={18}
              step={1}
              unit="yrs"
              onChange={setUserAge} 
            />
            <SliderControl 
              label="Monthly Expenses" 
              value={monthlyExpenses} 
              max={Math.max(monthlySalary * 2, 500000)} 
              step={1000}
              onChange={setMonthlyExpenses} 
            />
            <SliderControl 
              label="Current Savings" 
              value={currentSavings} 
              max={25000000} 
              step={50000}
              onChange={setCurrentSavings} 
            />
          </div>
          
          {hasDeficit && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-4 left-8 right-8 p-4 rounded-xl bg-amber-500 text-white shadow-xl flex items-center gap-3 z-10"
            >
              <AlertCircle size={20} />
              <p className="text-xs font-black uppercase tracking-wider">Warning: Spending exceeds income. Portfolio growth stalled.</p>
            </motion.div>
          )}
        </div>

        <div className={cn(glass, "p-8 rounded-[3rem]")}>
          <h4 className="text-lg font-black mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-[var(--brand-primary)]" /> Market Assumptions
          </h4>
          <div className="space-y-10">
            <SliderControl 
              label="Expected Return (%)" 
              value={expectedReturn} 
              max={20} 
              step={0.5}
              unit="%"
              onChange={setExpectedReturn}
              footer={
                expectedReturn < 9 ? 'Conservative (Debt-heavy)' :
                expectedReturn < 13 ? 'Moderate (Balanced/Index)' :
                'Aggressive (Direct Equity)'
              }
            />
            <SliderControl 
              label="Inflation (%)" 
              value={inflation} 
              max={15} 
              step={0.5}
              unit="%"
              onChange={setInflation} 
            />
          </div>
        </div>
      </div>

      {/* STEP 2: Hero Metrics & Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={cn(glass, card, "lg:col-span-2 flex flex-col justify-between group", isAlreadyFree && "border-emerald-500/30")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/30 mb-1">
                {isAlreadyFree ? "Financial Status: Elite" : "Momentum Indicator"}
              </p>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                {isAlreadyFree ? "Financial Independence" : "Freedom Roadmap"}
              </h2>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12",
              isAlreadyFree ? "bg-emerald-500 text-white" : "bg-zinc-900 dark:bg-white text-white dark:text-black"
            )}>
              {isAlreadyFree ? <PartyPopper size={24} /> : <Flame size={24} />}
            </div>
          </div>

          <div className="mt-12 flex items-baseline gap-4">
             <span className={cn(
               "text-8xl font-black tracking-tighter tabular-nums",
               isAlreadyFree ? "text-emerald-500" : isUnreachable ? "text-amber-500" : "text-zinc-900 dark:text-white"
             )}>
                {isAlreadyFree ? "NOW" : isUnreachable ? "NEVER" : (optimizedFIRE?.age || '99+')}
             </span>
             <div className="space-y-1">
                <p className="text-xl font-bold text-zinc-900 dark:text-white">
                  {isAlreadyFree ? "Freedom Achieved" : isUnreachable ? "Stalled Path" : "Years Old"}
                </p>
                <p className={cn("text-sm font-bold flex items-center gap-1", isUnreachable ? "text-amber-500" : "text-emerald-500")}>
                   {isAlreadyFree ? (
                     <>Enjoy your life!</>
                   ) : isUnreachable ? (
                     <><AlertCircle size={14} /> {"Inflation > Returns"}</>
                   ) : (
                     <><TrendingDown size={14} /> {yearsSaved > 0 ? `${yearsSaved} years saved by tax planning` : 'Optimizing your freedom'}</>
                   )}
                </p>
             </div>
          </div>

          <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 flex gap-8">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/30">Target Corpus (Adj.)</p>
                <p className={cn("text-xl font-black", isAlreadyFree ? "text-emerald-500" : "text-zinc-900 dark:text-white")}>
                  {formatRupee(targetAtFIRE)}
                </p>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/30">Monthly Invested</p>
                <p className="text-xl font-black text-zinc-900 dark:text-white">{formatRupee(optimizedMonthlySavings)}</p>
             </div>
          </div>
        </div>

        <div className={cn(glass, card, "bg-zinc-900 dark:bg-white text-white dark:text-black")}>
           <div className="space-y-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">The Impact of Tax Optimization</p>
                {monthlyTaxSavings > 0 ? (
                  <p className="text-sm mt-4 font-medium leading-relaxed opacity-80">
                    By optimizing your tax liability with Money OS, you're redirecting <span className="font-black text-emerald-400 dark:text-emerald-600">{formatRupee(monthlyTaxSavings)}/month</span> from taxes to your freedom fund.
                  </p>
                ) : (
                  <p className="text-sm mt-4 font-medium leading-relaxed opacity-80">
                    Your current tax strategy is <span className="font-black text-emerald-400 dark:text-emerald-600">fully optimized</span>. You're already saving the maximum possible tax!
                  </p>
                )}
              </div>

              <div className="space-y-4">
                 <div className="p-4 rounded-2xl bg-white/10 dark:bg-black/5 border border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60 dark:text-black/60">Standard Path</span>
                    <span className="text-xs font-black">
                      {isAlreadyFree ? "Free" : isUnreachable ? "Never" : (currentFIRE?.age ? `${currentFIRE.age} yrs` : '99+ yrs')}
                    </span>
                 </div>
                 <div className="p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-between shadow-lg shadow-emerald-500/20 transition-transform hover:scale-[1.02]">
                    <span className="text-xs font-bold">Money OS Path</span>
                    <span className="text-xs font-black">
                      {isAlreadyFree ? "Free" : isUnreachable ? "Never" : (optimizedFIRE?.age ? `${optimizedFIRE.age} yrs` : '99+ yrs')}
                    </span>
                 </div>
              </div>

              <p className="text-[11px] font-bold opacity-60 flex items-center gap-2">
                 <ShieldCheck size={14} /> Mathematically verified path to FIRE.
              </p>
           </div>
        </div>
      </div>

      {/* STEP 3: Chart */}
      <div className={cn(glass, "rounded-[3rem] p-10")}>
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Wealth Growth Projection</h3>
            <p className="text-sm font-medium text-zinc-500 dark:text-white/40">Portfolio value projected to age 100</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">Optimized Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/40">FIRE Target</span>
            </div>
          </div>
        </div>

        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="age" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 700, fill: 'rgba(255,255,255,0.3)'}}
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax + 10000000']}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className={cn(glass, "p-5 rounded-[1.5rem] shadow-2xl border-emerald-500/20")}>
                        <p className="text-xs font-black mb-3 border-b border-black/5 dark:border-white/5 pb-2">Age {payload[0].payload.age}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-8">
                             <span className="text-[10px] font-bold text-zinc-400">Portfolio</span>
                             <span className="text-[11px] font-black text-emerald-500">{formatRupee(payload[0].value as number)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-8">
                             <span className="text-[10px] font-bold text-zinc-400">Target</span>
                             <span className="text-[11px] font-black text-zinc-900 dark:text-white">{formatRupee(payload[2].value as number)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area 
                type="monotone" 
                dataKey="optimized" 
                stroke="#10b981" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorOptimized)" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="current" 
                stroke="rgba(255,255,255,0.3)" 
                strokeWidth={2}
                fill="transparent"
                strokeDasharray="8 8"
              />
              <Area 
                type="monotone" 
                dataKey="fireTarget" 
                stroke="rgba(255,255,255,0.15)" 
                strokeWidth={2}
                fill="transparent"
              />
              {optimizedFIRE && (
                <ReferenceLine 
                  x={optimizedFIRE.age} 
                  stroke="#10b981" 
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{ 
                    position: 'top', 
                    value: 'FREEDOM POINT', 
                    fontSize: 12, 
                    fontWeight: 900, 
                    fill: '#10b981',
                    dy: -10
                  }} 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function SliderControl({ 
  label, 
  value, 
  max, 
  min = 0,
  step,
  onChange,
  unit = "",
  footer = ""
}: { 
  label: string, 
  value: number, 
  max: number, 
  min?: number,
  step: number,
  onChange: (v: number) => void,
  unit?: string,
  footer?: string
}) {
  const formatValue = (v: number) => {
    if (unit === "%") return `${v}%`
    if (unit === "yrs") return `${v} yrs`
    return formatRupee(v)
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-end">
        <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/30">{label}</label>
        <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums bg-zinc-900/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5">
          {formatValue(value)}
        </span>
      </div>
      
      <Slider.Root 
        className="relative flex items-center select-none touch-none w-full h-5 group"
        value={[value]}
        max={max}
        min={min}
        step={step}
        onValueChange={(vals) => onChange(vals[0])}
      >
        <Slider.Track className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 relative grow rounded-full h-3 overflow-hidden shadow-inner">
          <Slider.Range className="absolute bg-zinc-900 dark:bg-white h-full rounded-full transition-all duration-100" />
        </Slider.Track>
        <Slider.Thumb className="block w-6 h-6 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-white shadow-xl rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing" />
      </Slider.Root>

      <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-white/20 px-1">
         <span>{formatValue(min)}</span>
         <span>{footer || `Max: ${formatValue(max)}`}</span>
      </div>
    </div>
  )
}
