import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PlanScreen } from '@/components/screens/plan-screen'
import { getAppScreen } from '@/lib/screen-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ screen: string }>
}): Promise<Metadata> {
  const { screen: slug } = await params
  const screen = getAppScreen('plan', slug)

  if (!screen) return { title: 'Not Found' }

  return { title: screen.title, description: screen.description }
}

export default async function PlanSubPage({
  params,
}: {
  params: Promise<{ screen: string }>
}) {
  const { screen: slug } = await params
  const screen = getAppScreen('plan', slug)

  if (!screen) notFound()

  return <PlanScreen screenSlug={slug} />
}
