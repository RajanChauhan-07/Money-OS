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
  const screen = getAppScreen('invest', slugParts?.[0])

  if (!screen) return { title: 'Not Found' }

  return { title: screen.title, description: screen.description }
}

export default async function InvestPage({
  params,
}: {
  params: Promise<{ screen?: string[] }>
}) {
  const { screen: slugParts } = await params
  const screen = getAppScreen('invest', slugParts?.[0])

  if (!screen) notFound()

  return <ComingSoon title="Investments & Portfolio" description="Real-time execution and tracking is in development." />
}
