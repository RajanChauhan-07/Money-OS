'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowRight, Award, CheckCircle2, ChevronDown, Gauge, Heart, Home, PiggyBank, Target, TrendingUp, AlertTriangle, ArrowLeftRight } from 'lucide-react'
import { Insight } from '@money-os/types'
import { cn } from '@/lib/utils'
import { formatRupee } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'

const iconMap: Record<string, React.ElementType> = {
  AlertCircle, PiggyBank, TrendingUp, Home, Heart, ArrowLeftRight, Building: Home, AlertTriangle, Gauge, Award, CheckCircle2
}

interface InsightCardProps {
  insight: Insight
}

export function InsightCard({ insight }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()
  
  const Icon = iconMap[insight.icon] || AlertCircle

  const colors = {
    danger: "text-[var(--danger)] bg-[var(--danger)]/5 border-[var(--danger)]/20",
    warning: "text-[var(--warning)] bg-[var(--warning)]/5 border-[var(--warning)]/20",
    success: "text-[var(--success)] bg-[var(--success)]/5 border-[var(--success)]/20",
    info: "text-[var(--brand-primary)] bg-[var(--brand-primary)]/5 border-[var(--brand-primary)]/20",
  }

  const iconColors = {
    danger: "text-[var(--danger)]",
    warning: "text-[var(--warning)]",
    success: "text-[var(--success)]",
    info: "text-[var(--brand-primary)]",
  }

  return (
    <div className={cn("rounded-2xl border transition-all duration-300", colors[insight.severity])}>
      <div 
        className="p-5 cursor-pointer select-none flex items-start gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("mt-1 shrink-0", iconColors[insight.severity])}>
          <Icon size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {insight.section}
                </span>
                {insight.potentialSaving > 0 && (
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", colors[insight.severity])}>
                    Saves {formatRupee(insight.potentialSaving)}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                {insight.title}
              </h3>
            </div>
            
            <button className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              <ChevronDown size={18} className={cn("transition-transform duration-300", expanded ? "rotate-180" : "")} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 pl-[60px]">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                {insight.description}
              </p>
              
              {insight.actionText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (insight.actionRoute) {
                      router.push(insight.actionRoute)
                    }
                  }}
                  className="inline-flex items-center text-sm font-medium hover:underline transition-all"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  {insight.actionText}
                  <ArrowRight size={14} className="ml-1" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
