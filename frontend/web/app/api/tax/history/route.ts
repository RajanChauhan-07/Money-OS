import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getCurrentFY } from '@/lib/api-helpers'

// GET — All tax calculation versions for comparison UI
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
      .order('version', { ascending: false })

    if (error) return apiError('Failed to fetch tax history', 500)
    return apiResponse(data || [])
  } catch (error) {
    console.error('Tax history error:', error)
    return apiError('Internal server error', 500)
  }
}
