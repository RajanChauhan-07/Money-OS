'use client'

import { motion } from "framer-motion";
import { NavHeader } from "@/components/ui";
import { HelpCircle, Zap, Calculator } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[var(--brand-primary)]/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">Help Center</h1>
            <p className="text-lg text-[var(--text-secondary)]">Everything you need to know about Money OS.</p>
          </div>

          <div className="p-12 md:p-20 rounded-[48px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-2xl">
            <p className="text-2xl md:text-3xl text-[var(--text-primary)] leading-relaxed font-semibold">
              Hey User, we designed Money OS to be so simple that you'd never actually need a manual. Whether you’re dropping in a Form 16 PDF for a three-second scan or entering your details manually in under three minutes, our goal is to get you to your tax-saving plan as fast as possible. We handle the complex math and regime comparisons so you don't have to. If you ever feel stuck, our FAQs are always ready, and my team is just an email away. We're here to make sure you never overpay on taxes again. Your planning journey starts now.
            </p>
          </div>

          <div className="text-center">
            <Link href="/" className="text-[var(--brand-primary)] hover:underline">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
