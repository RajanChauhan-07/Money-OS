'use client'

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Calculator, PiggyBank, ShieldCheck, ChevronRight, ArrowRight, Info, Table as TableIcon, Zap, TrendingDown, Landmark, CheckCircle2, Home } from "lucide-react";
import { GlowCard, SplitText, NavHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

const TABS = [
  { id: 'slabs', label: 'Tax Slabs', icon: TableIcon },
  { id: 'deductions', label: 'Deductions', icon: PiggyBank },
  { id: 'rebates', label: 'Rebates & Surcharge', icon: Zap },
  { id: 'concepts', label: 'Basic Concepts', icon: BookOpen },
];

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState('slabs');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="relative min-h-screen flex flex-col items-center">
      {/* Search Header Section */}
      <div className="w-full pt-48 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand-primary)]/15 via-[var(--brand-primary)]/5 to-transparent -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-[10px] font-black uppercase tracking-widest shadow-sm"
          >
            <BookOpen size={14} />
            Money OS Academy
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter leading-[0.95]">
            Tax planning, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-primary)]">simplified for you.</span>
          </h1>
          
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Indian taxes for FY 2025-26 (AY 2026-27), explained without the heavy jargon.
          </p>

          <div className="max-w-xl mx-auto relative pt-12">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-all" size={20} />
              <input
                type="text"
                placeholder="Search for sections (e.g. 80C, HRA, Slabs)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl pl-14 pr-6 outline-none focus:border-[var(--brand-primary)] focus:ring-8 focus:ring-[var(--brand-primary)]/5 transition-all shadow-2xl text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-6 pb-32">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all border",
                activeTab === tab.id
                  ? "bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)] shadow-xl"
                  : "bg-[var(--bg-surface)]/50 text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'slabs' && <SlabsContent />}
              {activeTab === 'deductions' && <DeductionsContent />}
              {activeTab === 'rebates' && <RebatesContent />}
              {activeTab === 'concepts' && <ConceptsContent />}
            </motion.div>
          </AnimatePresence>
        </div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-32 text-center space-y-12 pb-20"
      >
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-[var(--text-primary)] tracking-tight">Ready to see your real numbers?</h2>
          <p className="text-xl text-[var(--text-secondary)] font-bold">Now that you know the rules, let us build the roadmap for you.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button className="px-10 py-5 rounded-[24px] bg-[var(--brand-primary)] text-black font-black hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_-20px_rgba(var(--brand-primary-rgb),0.5)] flex items-center gap-3 text-lg group">
            Build My Plan
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-10 py-5 rounded-[24px] bg-[var(--text-primary)]/5 border border-[var(--border-subtle)] text-[var(--text-primary)] font-black hover:bg-[var(--text-primary)]/10 transition-all text-lg">
            Try Simulator
          </button>
        </div>
      </motion.div>
      </main>
    </div>
  );
}

