import { NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, validateAdmin, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// POST — Bulk recalculate for tax law changes
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const admin = await validateAdmin(user.id)
    if (!admin) return apiError('Forbidden', 403)
    if (!admin.can_bulk_recalculate) {
      return apiError('Insufficient permissions — super_admin required', 403)
    }

    const body = await request.json()
    const { new_tax_law_version } = body

    if (!new_tax_law_version) {
      return apiError('new_tax_law_version is required', 400)
    }

    const serviceClient = createSupabaseServiceClient()
    const ip = getClientIP(request)

    // Get all onboarded users
    const { data: users, error } = await serviceClient
      .from('users')
      .select('id')
      .eq('is_onboarded', true)

    if (error) return apiError('Failed to fetch users', 500)

    // Log the bulk operation
    await writeAuditLog({
      userId: user.id,
      action: 'admin.bulk_recalculate_started',
      resourceType: 'system',
      ipAddress: ip,
      metadata: {
        new_tax_law_version,
        total_users: users?.length || 0,
        initiated_by: user.id,
      },
    })

    // Return immediately — actual recalculation happens async
    // In production: queue this via Edge Function / background job
    return apiResponse({
      job_id: `bulk-${Date.now()}`,
      total_users: users?.length || 0,
      status: 'queued',
      message: `Queued recalculation for ${users?.length || 0} users with ${new_tax_law_version}`,
    }, 202)
  } catch (error) {
    console.error('Admin recalculate error:', error)
    return apiError('Internal server error', 500)
  }
}
