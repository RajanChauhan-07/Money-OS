import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getCurrentFY } from '@/lib/api-helpers'

// GET — Get current tax calculation for user + FY
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const fy = getCurrentFY()

    const { data, error } = await supabase
      .from('tax_calculations')
      .select('*')
      .eq('user_id', user.id)
      .eq('financial_year', fy)
      .eq('is_current', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      return apiError('Failed to fetch tax calculation', 500)
    }

    return apiResponse(data)
  } catch (error) {
    console.error('Tax current error:', error)
    return apiError('Internal server error', 500)
  }
}
