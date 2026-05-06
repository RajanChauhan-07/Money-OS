import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/api-helpers'

// GET — Compute portfolio XIRR from transactions
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    // Fetch all allotted transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*, mf_funds(nav, scheme_name)')
      .eq('user_id', user.id)
      .eq('status', 'allotted')
      .order('transacted_at', { ascending: true })

    if (error) return apiError('Failed to fetch transactions', 500)

    if (!transactions || transactions.length === 0) {
      return apiResponse({ xirr_percent: 0, per_fund_xirr: {} })
    }

    // Fetch current holdings for final value
    const { data: holdings } = await supabase
      .from('holdings')
      .select('*, mf_funds(nav)')
      .eq('user_id', user.id)

    // Build cashflows for total XIRR
    const cashflows: { date: Date; amount: number }[] = []
    const fundCashflows: Record<string, { date: Date; amount: number }[]> = {}

    for (const txn of transactions) {
      const date = new Date(txn.transacted_at)
      const amount = txn.type === 'Redemption' ? Number(txn.amount) : -Number(txn.amount)

      cashflows.push({ date, amount })

      const code = txn.scheme_code
      if (!fundCashflows[code]) fundCashflows[code] = []
      fundCashflows[code].push({ date, amount })
    }

    // Add current portfolio value as final positive cashflow
    const today = new Date()
    for (const h of holdings || []) {
      const fund = h.mf_funds as Record<string, unknown> | null
      const currentValue = Number(h.units) * Number(fund?.nav || 0)
      cashflows.push({ date: today, amount: currentValue })

      const code = h.scheme_code
      if (!fundCashflows[code]) fundCashflows[code] = []
      fundCashflows[code].push({ date: today, amount: currentValue })
    }

    // Compute XIRR using Newton-Raphson
    const totalXirr = computeXIRR(cashflows)

    const perFundXirr: Record<string, number> = {}
    for (const [code, flows] of Object.entries(fundCashflows)) {
      if (flows.length >= 2) {
        perFundXirr[code] = computeXIRR(flows)
      }
    }

    return apiResponse({
      xirr_percent: Math.round(totalXirr * 10000) / 100, // as percentage
      per_fund_xirr: perFundXirr,
    })
  } catch (error) {
    console.error('XIRR error:', error)
    return apiError('Internal server error', 500)
  }
}

/**
 * Newton-Raphson XIRR computation
 * Returns annualized return rate (e.g., 0.12 for 12%)
 */
function computeXIRR(cashflows: { date: Date; amount: number }[]): number {
  if (cashflows.length < 2) return 0

  const dates = cashflows.map((cf) => cf.date.getTime())
  const amounts = cashflows.map((cf) => cf.amount)
  const d0 = dates[0]

  function npv(rate: number): number {
    let total = 0
    for (let i = 0; i < amounts.length; i++) {
      const years = (dates[i] - d0) / (365.25 * 24 * 60 * 60 * 1000)
      total += amounts[i] / Math.pow(1 + rate, years)
    }
    return total
  }

  function dnpv(rate: number): number {
    let total = 0
    for (let i = 0; i < amounts.length; i++) {
      const years = (dates[i] - d0) / (365.25 * 24 * 60 * 60 * 1000)
      total -= (years * amounts[i]) / Math.pow(1 + rate, years + 1)
    }
    return total
  }

  let rate = 0.1 // Initial guess 10%
  const maxIter = 100
  const threshold = 1e-7

  for (let i = 0; i < maxIter; i++) {
    const f = npv(rate)
    const df = dnpv(rate)

    if (Math.abs(df) < 1e-10) break

    const newRate = rate - f / df
    if (Math.abs(newRate - rate) < threshold) {
      return Math.round(newRate * 10000) / 10000
    }
    rate = newRate
  }

  return Math.round(rate * 10000) / 10000
}
