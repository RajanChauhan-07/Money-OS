'use client'

import { motion } from "framer-motion";
import { Mail, MessageCircle, Twitter } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[var(--brand-primary)]/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">Contact Us</h1>
            <p className="text-lg text-[var(--text-secondary)]">We're here to help you plan better.</p>
          </div>

          <div className="grid gap-4">
            <div className="p-6 rounded-[32px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl flex items-center gap-6 group transition-all hover:bg-black/5 dark:hover:bg-white/10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Email</h2>
                <p className="text-[var(--text-secondary)]">support@money-os.com</p>
              </div>
            </div>

            <div className="p-6 rounded-[32px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl flex items-center gap-6 group transition-all hover:bg-black/5 dark:hover:bg-white/10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Twitter className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">X (Twitter)</h2>
                <p className="text-[var(--text-secondary)]">@MoneyOS_App</p>
              </div>
            </div>

            <div className="p-6 rounded-[32px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl flex items-center gap-6 group transition-all hover:bg-black/5 dark:hover:bg-white/10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Community</h2>
                <p className="text-[var(--text-secondary)]">Join our Discord community</p>
              </div>
            </div>
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
