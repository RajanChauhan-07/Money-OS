'use client'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

interface MobileTopbarProps {
  onMenuClick: () => void
}

export function MobileTopbar({ onMenuClick }: MobileTopbarProps) {
  const pathname = usePathname()
  const label = pathname === '/dashboard'
    ? 'Dashboard'
    : pathname
        .split('/')
        .filter(Boolean)
        .slice(-1)[0]
        ?.replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Money OS'

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-4 py-3 backdrop-blur md:hidden">
      <button onClick={onMenuClick} className="rounded-md p-2 hover:bg-[var(--bg-elevated)]">
        <Menu size={20} className="text-[var(--text-secondary)]" />
      </button>
      <div className="text-center">
        <span className="block text-[11px] uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Money OS</span>
        <span className="block text-[14px] font-semibold text-[var(--text-primary)]">{label}</span>
      </div>
      <div className="w-9" /> {/* Spacer for alignment */}
    </div>
  )
}
