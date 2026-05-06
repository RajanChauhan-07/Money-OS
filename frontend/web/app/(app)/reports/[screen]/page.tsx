import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ReportScreen } from '@/components/screens/report-screen'
import { getAppScreen } from '@/lib/screen-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ screen: string }>
}): Promise<Metadata> {
  const { screen: slug } = await params
  const screen = getAppScreen('reports', slug)

  if (!screen) return { title: 'Not Found' }

  return { title: screen.title, description: screen.description }
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ screen: string }>
}) {
  const { screen: slug } = await params
  const screen = getAppScreen('reports', slug)

  if (!screen) notFound()

  return <ReportScreen screenSlug={slug} />
}
