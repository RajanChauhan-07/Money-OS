'use client'

import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Zap, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  Wallet,
  CheckCircle2,
  PieChart,
  Calendar,
  LayoutDashboard,
  Rocket,
  LineChart,
  BarChart3,
  Search
} from 'lucide-react'
import { Button } from '@money-os/ui'
import { MotionPage } from '@/components/screens/motion-page'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none transition-all duration-500'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

const services = [
  {
    title: 'AI Tax Audit',
    desc: 'Upload your Form 16 and let our AI find every missing deduction. We compare Old vs. New regimes in seconds.',
    icon: Search,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    title: 'Surplus Intelligence',
    desc: 'Automatically categorize your monthly cash flow into Needs, Wants, and Investments without manual spreadsheets.',
    icon: PieChart,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Goal Engineering',
    desc: 'Track life-changing goals like FIRE, a Luxury Home, or Global Travel. We map your current surplus to your future dreams.',
    icon: Target,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10'
  },
  {
    title: 'Smart SIP Optimizer',
    desc: 'Get specific, asset-level recommendations to fill your tax gaps. We show you exactly where to invest to save more.',
    icon: Rocket,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: 'Unified Portfolio',
    desc: 'One dashboard for your real holdings and planned SIPs. See your total Net Worth and growth momentum in real-time.',
    icon: LayoutDashboard,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10'
  },
  {
    title: 'Wealth Projections',
    desc: 'See your wealth in 5, 10, and 20 years. Our engine simulates growth so you can make data-driven life decisions.',
    icon: LineChart,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10'
  }
]

export default function ServicesPage() {
  return (
    <MotionPage className="p-6 md:p-10 max-w-6xl mx-auto space-y-24 pb-20">
      
      {/* ── Header: One Platform ────────────────────────────────────────── */}
      <section className="text-center space-y-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          <Zap className="text-emerald-500" size={14} />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">The Money OS Suite</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[0.95]"
        >
          One Platform.<br />
          <span className="text-emerald-500">Total Financial Clarity.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-500 dark:text-white/40 font-medium leading-relaxed"
        >
          We’ve replaced the scattered spreadsheets and expensive consultants with a single, AI-powered command center for your money.
        </motion.p>
      </section>

      {/* ── Service Grid ─────────────────────────────────────────────── */}
      <section className="grid md:grid-cols-3 gap-8">
        {services.map((service, i) => (
          <div key={i} className={cn(glass, "p-10 space-y-6 group hover:-translate-y-2 hover:border-emerald-500/30")}>
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform", service.bg, service.color)}>
              <service.icon size={28} />
            </div>
            <div className="space-y-3">
              <h4 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{service.title}</h4>
              <p className="text-sm text-zinc-500 dark:text-white/40 leading-relaxed font-medium">{service.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── The Walkthrough: The User Journey ────────────────────────── */}
      <section className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em]">The Walkthrough</h2>
          <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Your Journey to Sovereignty</h3>
        </div>

        <div className="relative space-y-24 before:absolute before:left-8 md:before:left-1/2 before:top-0 before:bottom-0 before:w-[1px] before:bg-zinc-900/5 dark:before:bg-white/5">
          {[
            { 
              step: '01', 
              title: 'Onboarding & Data In', 
              desc: 'Upload your Form 16 or enter your details manually. Our AI instantly parses your income, exemptions, and current tax-saving investments.',
              image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600&h=400',
              side: 'left'
            },
            { 
              step: '02', 
              title: 'AI Gap Analysis', 
              desc: 'Our engine runs thousands of simulations to find the optimal regime for you. It identifies exactly how much more you need to invest to save maximum tax.',
              image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600&h=400',
              side: 'right'
            },
            { 
              step: '03', 
              title: 'The Investment Roadmap', 
              desc: 'Receive a personalized SIP schedule. We don\'t just tell you "to invest," we tell you "where and how much" based on your real-world surplus.',
              image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=600&h=400',
              side: 'left'
            },
            { 
              step: '04', 
              title: 'Goal-Based Monitoring', 
              desc: 'Track your real-time progress toward milestones. See how a simple change in your "Wants" today can accelerate your "FIRE" date by years.',
              image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=600&h=400',
              side: 'right'
            },
          ].map((item, i) => (
            <div key={i} className={cn("relative flex flex-col md:flex-row items-center gap-12", item.side === 'right' && 'md:flex-row-reverse')}>
              {/* Connector Dot */}
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-950 z-20 shadow-xl shadow-emerald-500/20" />
              
              <div className="w-full md:w-1/2 space-y-6 pl-16 md:pl-0 md:text-right" style={{ textAlign: item.side === 'left' ? 'right' : 'left' }}>
                <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-widest", item.side === 'left' ? 'ml-auto' : 'mr-auto')}>
                  Step {item.step}
                </div>
                <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">{item.title}</h4>
                <p className="text-base text-zinc-500 dark:text-white/40 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
              
              <div className="w-full md:w-1/2">
                <div className={cn(glass, "p-4 aspect-video overflow-hidden group border-emerald-500/10")}>
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover rounded-[1.5rem] grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100 opacity-50 group-hover:opacity-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Highlight: Why AI? ───────────────────────────────── */}
      <section className={cn(glass, "p-12 md:p-20 bg-indigo-500/[0.03] border-indigo-500/10 overflow-hidden relative text-center space-y-10")}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 space-y-6">
          <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.4em]">The AI Advantage</h2>
          <h3 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none max-w-3xl mx-auto italic">
            "Planning that used to take 3 days with a CA now takes 30 seconds with Money OS."
          </h3>
          <div className="flex flex-wrap justify-center gap-12 pt-10">
            {[
              { label: 'Precision', value: '100%' },
              { label: 'Time to Plan', value: '30s' },
              { label: 'Human Error', value: '0%' },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-1">
                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="text-center py-10 space-y-10">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">Ready for total clarity?</h2>
          <p className="max-w-xl mx-auto text-zinc-500 dark:text-white/40 font-medium text-lg">
            Stop guessing. Start engineering your financial future today.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/setup">
            <Button size="lg" className="h-16 px-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">
              Initialize My Plan
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all">
              Launch Dashboard
            </Button>
          </Link>
        </div>
      </section>

    </MotionPage>
  )
}
