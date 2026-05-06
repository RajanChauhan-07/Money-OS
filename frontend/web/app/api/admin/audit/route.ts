import { NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, validateAdmin } from '@/lib/api-helpers'

// GET — Query audit_log with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const admin = await validateAdmin(user.id)
    if (!admin) return apiError('Forbidden', 403)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resource_type')

    const serviceClient = createSupabaseServiceClient()

    let query = serviceClient
      .from('audit_log')
      .select('*', { count: 'exact' })

    if (userId) query = query.eq('user_id', userId)
    if (action) query = query.ilike('action', `%${action}%`)
    if (resourceType) query = query.eq('resource_type', resourceType)

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return apiError('Failed to fetch audit log', 500)

    return apiResponse({
      logs: data || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
    })
  } catch (error) {
    console.error('Admin audit error:', error)
    return apiError('Internal server error', 500)
  }
}
