export function formatRupee(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function computeXIRR(cashflows: { date: Date; amount: number }[]): number {
  // Newton-Raphson XIRR implementation
  let rate = 0.1
  for (let iter = 0; iter < 100; iter++) {
    const d0 = cashflows[0].date.getTime()
    let f = 0, df = 0
    for (const cf of cashflows) {
      const t = (cf.date.getTime() - d0) / (365 * 24 * 60 * 60 * 1000)
      f += cf.amount / Math.pow(1 + rate, t)
      df += -t * cf.amount / Math.pow(1 + rate, t + 1)
    }
    const newRate = rate - f / df
    if (Math.abs(newRate - rate) < 1e-7) return newRate * 100
    rate = newRate
  }
  return rate * 100
}

export function monthName(month: number): string {
  return ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'][month]
}

export function getFYMonths(): { label: string; month: number; year: number }[] {
  const now = new Date()
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(fyStart, 3 + i)
    return { label: monthName(i), month: date.getMonth(), year: date.getFullYear() }
  })
}
