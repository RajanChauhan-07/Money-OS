'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SectionProgressProps {
  label: string
  used: number
  max: number
  section: '80C' | '80D' | 'NPS' | 'HRA'
  showWarning?: boolean
}

const sectionColor: Record<string, string> = {
  '80C': 'var(--section-80c)',
  '80D': 'var(--section-80d)',
  'NPS': 'var(--section-nps)',
  'HRA': 'var(--section-hra)',
}

const sectionLinks: Record<string, string> = {
  '80C': '/plan/80c',
  '80D': '/plan/80d',
  'NPS': '/plan/nps',
  'HRA': '/setup',
}

export function SectionProgress({ label, used, max, section, showWarning }: SectionProgressProps) {
  const router = useRouter()
  const percent = Math.min((used / max) * 100, 100)
  const headroom = max - used
  const isFull = percent >= 99.9
  const isNearFull = percent >= 85 && !isFull
  const isEmpty = percent < 10

  const handleClick = () => {
    router.push(sectionLinks[section])
  }

  return (
    <div 
      className="group/progress space-y-2 cursor-pointer transition-opacity hover:opacity-80"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-semibold transition-transform group-hover/progress:scale-105"
            style={{
              backgroundColor: `color-mix(in srgb, ${sectionColor[section]} 16%, transparent)`,
              color: sectionColor[section],
            }}
          >
            §{section}
          </span>
          <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
        </div>
        <span className="text-[12px] text-[var(--text-secondary)]">₹{(used/1000).toFixed(0)}K / ₹{(max/1000).toFixed(0)}K</span>
      </div>
      <div className="section-bar">
        <div className="section-bar-fill" style={{ width: `${percent}%`, background: sectionColor[section] }} />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[var(--text-tertiary)]">{percent.toFixed(0)}% utilized</span>
        {isEmpty && <span className="text-[11px] text-[var(--warning)]">₹{(headroom/1000).toFixed(0)}K opportunity</span>}
        {isFull && <span className="text-[11px] text-[var(--success)] font-medium">Fully maxed ✓</span>}
        {isNearFull && !isEmpty && <span className="text-[11px] text-[var(--success)]">Nearly maxed ✓</span>}
        {!isEmpty && !isFull && !isNearFull && <span className="text-[11px] text-[var(--text-tertiary)]">₹{(headroom/1000).toFixed(0)}K remaining</span>}
      </div>
    </div>
  )
}
