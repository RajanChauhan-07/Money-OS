'use client'

import { motion } from "framer-motion";
import { NavHeader } from "@/components/ui";
import { Shield, Lock, EyeOff } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">Privacy Policy</h1>
            <p className="text-lg text-[var(--text-secondary)]">How we keep your data safe and private.</p>
          </div>

          <div className="p-12 md:p-20 rounded-[48px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl shadow-2xl">
            <p className="text-2xl md:text-3xl text-[var(--text-primary)] leading-relaxed font-semibold">
              Hey User, I built Money OS because I was tired of financial tools that treated our personal data like a product to be sold. Here, your privacy isn't just a feature—it's our foundation. We don't sell your data to banks or advertisers, and we never will. When you upload a Form 16, we process it, give you the answers you need, and delete the file within twenty-four hours. Your financial journey is yours alone, and we’re just here to provide the secure, encrypted space you need to plan your future with total peace of mind.
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
