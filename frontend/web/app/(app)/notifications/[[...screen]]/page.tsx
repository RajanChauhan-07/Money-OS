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
  const screen = getAppScreen('notifications', slugParts?.[0])

  if (!screen) return { title: 'Not Found' }

  return { title: screen.title, description: screen.description }
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ screen?: string[] }>
}) {
  const { screen: slugParts } = await params
  const screen = getAppScreen('notifications', slugParts?.[0])

  if (!screen) notFound()

  return <ComingSoon title={screen.title} description={screen.description} />
}
