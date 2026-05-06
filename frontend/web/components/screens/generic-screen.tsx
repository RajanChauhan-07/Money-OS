'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  Info,
  ShieldCheck,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@money-os/ui'
import { MetricCard, SectionProgress } from '@/components/ui'
import { cn } from '@/lib/utils'
import { formatRupee } from '@/lib/utils/format'
import type { ScreenBlock, ScreenConfig, ScreenField, ScreenVariant } from '@/lib/screen-types'
import { MotionPage } from './motion-page'

const toneClasses = {
  brand: 'border-[var(--brand-primary)]/20 bg-[var(--info-bg)] text-[var(--brand-primary)]',
  success: 'border-[var(--success)]/20 bg-[var(--success-bg)] text-[var(--success)]',
  warning: 'border-[var(--warning)]/20 bg-[var(--warning-bg)] text-[var(--warning)]',
  danger: 'border-[var(--danger)]/20 bg-[var(--danger-bg)] text-[var(--danger)]',
  info: 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
}

function ActionButtons({
  primaryAction,
  secondaryAction,
}: Pick<ScreenConfig, 'primaryAction' | 'secondaryAction'>) {
  if (!primaryAction && !secondaryAction) return null

  return (
    <div className="flex flex-wrap gap-3">
      {primaryAction && (
        <Link href={primaryAction.href}>
          <Button variant={primaryAction.variant ?? 'primary'} size="lg">
            {primaryAction.label}
          </Button>
        </Link>
      )}
      {secondaryAction && (
        <Link href={secondaryAction.href}>
          <Button variant={secondaryAction.variant ?? 'outline'} size="lg">
            {secondaryAction.label}
          </Button>
        </Link>
      )}
    </div>
  )
}

function FieldDemo({ field }: { field: ScreenField }) {
  const [toggleValue, setToggleValue] = useState(Boolean(field.value))
  const [sliderValue, setSliderValue] = useState(Number(field.value ?? field.min ?? 0))
  const commonHint = field.hint ? <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{field.hint}</p> : null

  if (field.type === 'toggle') {
    return (
      <div className="surface-panel p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{field.label}</p>
            {field.hint && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.hint}</p>}
          </div>
          <button
            type="button"
            aria-pressed={toggleValue}
            onClick={() => setToggleValue((value) => !value)}
            className={cn(
              'relative h-7 w-12 rounded-full border transition-all',
              toggleValue
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]'
                : 'border-[var(--border-default)] bg-[var(--bg-elevated)]'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white transition-all',
                toggleValue ? 'left-[24px]' : 'left-0.5'
              )}
            />
          </button>
        </div>
      </div>
    )
  }

  if (field.type === 'slider') {
    return (
      <div className="surface-panel p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{field.label}</p>
            {field.hint && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{field.hint}</p>}
          </div>
          <span className="text-sm font-semibold text-[var(--brand-primary)]">{sliderValue}</span>
        </div>
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={sliderValue}
          onChange={(event) => setSliderValue(Number(event.target.value))}
          className="mt-4 w-full accent-[var(--brand-primary)]"
        />
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{field.label}</label>
        <select
          defaultValue={String(field.value ?? '')}
          className="h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)]"
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {commonHint}
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{field.label}</label>
        <textarea
          defaultValue={String(field.value ?? '')}
          rows={4}
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2.5 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-primary)]"
        />
        {commonHint}
      </div>
    )
  }

  if (field.type === 'otp' || field.type === 'pin') {
    const digits = String(field.value ?? '').split(/\s+/).filter(Boolean)

    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{field.label}</label>
        <div className="flex flex-wrap gap-2">
          {digits.map((digit, index) => (
            <div
              key={`${field.label}-${index}`}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] text-lg font-semibold text-[var(--text-primary)]"
            >
              {digit}
            </div>
          ))}
        </div>
        {commonHint}
      </div>
    )
  }

  return (
    <Input
      label={field.label}
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
      defaultValue={field.value !== undefined ? String(field.value) : field.placeholder}
      placeholder={field.placeholder}
    />
  )
}

