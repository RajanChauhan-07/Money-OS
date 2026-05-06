export type ScreenVariant = 'auth' | 'onboard' | 'app' | 'edge'

export interface ActionLink {
  label: string
  href: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
}

export interface ScreenMetric {
  label: string
  value: string
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}

export interface ScreenCard {
  eyebrow?: string
  title: string
  description: string
  value?: string
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info'
}

export interface ScreenField {
  label: string
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'toggle' | 'otp' | 'pin' | 'slider' | 'textarea'
  placeholder?: string
  value?: string | number | boolean
  hint?: string
  options?: string[]
  min?: number
  max?: number
  step?: number
}

export interface ScreenTableColumn {
  key: string
  label: string
  align?: 'left' | 'right'
}

export interface ScreenTimelineItem {
  title: string
  description: string
  meta?: string
  status?: 'done' | 'active' | 'upcoming'
}

export type ScreenBlock =
  | {
      type: 'banner'
      title: string
      description: string
      tone?: 'info' | 'success' | 'warning' | 'danger'
      action?: ActionLink
    }
  | {
      type: 'metrics'
      title?: string
      description?: string
      items: ScreenMetric[]
    }
  | {
      type: 'section-progress'
      title?: string
      description?: string
      items: Array<{ label: string; used: number; max: number; section: '80C' | '80D' | 'NPS' | 'HRA' }>
    }
  | {
      type: 'cards'
      title?: string
      description?: string
      columns?: 2 | 3
      items: ScreenCard[]
    }
  | {
      type: 'fields'
      title?: string
      description?: string
      columns?: 1 | 2 | 3
      items: ScreenField[]
    }
  | {
      type: 'list'
      title?: string
      description?: string
      style?: 'bullet' | 'check' | 'chip'
      items: string[]
    }
  | {
      type: 'table'
      title?: string
      description?: string
      columns: ScreenTableColumn[]
      rows: Array<Record<string, string | number>>
    }
  | {
      type: 'timeline'
      title?: string
      description?: string
      items: ScreenTimelineItem[]
    }
  | {
      type: 'chart'
      title?: string
      description?: string
      variant: 'line' | 'bar' | 'donut'
      data: Array<Record<string, string | number>>
      xKey?: string
      yKey: string
      secondaryKey?: string
      labelKey?: string
      colors?: string[]
    }
  | {
      type: 'cta'
      title?: string
      description?: string
      primary?: ActionLink
      secondary?: ActionLink
    }

export interface ScreenConfig {
  id: string
  title: string
  description: string
  badge?: string
  meta?: string[]
  primaryAction?: ActionLink
  secondaryAction?: ActionLink
  blocks: ScreenBlock[]
}
