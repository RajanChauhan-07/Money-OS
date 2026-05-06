import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/api-helpers'

// GET — All holdings with live NAV from mf_funds join
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    // Join holdings with mf_funds for live NAV
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select(`
        *,
        mf_funds (
          scheme_name,
          amc_name,
          nav,
          nav_date,
          category,
          is_elss,
          returns_1y,
          returns_3y,
          returns_5y
        )
      `)
      .eq('user_id', user.id)

    if (error) return apiError('Failed to fetch holdings', 500)

    // Compute current value and gain/loss
    const enriched = (holdings || []).map((h) => {
      const fund = h.mf_funds as Record<string, unknown> | null
      const currentNav = Number(fund?.nav || 0)
      const currentValue = Number(h.units) * currentNav
      const investedAmount = Number(h.invested_amount)
      const gainLoss = currentValue - investedAmount
      const gainLossPercent = investedAmount > 0 ? (gainLoss / investedAmount) * 100 : 0

      return {
        ...h,
        current_nav: currentNav,
        current_value: Math.round(currentValue * 100) / 100,
        gain_loss: Math.round(gainLoss * 100) / 100,
        gain_loss_percent: Math.round(gainLossPercent * 100) / 100,
        scheme_name: fund?.scheme_name,
        amc_name: fund?.amc_name,
        nav_date: fund?.nav_date,
        category: fund?.category,
      }
    })

    // Portfolio summary
    const totalInvested = enriched.reduce((s, h) => s + Number(h.invested_amount), 0)
    const totalCurrent = enriched.reduce((s, h) => s + h.current_value, 0)
    const totalGainLoss = totalCurrent - totalInvested

    return apiResponse({
      holdings: enriched,
      summary: {
        total_invested: Math.round(totalInvested * 100) / 100,
        total_current_value: Math.round(totalCurrent * 100) / 100,
        total_gain_loss: Math.round(totalGainLoss * 100) / 100,
        total_gain_loss_percent: totalInvested > 0
          ? Math.round((totalGainLoss / totalInvested) * 10000) / 100
          : 0,
        holdings_count: enriched.length,
      },
    })
  } catch (error) {
    console.error('Holdings GET error:', error)
    return apiError('Internal server error', 500)
  }
}
