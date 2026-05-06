import { NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, validateAdmin } from '@/lib/api-helpers'

// GET — Dashboard stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const admin = await validateAdmin(user.id)
    if (!admin) return apiError('Forbidden — admin access required', 403)

    const serviceClient = createSupabaseServiceClient()

    const [users, plans, txns, sips] = await Promise.all([
      serviceClient.from('users').select('id', { count: 'exact', head: true }),
      serviceClient.from('tax_calculations').select('id', { count: 'exact', head: true }).eq('is_current', true),
      serviceClient.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      serviceClient.from('sip_mandates').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    return apiResponse({
      total_users: users.count || 0,
      active_plans: plans.count || 0,
      failed_transactions: txns.count || 0,
      active_sips: sips.count || 0,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return apiError('Internal server error', 500)
  }
}