function SlabsContent() {
  return (
    <div className="space-y-16">
      {/* Introduction and Rule of Thumb */}
      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <div className="flex-1 space-y-6">
          <h2 className="text-4xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
            <TrendingDown className="text-[var(--brand-primary)]" />
            New vs Old Regime
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed text-lg font-medium">
            Since April 2020, India has two parallel tax systems. You get to choose one every year. 
            The <span className="text-[var(--text-primary)] font-bold">New Regime</span> offers lower tax rates but takes away most deductions. 
            The <span className="text-[var(--text-primary)] font-bold">Old Regime</span> has higher rates but allows you to reduce your taxable income using HRA, 80C, etc.
          </p>
          <div className="p-6 rounded-3xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/10">
            <h4 className="font-bold text-[var(--brand-primary)] mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Zap size={16} />
              Pro Tip
            </h4>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
              For FY 2025-26, the New Regime is the default. If you want the Old Regime, you must specifically opt for it when filing your return.
            </p>
          </div>
        </div>
        
        <div className="w-full lg:w-96 shrink-0">
          <GlowCard className="p-8 bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] backdrop-blur-xl">
            <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)] flex items-center gap-2">
              <Calculator size={18} className="text-[var(--brand-primary)]" />
              Quick Check
            </h3>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  If total deductions are <strong className="text-[var(--text-primary)] font-black">below ₹4.25 Lakhs</strong>, New Regime is usually better.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 mt-1">
                  <TrendingDown size={14} />
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  If your salary is <strong className="text-[var(--text-primary)] font-black">₹12 Lakhs or less</strong>, you pay zero tax in the New Regime.
                </p>
              </li>
            </ul>
          </GlowCard>
        </div>
      </div>

      {/* Slab Tables */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* NEW REGIME */}
        <div className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-3xl rounded-[32px] shadow-2xl">
          <div className="p-8 bg-gradient-to-r from-[var(--brand-primary)]/10 to-transparent border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                New Regime
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-[var(--brand-primary)] text-[var(--bg-base)] px-3 py-1 rounded-full shadow-lg">
                  Default
                </span>
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2 font-bold">FY 2025-26 (Assessment Year 2026-27)</p>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--text-primary)]/5 border-b border-[var(--border-subtle)]">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Income Range</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] text-right">Tax Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {[
                  { range: "Up to ₹4,00,000", rate: "0%", color: "text-[var(--success)]" },
                  { range: "₹4,00,001 - ₹8,00,000", rate: "5%", color: "text-[var(--brand-primary)]" },
                  { range: "₹8,00,001 - ₹12,00,000", rate: "10%", color: "text-[var(--brand-primary)]" },
                  { range: "₹12,00,001 - ₹16,00,000", rate: "15%", color: "text-[var(--brand-primary)]" },
                  { range: "₹16,00,001 - ₹20,00,000", rate: "20%", color: "text-[var(--brand-primary)]" },
                  { range: "Above ₹20,00,000", rate: "30%", color: "text-[var(--brand-primary)]" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--text-primary)]/5 transition-colors group">
                    <td className="px-8 py-5 text-[15px] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">{row.range}</td>
                    <td className={cn("px-8 py-5 text-[17px] font-black text-right", row.color)}>{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-[var(--text-primary)]/5 text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-[0.2em] text-center border-t border-[var(--border-subtle)]">
            Standard Deduction of <span className="text-[var(--text-primary)] font-black">₹75,000</span> applies additionally
          </div>
        </div>

        {/* OLD REGIME */}
        <div className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-3xl rounded-[32px] shadow-2xl">
          <div className="p-8 bg-[var(--text-primary)]/5 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                Old Regime
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-[var(--text-primary)]/10 text-[var(--text-secondary)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                  Optional
                </span>
              </h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2 font-bold">For individuals below 60 years</p>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--text-primary)]/5 border-b border-[var(--border-subtle)]">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Income Range</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] text-right">Tax Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {[
                  { range: "Up to ₹2,50,000", rate: "0%", color: "text-[var(--success)]" },
                  { range: "₹2,50,001 - ₹5,00,000", rate: "5%", color: "text-amber-500" },
                  { range: "₹5,00,001 - ₹10,00,000", rate: "20%", color: "text-amber-500" },
                  { range: "Above ₹10,00,000", rate: "30%", color: "text-amber-500" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--text-primary)]/5 transition-colors group">
                    <td className="px-8 py-5 text-[15px] font-bold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors">{row.range}</td>
                    <td className={cn("px-8 py-5 text-[17px] font-black text-right", row.color)}>{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-[var(--text-primary)]/5 text-[10px] text-[var(--text-tertiary)] font-black uppercase tracking-[0.2em] text-center border-t border-[var(--border-subtle)]">
            Standard Deduction of <span className="text-[var(--text-primary)] font-black">₹50,000</span> applies additionally
          </div>
        </div>
      </div>
    </div>
  );
}

