'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { MobileTopbar } from '@/components/layout/mobile-topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="relative flex items-start min-h-screen bg-transparent overflow-hidden">
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col relative z-10">
        <MobileTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 custom-scrollbar">
          <div className="mx-auto max-w-[1340px] w-full">{children}</div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
