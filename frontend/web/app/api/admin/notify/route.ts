import { NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, validateAdmin, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// POST — Send notification to user segment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const admin = await validateAdmin(user.id)
    if (!admin) return apiError('Forbidden', 403)
    if (!admin.can_send_notifications) {
      return apiError('Insufficient permissions for sending notifications', 403)
    }

    const body = await request.json()
    const { user_ids, category, title, body: notifBody, action_url } = body

    if (!title || !notifBody || !category) {
      return apiError('title, body, and category are required', 400)
    }

    const serviceClient = createSupabaseServiceClient()

    // Build notification rows
    const targets = user_ids || []
    let targetUserIds: string[] = []

    if (targets.length > 0) {
      targetUserIds = targets
    } else {
      // Send to all onboarded users
      const { data: allUsers } = await serviceClient
        .from('users')
        .select('id')
        .eq('is_onboarded', true)
      targetUserIds = (allUsers || []).map((u: { id: string }) => u.id)
    }

    // Batch insert notifications
    const notifications = targetUserIds.map((uid: string) => ({
      user_id: uid,
      category,
      title,
      body: notifBody,
      action_url: action_url || null,
      sent_via: ['in_app'],
    }))

    const batchSize = 500
    let inserted = 0
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      const { error } = await serviceClient.from('notifications').insert(batch)
      if (!error) inserted += batch.length
    }

    const ip = getClientIP(request)
    await writeAuditLog({
      userId: user.id,
      action: 'admin.notification_sent',
      resourceType: 'notifications',
      ipAddress: ip,
      metadata: { category, title, target_count: targetUserIds.length, inserted },
    })

    return apiResponse({
      sent: inserted,
      total_targets: targetUserIds.length,
    })
  } catch (error) {
    console.error('Admin notify error:', error)
    return apiError('Internal server error', 500)
  }
}