function DeductionsContent() {
  return (
    <div className="w-full space-y-10 pb-24 max-w-6xl mx-auto px-4">
      <div className="text-left mb-16 space-y-4">
        <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">The Tools of Saving</h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-medium max-w-2xl">
          Deductions are your legal "tax discounts". Use these sections to subtract specific investments from your total income.
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {[
          {
            id: '80c',
            title: 'Section 80C',
            limit: 'MAX ₹1.5L',
            desc: 'The essential all-rounder. Includes PPF, ELSS Mutual Funds, Life Insurance premiums, Home Loan principal, and School Tuition fees.',
            icon: PiggyBank,
            color: 'var(--brand-primary)',
            meta: [
              { label: 'Best for', value: 'Long-term wealth' },
              { label: 'Availability', value: 'Old Regime Only', highlight: true }
            ]
          },
          {
            id: '80d',
            title: 'Section 80D',
            limit: 'MAX ₹75K+',
            desc: 'Health insurance premiums for you, your family, and your parents. Includes a specific ₹5,000 allowance for annual checkups.',
            icon: ShieldCheck,
            color: '#10b981', // emerald-500
            meta: [
              { label: 'Self/Family', value: '₹25,000' },
              { label: 'Senior Parents', value: '₹50,000' }
            ]
          },
          {
            id: 'nps',
            title: 'NPS (Extra)',
            limit: 'MAX ₹50K',
            desc: 'Additional retirement savings under Section 80CCD(1B). This is extra—it works over and above the ₹1.5L limit of 80C.',
            icon: Landmark,
            color: '#a855f7', // purple-500
            meta: [
              { label: 'Section', value: '80CCD(1B)' },
              { label: 'Availability', value: 'Old Regime Only', highlight: true }
            ]
          },
          {
            id: 'hra',
            title: 'HRA',
            limit: 'RENT-BASED',
            desc: 'House Rent Allowance. If you pay rent, you can claim a significant portion of it as tax-free income based on your salary structure.',
            icon: Home,
            color: '#3b82f6', // blue-500
            meta: [
              { label: 'Requires', value: 'Rent Receipts' },
              { label: 'Availability', value: 'Old Regime Only', highlight: true }
            ]
          },
          {
            id: 'homeloan',
            title: 'Home Loan Int.',
            limit: 'MAX ₹2L',
            desc: 'Section 24(b) allows you to subtract the interest paid on your home loan directly from your total taxable income.',
            icon: Landmark,
            color: '#f59e0b', // amber-500
            meta: [
              { label: 'Section', value: '24(b)' },
              { label: 'Availability', value: 'Old Regime Only', highlight: true }
            ]
          },
          {
            id: 'employer_nps',
            title: 'Employer NPS',
            limit: '10% BASIC',
            desc: "Your company's contribution to your NPS account. This is a unique benefit allowed in BOTH the New and Old tax regimes.",
            icon: Landmark,
            color: '#6366f1', // indigo-500
            meta: [
              { label: 'Availability', value: 'Both Regimes', success: true },
              { label: 'Benefit', value: 'Tax-free income' }
            ]
          }
        ].map((item) => (
          <GlowCard key={item.id} className="w-full p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] backdrop-blur-3xl rounded-[32px] hover:bg-[var(--bg-surface)]/80 transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center w-full gap-8">
              {/* Left Side: Icon and Core Info */}
              <div className="flex items-center gap-6 flex-1 w-full">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon style={{ color: item.color }} size={32} />
                </div>
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{item.title}</h3>
                    <span 
                      className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-sm"
                      style={{ backgroundColor: item.color, color: '#fff' }}
                    >
                      {item.limit}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* Right Side: Metadata / Badges */}
              <div className="flex gap-10 shrink-0 md:pl-10 md:border-l border-[var(--border-subtle)] min-w-fit">
                {item.meta.map((m, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{m.label}</span>
                    <div className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md",
                      m.highlight ? "text-amber-600 bg-amber-500/10 border border-amber-500/20" : 
                      m.success ? "text-emerald-600 bg-emerald-500/10 border border-emerald-500/20" :
                      "text-[var(--text-primary)] bg-[var(--text-primary)]/5"
                    )}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

function RebatesContent() {
  return (
    <div className="space-y-16">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Section 87A Rebate */}
        <div className="space-y-8">
          <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            Section 87A Rebate
          </h3>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-bold">
            The "Magic" discount that makes your tax zero if you earn below a certain limit. It's a direct deduction from your final tax bill.
          </p>
          <div className="grid gap-6">
            <div className="p-6 rounded-[24px] bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] backdrop-blur-3xl shadow-xl">
              <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">New Regime Rebate</h4>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed font-bold">
                Zero tax if your taxable income is up to <span className="text-[var(--brand-primary)] font-black">₹12,00,000</span> (FY 2025-26).
              </p>
            </div>
            <div className="p-6 rounded-[24px] bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] backdrop-blur-3xl shadow-xl">
              <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">Old Regime Rebate</h4>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed font-bold">
                Zero tax if your taxable income is up to <span className="text-amber-500 font-black">₹5,00,000</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Surcharge */}
        <div className="space-y-8">
          <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            Surcharge
          </h3>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-bold">
            An "Extra Tax on Tax" for high earners. Only applies if your total income exceeds ₹50 Lakhs.
          </p>
          <div className="overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 backdrop-blur-3xl rounded-[32px] shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-[var(--text-primary)]/5">
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Income</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                <tr>
                  <td className="px-6 py-5 text-[15px] font-bold text-[var(--text-primary)]">₹50L - ₹1 Crore</td>
                  <td className="px-6 py-5 text-right font-black text-[var(--text-primary)] text-[17px]">10%</td>
                </tr>
                <tr>
                  <td className="px-6 py-5 text-[15px] font-bold text-[var(--text-primary)]">₹1Cr - ₹2 Crore</td>
                  <td className="px-6 py-5 text-right font-black text-[var(--text-primary)] text-[17px]">15%</td>
                </tr>
                <tr>
                  <td className="px-6 py-5 text-[15px] font-bold text-[var(--text-primary)]">Above ₹2 Crore</td>
                  <td className="px-6 py-5 text-right font-black text-[var(--brand-primary)] text-[17px]">25%*</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] font-bold italic leading-relaxed">
            *In the New Regime, surcharge is capped at 25%. In the Old Regime, it can reach 37% for income above ₹5 Cr.
          </p>
        </div>
      </div>

      {/* Cess Section */}
      <div className="p-10 rounded-[48px] bg-indigo-500/10 border border-indigo-500/20 text-center shadow-2xl backdrop-blur-md">
        <h4 className="text-2xl font-black text-[var(--text-primary)] mb-3 tracking-tight">Health & Education Cess</h4>
        <p className="text-lg text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed font-bold">
          Finally, a fixed <span className="text-[var(--text-primary)] font-black">4% Cess</span> is added to your total tax bill. This is mandatory for everyone and supports national health and education projects.
        </p>
      </div>
    </div>
  );
}

function ConceptsContent() {
  const concepts = [
    { title: "Financial Year (FY)", desc: "The year in which you earn money. e.g., April 1, 2025 to March 31, 2026." },
    { title: "Assessment Year (AY)", desc: "The year you report income and pay tax for the previous year. Always one year ahead of FY." },
    { title: "Standard Deduction", desc: "A flat 'freebie' deduction. No receipts needed. It's ₹75,000 (New) and ₹50,000 (Old)." },
    { title: "Taxable Income", desc: "Your income after all deductions. You only pay tax on this, not your full CTC." },
    { title: "TDS (Tax Deducted at Source)", desc: "The monthly tax your employer cuts from your salary. It's like paying tax in installments." },
    { title: "Form 16", desc: "The official certificate from your employer showing your total salary and the TDS deducted." },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {concepts.map((item, i) => (
        <div key={i} className="p-8 rounded-[32px] bg-[var(--bg-surface)]/50 backdrop-blur-3xl border border-[var(--border-subtle)] space-y-4 hover:border-[var(--brand-primary)]/50 transition-all group shadow-xl">
          <h4 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors tracking-tight">{item.title}</h4>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed font-bold">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

