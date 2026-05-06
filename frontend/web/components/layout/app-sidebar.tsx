'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Banknote,
  Calendar,
  ChevronLeft,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Moon,
  PieChart,
  Receipt,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react'
import { mockUser } from '@/lib/mock-data'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Tax Plan', href: '/tax/result', icon: Receipt },
  { label: 'Allocation', href: '/plan/80c', icon: PieChart },
  { label: 'Cash Flow', href: '/plan/cashflow', icon: TrendingUp },
  { label: 'Invest', href: '/invest', icon: Banknote },
  { label: 'Portfolio', href: '/tracker/portfolio', icon: BarChart3 },
  { label: 'Goals', href: '/tracker/goals', icon: Target },
  { label: 'Calendar', href: '/tracker/calendar', icon: Calendar },
]
const secondaryNav = [
  { label: 'Reports', href: '/reports/tax', icon: FileText },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface AppSidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export function AppSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: AppSidebarProps) {
  const pathname = usePathname()

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all',
          active
            ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
        )}
      >
        <item.icon
          size={18}
          className={cn(
            'flex-shrink-0',
            active ? 'text-[var(--brand-primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div
      className={cn(
        'flex h-full flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-md">
              <span className="text-[12px] font-bold">M</span>
            </div>
            <div>
              <span className="block text-[14px] font-semibold text-[var(--text-primary)]">Money OS</span>
              <span className="block text-[11px] text-[var(--text-tertiary)]">FY 2025-26 planner</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)]"
        >
          <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => <NavItem key={item.href} item={item} />)}
        <div className="my-3 border-t border-[var(--border-subtle)]" />
        {secondaryNav.map((item) => <NavItem key={item.href} item={item} />)}
      </nav>
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Profile</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{mockUser.name}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Ready to unlock another {mockUser.kycStatus === 'verified' ? 'tax win' : 'KYC step'}.</p>
          <Link
            href="/tracker"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-primary)]"
          >
            Review annual plan <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0"><SidebarContent /></div>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 top-0 w-[248px]"><SidebarContent /></div>
        </div>
      )}
    </>
  )
}
