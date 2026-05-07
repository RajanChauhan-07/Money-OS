import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ComingSoon } from '@/components/ui'
import { getAppScreen } from '@/lib/screen-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ screen?: string[] }>
}): Promise<Metadata> {
  const { screen: slugParts } = await params
  const slug = slugParts?.[0]
  if (slug === 'portfolio') return { title: 'Portfolio Tracker | Money OS', description: 'Track your investment portfolio' }
  if (slug === 'goals') return { title: 'Goals Tracker | Money OS', description: 'Track your financial goals' }
  const screen = getAppScreen('tracker', slug)
  if (!screen) return { title: 'Not Found' }
  return { title: screen.title, description: screen.description }
}

export default async function TrackerPage({
  params,
}: {
  params: Promise<{ screen?: string[] }>
}) {
  const { screen: slugParts } = await params
  const slug = slugParts?.[0]

  // These are handled by dedicated page.tsx in their own folders
  // This catch-all only handles remaining tracker routes
  if (!slug || slug === 'calendar') {
    return <ComingSoon title="Calendar" description="Calendar integration is coming soon." />
  }

  const screen = getAppScreen('tracker', slug)
  if (!screen) notFound()

  return <ComingSoon title={screen.title} description={screen.description ?? ''} />
}
