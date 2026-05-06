import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ComingSoon } from '@/components/ui'
import { getAppScreen } from '@/lib/screen-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ screen: string }>
}): Promise<Metadata> {
  const { screen: slug } = await params
  const screen = getAppScreen('tax', slug)

  if (!screen) return { title: 'Not Found' }

  return { title: screen.title, description: screen.description }
}

export default async function TaxSubPage({
  params,
}: {
  params: Promise<{ screen: string }>
}) {
  const { screen: slug } = await params
  const screen = getAppScreen('tax', slug)

  if (!screen) notFound()

  return <ComingSoon title={screen.title} description={screen.description} />
}
