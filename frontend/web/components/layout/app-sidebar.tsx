'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
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
  { label: 'Summary', href: '/plan/summary', icon: FileText },
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
        <AnimatePresence>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    )
  }

  const SidebarContent = () => (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'flex h-fit max-h-[calc(100vh-1.5rem)] flex-col mx-4 mt-2 mb-4 rounded-[2.5rem] border border-white/10 dark:border-white/5 bg-white/70 dark:bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden relative z-30'
      )}
    >
      <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5 h-20">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              key="header"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center"
            >
              <span className="block text-[18px] font-black tracking-tighter text-[var(--text-primary)]">Money OS</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-xl p-2 text-[var(--text-tertiary)] transition-all hover:bg-white/10 hover:text-[var(--text-primary)]",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft size={18} className={cn('transition-transform duration-500', collapsed && 'rotate-180')} />
        </button>
      </div>
      
      <nav className="p-4 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <div className="space-y-1">
          {navItems.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
        <div className="my-6 border-t border-white/10 dark:border-white/5 mx-2" />
        <div className="space-y-1">
          {secondaryNav.map((item) => <NavItem key={item.href} item={item} />)}
        </div>
      </nav>

      <AnimatePresence>
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="m-4 rounded-3xl border border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 p-5 backdrop-blur-md shadow-inner group/profile transition-all hover:bg-white/40 dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold shadow-md">
                 {mockUser.name.charAt(0)}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-[13px] font-bold text-[var(--text-primary)] truncate">{mockUser.name}</p>
                 <p className="text-[10px] text-[var(--text-tertiary)] truncate">Premium User</p>
               </div>
            </div>
            <Link
              href="/tracker"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-[var(--brand-primary)] text-white text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--brand-primary)]/20"
            >
              Review annual plan <ArrowRight size={12} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className={cn("hidden md:flex flex-shrink-0 transition-all duration-300", collapsed ? "w-[104px]" : "w-[280px]")}>
        <SidebarContent />
      </div>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <motion.div 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="absolute bottom-0 left-0 top-0 w-[280px]"
          >
            <SidebarContent />
          </motion.div>
        </div>
      )}
    </>
  )
}
