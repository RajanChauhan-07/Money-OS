import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/api-helpers'

// GET — Paginated transaction history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') // SIP, Lumpsum, etc.
    const status = searchParams.get('status') // allotted, processing, etc.
    const schemeCode = searchParams.get('scheme_code')

    let query = supabase
      .from('transactions')
      .select(`
        *,
        mf_funds (scheme_name, amc_name, category)
      `, { count: 'exact' })
      .eq('user_id', user.id)

    if (type) query = query.eq('type', type)
    if (status) query = query.eq('status', status)
    if (schemeCode) query = query.eq('scheme_code', schemeCode)

    query = query
      .order('transacted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return apiError('Failed to fetch transactions', 500)

    return apiResponse({
      transactions: data || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    })
  } catch (error) {
    console.error('Transactions GET error:', error)
    return apiError('Internal server error', 500)
  }
}
