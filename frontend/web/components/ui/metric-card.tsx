'use client'

import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { GlowCard } from './glow-card'

interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  accent?: 'brand' | 'success' | 'warning' | 'danger'
  className?: string
  onClick?: () => void
}

export function MetricCard({ label, value, subValue, trend, trendLabel, accent = 'brand', className, onClick }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendColor = trend === 'up' ? 'text-[var(--success)]' : trend === 'down' ? 'text-[var(--danger)]' : 'text-[var(--text-tertiary)]'
  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined}>
      <GlowCard customSize glowColor="blue" className={cn('metric-card cursor-pointer group transition-all hover:border-[var(--border-default)] hover:shadow-md bg-[var(--bg-surface)] border border-[var(--border-subtle)]', className)}>
        <p className="text-[13px] text-[var(--text-secondary)] mb-2 font-medium">{label}</p>
        <p className="text-[28px] font-semibold text-[var(--text-primary)] leading-none tracking-tight">{value}</p>
        {(subValue || trend) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend && <TrendIcon size={14} className={trendColor} />}
            {trendLabel && <span className={cn('text-[12px]', trendColor)}>{trendLabel}</span>}
            {subValue && <span className="text-[12px] text-[var(--text-tertiary)]">{subValue}</span>}
          </div>
        )}
      </GlowCard>
    </div>
  )
}
