import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/api-helpers'

// GET — Full-text search on mf_funds
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const isElss = searchParams.get('is_elss')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('mf_funds')
      .select('scheme_code, scheme_name, amc_name, category, nav, nav_date, returns_1y, returns_3y, returns_5y, risk_level, min_sip_amount, min_lumpsum, exit_load, is_elss, is_active')
      .eq('is_active', true)

    // Full-text search
    if (q) {
      // Use tsquery for full-text search
      const searchTerms = q.split(/\s+/).map(term => `${term}:*`).join(' & ')
      query = query.textSearch('search_vector', searchTerms)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isElss === 'true') {
      query = query.eq('is_elss', true)
    }

    query = query
      .order('returns_3y', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Fund search error:', error)
      // Fallback to ilike search if tsvector fails
      const fallbackQuery = supabase
        .from('mf_funds')
        .select('scheme_code, scheme_name, amc_name, category, nav, nav_date, returns_1y, returns_3y, returns_5y, risk_level, min_sip_amount, min_lumpsum, exit_load, is_elss')
        .eq('is_active', true)
        .ilike('scheme_name', `%${q}%`)
        .range(offset, offset + limit - 1)

      const { data: fallbackData, error: fallbackError } = await fallbackQuery
      if (fallbackError) return apiError('Failed to search funds', 500)
      return apiResponse({ funds: fallbackData || [], total: fallbackData?.length || 0 })
    }

    return apiResponse({ funds: data || [], total: count || data?.length || 0 })
  } catch (error) {
    console.error('Fund search error:', error)
    return apiError('Internal server error', 500)
  }
}
