'use client'

import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Zap, 
  Heart, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  UserMinus, 
  Wallet,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react'
import { Button } from '@money-os/ui'
import { MotionPage } from '@/components/screens/motion-page'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

export default function AboutPage() {
  return (
    <MotionPage className="p-6 md:p-10 max-w-6xl mx-auto space-y-20 pb-20">
      
      {/* ── Header: The Vision ────────────────────────────────────────── */}
      <section className="text-center space-y-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          <Sparkles className="text-emerald-500" size={14} />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">The Future of Personal Finance</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[0.95]"
        >
          Money OS: Your Wealth.<br />
          <span className="text-emerald-500">No Middlemen.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 dark:text-white/40 font-medium leading-relaxed"
        >
          We built Money OS because traditional tax planning is broken. It's either too complicated, too expensive, or designed to sell you things you don't need.
        </motion.p>
      </section>

      {/* ── The Problem Section: Why we're different ───────────────────── */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase tracking-widest text-sm">
            <span className="text-emerald-500">01.</span> The Problem
          </h2>
          <p className="text-xl text-zinc-600 dark:text-white/60 leading-relaxed font-medium">
            Tools like ClearTax and others often try to push you toward expensive "CA-Assisted" plans that cost thousands of rupees. 
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                <UserMinus size={24} />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-xs mb-1">Stop Paying Middlemen</h4>
                <p className="text-sm text-zinc-500 dark:text-white/40 leading-relaxed">CAs are great, but for 90% of salaried Indians, a smart AI can do the job faster and for free.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Lock size={24} />
              </div>
              <div>
                <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-xs mb-1">No Complex Jargon</h4>
                <p className="text-sm text-zinc-500 dark:text-white/40 leading-relaxed">We don't talk in complicated law codes. We talk in simple terms like 'Needs', 'Wants', and 'Wealth'.</p>
              </div>
            </div>
          </div>
        </div>
        <div className={cn(glass, "p-10 space-y-6 bg-zinc-900/5 dark:bg-white/[0.01]")}>
          <div className="p-6 rounded-3xl bg-zinc-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Old Way</p>
            <p className="text-sm text-zinc-400 line-through mb-1">Pay ₹5,000 for CA Advice</p>
            <p className="text-sm text-zinc-400 line-through mb-1">Wait 3 days for a response</p>
            <p className="text-sm text-zinc-400 line-through">Complicated spreadsheets</p>
          </div>
          <div className="p-8 rounded-3xl bg-emerald-500 border border-emerald-400 shadow-2xl shadow-emerald-500/20">
            <p className="text-xs font-black text-white uppercase tracking-widest mb-4">The Money OS Way</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <CheckCircle2 size={16} /> ₹0 Lifetime Fees
              </div>
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <CheckCircle2 size={16} /> Instant AI Recommendations
              </div>
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <CheckCircle2 size={16} /> Integrated Planning & Action
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works: Simple 1-2-3 ────────────────────────────────── */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em]">02. How it works</h2>
          <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">As Simple as 1, 2, 3.</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              step: '01', 
              title: 'Upload or Enter', 
              desc: 'Upload your Form 16 or enter your salary manually. Our AI reads it instantly.', 
              icon: Globe,
              color: 'text-blue-500',
              bg: 'bg-blue-500/10'
            },
            { 
              step: '02', 
              title: 'Compare & Optimize', 
              desc: 'The engine compares the Old vs. New regime and finds exactly how to save the most tax.', 
              icon: Cpu,
              color: 'text-indigo-500',
              bg: 'bg-indigo-500/10'
            },
            { 
              step: '03', 
              title: 'Automate Wealth', 
              desc: 'Start SIPs based on our specific plan and track your progress toward your life goals.', 
              icon: Zap,
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10'
            },
          ].map((item, i) => (
            <div key={i} className={cn(glass, "p-10 space-y-6 hover:-translate-y-2 transition-all duration-500 group")}>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform", item.bg, item.color)}>
                <item.icon size={28} />
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{item.step}</p>
                <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{item.title}</h4>
                <p className="text-sm text-zinc-500 dark:text-white/40 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Key Features: The Power of AI ─────────────────────────────── */}
      <section className={cn(glass, "p-12 md:p-20 overflow-hidden relative")}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em]">03. Features</h2>
            <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">Built for the Modern Professional.</h3>
            <div className="grid gap-6">
              {[
                { title: 'Regime Hero', desc: 'Instant comparison between tax regimes to save every rupee possible.' },
                { title: 'Cash Flow Master', desc: 'Understand your Needs vs. Wants with zero manual logging.' },
                { title: 'Goal Engine', desc: 'Track FIRE, Travel, and Luxury goals against your real-time surplus.' },
                { title: 'SIP Projections', desc: 'See your wealth in 10 years based on your current saving habits.' },
              ].map((f, i) => (
                <div key={i} className="flex gap-4" tabIndex={0}>
                  <div className="w-6 h-6 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mt-1">
                    <CheckCircle2 size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h5 className="font-black text-zinc-900 dark:text-white uppercase text-[10px] tracking-widest mb-1">{f.title}</h5>
                    <p className="text-sm text-zinc-500 dark:text-white/40 font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 blur-3xl rounded-full" />
            <div className={cn(surface, "p-10 relative border-white/20 space-y-8")}>
              <div className="absolute top-4 right-6 px-2 py-0.5 rounded bg-zinc-900/10 dark:bg-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-400">Example Data</div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Net Worth</p>
                <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">₹16,06,450</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
                    <span>FIRE Goal Progress</span>
                    <span className="text-emerald-500">59%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div className="h-full w-[59%] bg-emerald-500" />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                    <Sparkles size={12} /> AI Strategy
                  </p>
                  <p className="text-[11px] font-bold text-indigo-400 leading-snug">
                    Moving ₹20k from 'Wants' to 'SIPs' will reach FIRE 2 years early.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA: Join the Movement ────────────────────────────────────── */}
      <section className="text-center py-10 space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">Ready to fire your CA?</h2>
          <p className="max-w-xl mx-auto text-zinc-500 dark:text-white/40 font-medium">
            Join thousands of smart professionals who are taking control of their own wealth with AI-driven planning.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-10 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[11px] shadow-2xl">
              Launch My Dashboard
            </Button>
          </Link>
          <Link href="/setup">
            <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[11px]">
              Start Free Plan
            </Button>
          </Link>
        </div>
      </section>

    </MotionPage>
  )
}
