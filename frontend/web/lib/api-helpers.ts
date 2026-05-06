import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

/**
 * Standard API response helper
 */
export function apiResponse<T>(
  data: T,
  status: number = 200,
  message?: string
) {
  return NextResponse.json({ data, error: null, message: message || 'OK' }, { status })
}

/**
 * Standard API error response
 */
export function apiError(error: string, status: number = 400) {
  return NextResponse.json({ data: null, error, message: error }, { status })
}

/**
 * Get current financial year string (e.g., "2025-26")
 * FY runs April to March
 */
export function getCurrentFY(): string {
  const now = new Date()
  const month = now.getMonth() // 0-indexed
  const year = now.getFullYear()
  // If Jan-Mar, FY started previous year
  const fyStart = month < 3 ? year - 1 : year
  return `${fyStart}-${String(fyStart + 1).slice(-2)}`
}

/**
 * Write to audit log via service role (bypasses RLS)
 */
export async function writeAuditLog(params: {
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}) {
  const serviceClient = createSupabaseServiceClient()
  await serviceClient.from('audit_log').insert({
    user_id: params.userId || null,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId || null,
    ip_address: params.ipAddress || null,
    user_agent: params.userAgent || null,
    metadata: params.metadata || {},
  })
}

/**
 * Extract IP from request headers
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

/**
 * Validate admin access — returns admin role or null
 */
export async function validateAdmin(
  userId: string
): Promise<{ role: string; can_bulk_recalculate: boolean; can_send_notifications: boolean } | null> {
  const serviceClient = createSupabaseServiceClient()
  const { data } = await serviceClient
    .from('admin_users')
    .select('role, can_bulk_recalculate, can_send_notifications')
    .eq('id', userId)
    .single()
  return data
}
