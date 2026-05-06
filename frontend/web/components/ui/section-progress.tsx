'use client'

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

export function SectionProgress({ label, used, max, section, showWarning }: SectionProgressProps) {
  const percent = Math.min((used / max) * 100, 100)
  const headroom = max - used
  const isNearFull = percent >= 85
  const isEmpty = percent < 10

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
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
        {isNearFull && !isEmpty && <span className="text-[11px] text-[var(--success)]">Nearly maxed ✓</span>}
        {!isEmpty && !isNearFull && <span className="text-[11px] text-[var(--text-tertiary)]">₹{(headroom/1000).toFixed(0)}K remaining</span>}
      </div>
    </div>
  )
}
