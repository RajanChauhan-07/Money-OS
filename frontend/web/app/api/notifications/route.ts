import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/api-helpers'

// GET — List notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error, count } = await query

    if (error) return apiError('Failed to fetch notifications', 500)

    return apiResponse({
      notifications: data || [],
      unread_count: count || 0,
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return apiError('Internal server error', 500)
  }
}

// PATCH — Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { id, mark_all_read } = body

    if (mark_all_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    } else if (id) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id)
    } else {
      return apiError('id or mark_all_read required', 400)
    }

    return apiResponse({ success: true })
  } catch (error) {
    console.error('Notifications PATCH error:', error)
    return apiError('Internal server error', 500)
  }
}
