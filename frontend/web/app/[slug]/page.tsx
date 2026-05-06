import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GenericScreen } from '@/components/screens/generic-screen'
import { OnboardShell } from '@/components/layout/onboard-shell'
import { getTopLevelScreen } from '@/lib/screen-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const match = getTopLevelScreen(slug)

  if (!match) {
    return { title: 'Not Found' }
  }

  return {
    title: match.screen.title,
    description: match.screen.description,
  }
}

export default async function TopLevelScreenPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const match = getTopLevelScreen(slug)

  if (!match) notFound()

  if (match.variant === 'onboard') {
    return (
      <OnboardShell slug={slug}>
        <GenericScreen screen={match.screen} variant="onboard" />
      </OnboardShell>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] px-4 py-6 md:px-6 md:py-8">
      <div className={match.variant === 'auth' ? 'mx-auto max-w-[1120px]' : 'mx-auto max-w-[1040px]'}>
        <GenericScreen screen={match.screen} variant={match.variant} />
      </div>
    </div>
  )
}
