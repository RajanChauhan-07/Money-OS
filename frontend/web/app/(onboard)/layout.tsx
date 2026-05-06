'use client'
import { usePathname } from 'next/navigation'
import { OnboardShell } from '@/components/layout/onboard-shell'

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const slug = pathname.split('/').filter(Boolean).at(-1) ?? 'salary'

  return <OnboardShell slug={slug}>{children}</OnboardShell>
}
