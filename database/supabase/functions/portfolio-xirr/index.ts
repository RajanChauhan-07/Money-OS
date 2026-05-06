import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function computeXIRR(cashflows: { date: number; amount: number }[]): number {
  if (cashflows.length < 2) return 0
  const d0 = cashflows[0].date
  function npv(rate: number): number {
    let total = 0
    for (const cf of cashflows) {
      const years = (cf.date - d0) / (365.25 * 24 * 60 * 60 * 1000)
      total += cf.amount / Math.pow(1 + rate, years)
    }
    return total
  }
  function dnpv(rate: number): number {
    let total = 0
    for (const cf of cashflows) {
      const years = (cf.date - d0) / (365.25 * 24 * 60 * 60 * 1000)
      total -= (years * cf.amount) / Math.pow(1 + rate, years + 1)
    }
    return total
  }
  let rate = 0.1
  for (let i = 0; i < 100; i++) {
    const f = npv(rate)
    const df = dnpv(rate)
    if (Math.abs(df) < 1e-10) break
    const newRate = rate - f / df
    if (Math.abs(newRate - rate) < 1e-7) return Math.round(newRate * 10000) / 10000
    rate = newRate
  }
  return Math.round(rate * 10000) / 10000
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { data: txns } = await supabase.from('transactions').select('*').eq('user_id', user.id).eq('status', 'allotted').order('transacted_at', { ascending: true })
    const { data: holdings } = await supabase.from('holdings').select('*, mf_funds(nav)').eq('user_id', user.id)

    const cashflows: { date: number; amount: number }[] = []
    const fundFlows: Record<string, { date: number; amount: number }[]> = {}
    for (const t of txns || []) {
      const d = new Date(t.transacted_at).getTime()
      const a = t.type === 'Redemption' ? Number(t.amount) : -Number(t.amount)
      cashflows.push({ date: d, amount: a })
      if (!fundFlows[t.scheme_code]) fundFlows[t.scheme_code] = []
      fundFlows[t.scheme_code].push({ date: d, amount: a })
    }
    const now = Date.now()
    for (const h of holdings || []) {
      const nav = (h.mf_funds as any)?.nav || 0
      const val = Number(h.units) * Number(nav)
      cashflows.push({ date: now, amount: val })
      if (!fundFlows[h.scheme_code]) fundFlows[h.scheme_code] = []
      fundFlows[h.scheme_code].push({ date: now, amount: val })
    }

    const total = computeXIRR(cashflows)
    const perFund: Record<string, number> = {}
    for (const [c, f] of Object.entries(fundFlows)) { if (f.length >= 2) perFund[c] = computeXIRR(f) }

    return new Response(JSON.stringify({ data: { xirr_percent: Math.round(total * 10000) / 100, per_fund_xirr: perFund } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: corsHeaders })
  }
})
