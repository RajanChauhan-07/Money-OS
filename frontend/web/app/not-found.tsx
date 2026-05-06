import Link from 'next/link'
import { Button } from '@money-os/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="surface-panel max-w-lg p-8 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">This screen wandered off.</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          The route does not map to one of the Money OS flows right now.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard">
            <Button size="lg">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
