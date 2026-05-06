import { NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, validateAdmin } from '@/lib/api-helpers'

// GET — Paginated user list
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const admin = await validateAdmin(user.id)
    if (!admin) return apiError('Forbidden', 403)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const kycStatus = searchParams.get('kyc_status')

    const serviceClient = createSupabaseServiceClient()

    let query = serviceClient
      .from('users')
      .select('id, full_name, pan_last4, kyc_status, onboarding_step, is_onboarded, created_at', { count: 'exact' })

    if (kycStatus) query = query.eq('kyc_status', kycStatus)

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return apiError('Failed to fetch users', 500)

    return apiResponse({
      users: data || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return apiError('Internal server error', 500)
  }
}
