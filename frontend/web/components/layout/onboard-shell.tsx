'use client'

import Link from 'next/link'
import { Moon, Sparkles, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const steps = [
  { slug: 'salary', label: 'Salary' },
  { slug: 'structure', label: 'Structure' },
  { slug: 'employer', label: 'Employer' },
  { slug: 'life', label: 'Life' },
  { slug: 'investments', label: 'Investments' },
  { slug: 'goals', label: 'Goals' },
  { slug: 'risk', label: 'Risk' },
]

export function OnboardShell({
  slug,
  children,
}: {
  slug: string
  children: React.ReactNode
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const stepIndex = Math.max(
    steps.findIndex((step) => step.slug === slug),
    0
  )

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/welcome" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Money OS Setup</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Annual savings profiler</p>
            </div>
          </Link>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-[var(--text-secondary)] transition hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
          >
            {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <div className="mx-auto hidden max-w-[1100px] gap-3 px-6 pb-4 md:grid md:grid-cols-7">
          {steps.map((step, index) => {
            const state = index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'idle'

            return (
              <div key={step.slug} className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span
                    className={cn(
                      state === 'active' && 'text-[var(--brand-primary)]',
                      state === 'done' && 'text-[var(--success)]',
                      state === 'idle' && 'text-[var(--text-tertiary)]'
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-[var(--text-tertiary)]">0{index + 1}</span>
                </div>
                <div className="section-bar">
                  <div
                    className="section-bar-fill"
                    style={{
                      width: state === 'done' ? '100%' : state === 'active' ? '58%' : '18%',
                      background:
                        state === 'done'
                          ? 'var(--success)'
                          : state === 'active'
                            ? 'var(--brand-primary)'
                            : 'var(--border-default)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6 md:py-8">{children}</div>
    </div>
  )
}
