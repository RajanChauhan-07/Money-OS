import { Hammer } from 'lucide-react'
import { GlowCard } from './glow-card'
import { CardHeader, CardTitle, CardDescription, CardContent } from '@money-os/ui'

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center p-6">
      <GlowCard customSize glowColor="blue" className="max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            <Hammer size={32} />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="mt-2 text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            We are actively integrating the new AY 2026-27 tax engine into this module. Real-time data sync and advanced features are on the way.
          </p>
        </CardContent>
      </GlowCard>
    </div>
  )
}
