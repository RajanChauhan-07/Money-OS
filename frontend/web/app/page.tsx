'use client'

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Upload, FileText, CheckCircle2, Shield, Calendar, Bot, Users, Search, Calculator, Download, ChevronDown, Briefcase, PieChart, Zap, ArrowRightLeft } from "lucide-react";
import { GlowCard, LanguageToggle, SplitText, LiquidButton, AuroraButton, NavHeader, CircularTestimonials } from "@/components/ui";
import { cn } from "@/lib/utils";

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]/40 overflow-hidden transition-all hover:bg-[var(--bg-surface)]/60">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <h4 className="text-lg font-semibold text-[var(--text-primary)]">{question}</h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-[var(--text-tertiary)]"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5">
              <p className="text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-4">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center">

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-[72px] pb-24 relative z-20 flex flex-col items-center">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-6 mb-32">
          <SplitText
            text="Most salaried Indians pay more tax than they legally have to."
            className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] tracking-tight leading-[1.1]"
            delay={40}
            duration={1.2}
            ease="power4.out"
            tag="h1"
            textAlign="center"
          />
          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
            Not because the rules are complicated. Because nobody showed them what to claim, 
            which regime saves more, and when to act. Upload your Form 16 and we'll show you.
          </p>
          
          <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link href="/upload">
              <LiquidButton size="xxl" className="w-full sm:w-auto group">
                <Upload className="w-5 h-5 mr-2" />
                Upload Form 16
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </LiquidButton>
            </Link>
            <Link href="/setup">
              <AuroraButton className="w-full sm:w-auto h-14 px-10 text-base">
                <FileText className="w-5 h-5 mr-2" />
                Enter details manually
              </AuroraButton>
            </Link>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] pt-4 flex items-center justify-center gap-2">
            <Shield className="w-3 h-3" />
            Your PDF is read once to extract numbers and deleted within 24 hours.
          </p>
        </div>

        {/* THREE VALUE PROPS */}
        <div className="grid md:grid-cols-3 gap-6 w-full mb-32">
          <GlowCard customSize glowColor="blue" className="bg-[var(--bg-surface)]/80 border border-[var(--border-subtle)] flex flex-col p-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-[var(--brand-primary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">What Form 16 doesn't tell you</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Your Form 16 shows what happened last year. It doesn't show what you missed — wrong regime, unused 80C, NPS you never knew existed, senior parent deduction nobody mentioned. <br /><br />
              <strong>We find the gaps.</strong>
            </p>
          </GlowCard>

          <GlowCard customSize glowColor="purple" className="bg-[var(--bg-surface)]/80 border border-[var(--border-subtle)] flex flex-col p-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-secondary)]/10 flex items-center justify-center mb-6">
              <Calculator className="w-6 h-6 text-[var(--brand-secondary)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Old regime or new — it's not obvious</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Most people pick one and hope for the best. The right answer depends on your rent, home loan, health insurance, and employer NPS. <br /><br />
              <strong>We calculate both with your actual numbers and tell you which one wins and why.</strong>
            </p>
          </GlowCard>

          <GlowCard customSize glowColor="green" className="bg-[var(--bg-surface)]/80 border border-[var(--border-subtle)] flex flex-col p-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--success)]/10 flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-[var(--success)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">A plan that covers the whole year</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Tax saving isn't a February activity. We show you what to invest, in what, how much each month, and the exact date to submit proofs to your employer in January. <br /><br />
              <strong>No scrambling in March.</strong>
            </p>
          </GlowCard>
        </div>

        {/* SECTION 4: HOW IT WORKS */}
        <div className="w-full mb-40">
          <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-16 text-center tracking-tight">How it works</h2>
          <div className="max-w-6xl mx-auto">
            <CircularTestimonials 
              testimonials={[
                {
                  name: "Step 1",
                  designation: "Upload your Form 16",
                  quote: "The PDF your employer sends every May or June. If you don't have it yet, enter your salary details manually.",
                  src: "/upload-animation.gif"
                },
                {
                  name: "Step 2",
                  designation: "We find what was missed",
                  quote: "We check your regime choice, HRA claim, 80C headroom, 80D limits, and the NPS deduction most people skip entirely.",
                  src: "/find-animation.gif"
                },
                {
                  name: "Step 3",
                  designation: "You get a plan, not just a number",
                  quote: "Section-wise: what to invest, where, how much per month, and when to act across the full financial year.",
                  src: "/plan-animation.gif"
                },
                {
                  name: "Step 4",
                  designation: "Download Form 12BB",
                  quote: "The investment declaration form HR asks for every January. Pre-filled from your plan. Download and send.",
                  src: "/download-animation.gif"
                }
              ]}
              autoplay={true}
            />
          </div>
        </div>

        {/* SECTION 5: WHO IS MONEY OS FOR? (Symmetric Floating Cluster) */}
        <div className="w-full mt-16 mb-[220px] relative">
          <div className="absolute inset-0 bg-[var(--brand-primary)]/5 blur-[150px] rounded-full" />
          <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-16 text-center tracking-tight relative z-10">Who is Money OS for?</h2>
          
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto px-6 relative z-10 -mt-[5px]">
            {/* Card 1: Salaried */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="p-8 md:p-12 rounded-[48px] bg-white/5 dark:bg-zinc-900/30 backdrop-blur-3xl border border-white/5 shadow-2xl flex items-center gap-8 transition-all hover:bg-white/10"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-blue-500/10 flex items-center justify-center shadow-inner">
                <Briefcase className="w-8 h-8 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white">The salaried employee</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  who gets a Form 16 every year, files ITR in July, and has no idea if they paid the right amount.
                </p>
              </div>
            </motion.div>
            
            {/* Card 2: ELSS */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="p-8 md:p-12 rounded-[48px] bg-white/5 dark:bg-zinc-900/30 backdrop-blur-3xl border border-white/5 shadow-2xl flex items-center gap-8 transition-all hover:bg-white/10"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-purple-500/10 flex items-center justify-center shadow-inner">
                <PieChart className="w-8 h-8 text-purple-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white">The ELSS investor</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  every March without knowing if their 80C was already full or whether Old Regime even applies.
                </p>
              </div>
            </motion.div>

            {/* Card 3: First-time */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="p-8 md:p-12 rounded-[48px] bg-white/5 dark:bg-zinc-900/30 backdrop-blur-3xl border border-white/5 shadow-2xl flex items-center gap-8 transition-all hover:bg-white/10"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center shadow-inner">
                <Zap className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white">The first-time earner</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  who doesn't know what 80C is, got put in New Regime by default, and has never spoken to a CA.
                </p>
              </div>
            </motion.div>

            {/* Card 4: Job Changer */}
            <motion.div 
              animate={{ y: [0, -18, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="p-8 md:p-12 rounded-[48px] bg-white/5 dark:bg-zinc-900/30 backdrop-blur-3xl border border-white/5 shadow-2xl flex items-center gap-8 transition-all hover:bg-white/10"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
                <ArrowRightLeft className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white">The job changer</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  who has two Form 16s, isn't sure if their combined TDS was correct, and doesn't want a surprise notice.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FAQ SECTION */}
        <div className="w-full max-w-3xl mx-auto mb-32 mt-[-20px]">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FAQItem 
              question="What is Form 16?" 
              answer="Your employer sends it every year, usually in May or June. It's a summary of your salary and how much tax was deducted. Think of it as a receipt for last year's taxes." 
            />
            <FAQItem 
              question="Which regime should I pick — Old or New?" 
              answer="It depends on your specific situation — your rent, home loan, health insurance, and other deductions. There's no universal answer. Upload your Form 16 or enter your details and we'll calculate both." 
            />
            <FAQItem 
              question="What if I don't have my Form 16 yet?" 
              answer="Enter your salary details manually. It takes about 3 minutes. You can always upload Form 16 later to verify and update." 
            />
            <FAQItem 
              question="What does Money OS actually do?" 
              answer="It reads your financial details, computes your tax under both regimes, identifies deductions you haven't used, and gives you a month-by-month plan for the current financial year. It does not file your ITR, execute investments, or manage your money in any way." 
            />
            <FAQItem 
              question="Is my Form 16 stored?" 
              answer="No. It's processed to extract the numbers and deleted within 24 hours. We don't store the PDF. We only keep the extracted fields if you save your plan." 
            />
            <FAQItem 
              question="What if I changed jobs and have two Form 16s?" 
              answer="Upload both. We combine the income from both employers, check whether your total TDS was sufficient, and flag any advance tax you may owe before March 15." 
            />
            <FAQItem 
              question="Does this replace a CA?" 
              answer="No. Money OS gives you the planning layer — what to claim, which regime, how to allocate. A CA handles ITR filing, complex capital gains, business income, and tax notices. We tell you what to do. A CA handles the formal paperwork." 
            />
            <FAQItem 
              question="Is it really free?" 
              answer="Yes. There's no subscription, no freemium wall, and no investment product being sold to you. The planning tool is completely free." 
            />
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-4">
                {/* Logo removed */}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Financial planning for Indian salaried taxpayers.<br />
                Free · FY 2025–26
              </p>
            </div>
            <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
              <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Use</Link>
              <Link href="/help" className="hover:text-[var(--text-primary)] transition-colors">Help</Link>
              <Link href="/contact" className="hover:text-[var(--text-primary)] transition-colors">Contact</Link>
            </div>
          </div>
          <div className="pt-8 border-t border-[var(--border-subtle)]/50">
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed text-center md:text-left">
              Money OS provides tax planning information for general educational purposes. 
              It is not a registered investment advisor or tax consultant. 
              For personalised advice, consult a qualified Chartered Accountant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