function BlockTitle({
  title,
  description,
}: {
  title?: string
  description?: string
}) {
  if (!title && !description) return null

  return (
    <div className="space-y-1">
      {title && <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>}
      {description && <p className="text-sm text-[var(--text-secondary)]">{description}</p>}
    </div>
  )
}

function formatChartValue(value: number) {
  return value > 999 ? formatRupee(value, true) : value.toString()
}

function renderBlock(block: ScreenBlock, index: number) {
  if (block.type === 'banner') {
    const tone = block.tone ?? 'info'
    const toneMap = {
      info: { icon: Info, classes: toneClasses.info },
      success: { icon: CheckCircle2, classes: toneClasses.success },
      warning: { icon: AlertTriangle, classes: toneClasses.warning },
      danger: { icon: ShieldCheck, classes: toneClasses.danger },
    }
    const Icon = toneMap[tone].icon

    return (
      <div key={index} className={cn('surface-panel p-4', toneMap[tone].classes)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{block.title}</p>
              <p className="mt-1 text-sm opacity-90">{block.description}</p>
            </div>
          </div>
          {block.action && (
            <Link href={block.action.href}>
              <Button variant={block.action.variant ?? 'outline'} size="sm">
                {block.action.label}
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'metrics') {
    return (
      <div key={index} className="space-y-4">
        <BlockTitle title={block.title} description={block.description} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {block.items.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'section-progress') {
    const showHeader = Boolean(block.title || block.description)

    return (
      <Card key={index}>
        {showHeader && (
          <CardHeader>
            <BlockTitle title={block.title} description={block.description} />
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {block.items.map((item) => (
            <SectionProgress key={`${item.section}-${item.label}`} {...item} />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (block.type === 'cards') {
    return (
      <div key={index} className="space-y-4">
        <BlockTitle title={block.title} description={block.description} />
        <div className={cn('grid gap-4', block.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
          {block.items.map((item) => (
            <div key={`${item.title}-${item.description}`} className="surface-panel p-5">
              {item.eyebrow && <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{item.eyebrow}</p>}
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
                </div>
                {item.value && (
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-semibold',
                      toneClasses[item.tone ?? 'brand']
                    )}
                  >
                    {item.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'fields') {
    const showHeader = Boolean(block.title || block.description)

    return (
      <Card key={index}>
        {showHeader && (
          <CardHeader>
            <BlockTitle title={block.title} description={block.description} />
          </CardHeader>
        )}
        <CardContent className={cn('grid gap-4', block.columns === 3 ? 'md:grid-cols-3' : block.columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1')}>
          {block.items.map((field) => (
            <FieldDemo key={field.label} field={field} />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (block.type === 'list') {
    const showHeader = Boolean(block.title || block.description)

    return (
      <Card key={index}>
        {showHeader && (
          <CardHeader>
            <BlockTitle title={block.title} description={block.description} />
          </CardHeader>
        )}
        <CardContent>
          {block.style === 'chip' ? (
            <div className="flex flex-wrap gap-2">
              {block.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {block.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                  {block.style === 'check' ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--success)]" />
                  ) : (
                    <Circle size={8} className="mt-1.5 shrink-0 fill-current text-[var(--brand-primary)]" />
                  )}
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    )
  }

  if (block.type === 'table') {
    const showHeader = Boolean(block.title || block.description)

    return (
      <Card key={index}>
        {showHeader && (
          <CardHeader>
            <BlockTitle title={block.title} description={block.description} />
          </CardHeader>
        )}
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[var(--text-tertiary)]">
                {block.columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn('px-3 py-3 font-medium', column.align === 'right' && 'text-right')}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  {block.columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-3 py-3 text-[var(--text-secondary)]', column.align === 'right' && 'text-right')}
                    >
                      {String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    )
  }

  if (block.type === 'timeline') {
    const showHeader = Boolean(block.title || block.description)

    return (
      <Card key={index}>
        {showHeader && (
          <CardHeader>
            <BlockTitle title={block.title} description={block.description} />
          </CardHeader>
        )}
        <CardContent className="space-y-5">
          {block.items.map((item, itemIndex) => (
            <div key={`${item.title}-${itemIndex}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'mt-0.5 h-3 w-3 rounded-full',
                    item.status === 'done' && 'bg-[var(--success)]',
                    item.status === 'active' && 'bg-[var(--brand-primary)]',
                    (!item.status || item.status === 'upcoming') && 'bg-[var(--border-default)]'
                  )}
                />
                {itemIndex < block.items.length - 1 && <div className="mt-2 h-full w-px bg-[var(--border-subtle)]" />}
              </div>
              <div className="pb-5">
                {item.meta && <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{item.meta}</p>}
                <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (block.type === 'chart') {
    const colors = block.colors ?? ['var(--brand-primary)', 'var(--brand-accent)', 'var(--brand-secondary)']
    const showHeader = Boolean(block.title || block.description)

    return (
      <Card key={index}>
        {showHeader && (
          <CardHeader>
            <BlockTitle title={block.title} description={block.description} />
          </CardHeader>
        )}
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {block.variant === 'line' ? (
              <LineChart data={block.data}>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey={block.xKey} stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(value) => formatChartValue(Number(value))} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => formatRupee(Number(value))}
                />
                <Line type="monotone" dataKey={block.yKey} stroke="var(--brand-primary)" strokeWidth={3} dot={false} />
              </LineChart>
            ) : block.variant === 'bar' ? (
              <BarChart data={block.data}>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey={block.xKey} stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(value) => formatChartValue(Number(value))} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => formatRupee(Number(value))}
                />
                <Bar dataKey={block.yKey} fill="var(--brand-primary)" radius={[8, 8, 0, 0]} />
                {block.secondaryKey && <Bar dataKey={block.secondaryKey} fill="var(--brand-accent)" radius={[8, 8, 0, 0]} />}
              </BarChart>
            ) : (
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number, name: string) => [formatRupee(Number(value)), name]}
                />
                <Pie
                  data={block.data}
                  dataKey={block.yKey}
                  nameKey={block.labelKey}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {block.data.map((entry, entryIndex) => (
                    <Cell key={entryIndex} fill={colors[entryIndex % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }

  if (block.type === 'cta') {
    const showHeader = Boolean(block.title || block.description)

    return (
      <Card key={index}>
        {showHeader && (
          <CardHeader>
            {block.title && <CardTitle>{block.title}</CardTitle>}
            {block.description && <CardDescription>{block.description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="flex flex-wrap gap-3">
          {block.primary && (
            <Link href={block.primary.href}>
              <Button variant={block.primary.variant ?? 'primary'}>
                {block.primary.label}
              </Button>
            </Link>
          )}
          {block.secondary && (
            <Link href={block.secondary.href}>
              <Button variant={block.secondary.variant ?? 'outline'}>
                {block.secondary.label}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}

export function GenericScreen({
  screen,
  variant,
}: {
  screen: ScreenConfig
  variant: ScreenVariant
}) {
  const chromeClass = useMemo(() => {
    if (variant === 'auth') return 'surface-panel overflow-hidden p-6 md:p-8'
    if (variant === 'edge') return 'surface-panel p-6 md:p-8'
    return ''
  }, [variant])

  return (
    <MotionPage>
      <section className={chromeClass}>
        <div className={cn('flex flex-col gap-6', variant === 'auth' && 'md:flex-row md:items-end md:justify-between')}>
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              {screen.badge && (
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  {screen.badge}
                </span>
              )}
              <span className="text-xs text-[var(--text-tertiary)]">{screen.id}</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
              {screen.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] md:text-base">
              {screen.description}
            </p>
            {screen.meta && (
              <div className="mt-4 flex flex-wrap gap-2">
                {screen.meta.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="shrink-0">
            <ActionButtons primaryAction={screen.primaryAction} secondaryAction={screen.secondaryAction} />
          </div>
        </div>
      </section>
      {screen.blocks.map((block, index) => renderBlock(block, index))}
    </MotionPage>
  )
}
