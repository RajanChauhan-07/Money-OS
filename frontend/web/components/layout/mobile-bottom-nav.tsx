'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Banknote, LayoutDashboard, PieChart, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const dockItems = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Plan', href: '/plan/summary', icon: PieChart },
  { label: 'Invest', href: '/invest', icon: Banknote },
  { label: 'Track', href: '/tracker', icon: TrendingUp },
  { label: 'Goals', href: '/tracker/goals', icon: Target },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-2 py-2 backdrop-blur md:hidden">
      <nav className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {dockItems.map((item) => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[60px] flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-medium transition-all',
                active
                  ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)]'
              )}
            >
              <item.icon size={18} className={active ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)]'} />
              <span className="mt-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
