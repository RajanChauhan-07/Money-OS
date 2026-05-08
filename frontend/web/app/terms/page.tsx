'use client'

import { motion } from "framer-motion";
import { NavHeader } from "@/components/ui";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TermsOfUse() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[var(--brand-secondary)]/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">Terms of Use</h1>
            <p className="text-lg text-[var(--text-secondary)]">Simple rules for using Money OS.</p>
          </div>

          <div className="p-12 md:p-20 rounded-[48px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-2xl">
            <p className="text-2xl md:text-3xl text-[var(--text-primary)] leading-relaxed font-semibold">
              Hey User, trust is the most important part of any relationship, especially when it comes to your money. Our terms are simple: we provide the most accurate tax planning tools for the current financial year, and you provide the honest data to make them work. We aren't CAs, but we are your planning partners, helping you navigate complex laws with ease. There are no hidden traps or fine print here. We promise to keep our tax engines sharp and updated, and we ask that you take the final responsibility for your financial decisions. Let's build a better future together.
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
