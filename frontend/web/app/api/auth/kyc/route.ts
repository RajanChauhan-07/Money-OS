import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// POST — Initiate KYC / Update KYC status
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { action } = body // 'initiate' or 'callback'

    if (action === 'initiate') {
      // Update status to pending
      await supabase
        .from('users')
        .update({ kyc_status: 'pending', onboarding_step: 3 })
        .eq('id', user.id)

      // In production: return UIDAI eKYC redirect URL
      return apiResponse({
        redirect_url: '/onboard/kyc', // simulated
        status: 'pending',
      })
    }

    if (action === 'callback' || action === 'verify') {
      // Simulated KYC verification success
      const now = new Date()
      const expiresAt = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate())

      await supabase
        .from('users')
        .update({
          kyc_status: 'verified',
          kyc_verified_at: now.toISOString(),
          kyc_expires_at: expiresAt.toISOString(),
          onboarding_step: 4,
        })
        .eq('id', user.id)

      const ip = getClientIP(request)
      await writeAuditLog({
        userId: user.id,
        action: 'user.kyc_verified',
        resourceType: 'users',
        resourceId: user.id,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: { verification_source: 'simulated', expires_at: expiresAt.toISOString() },
      })

      return apiResponse({
        status: 'verified',
        verified_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
    }

    return apiError('Invalid action. Use "initiate" or "callback".', 400)
  } catch (error) {
    console.error('KYC error:', error)
    return apiError('Internal server error', 500)
  }
}

// GET — Check KYC status
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return apiError('Unauthorized', 401)

    const { data, error } = await supabase
      .from('users')
      .select('kyc_status, kyc_verified_at, kyc_expires_at')
      .eq('id', user.id)
      .single()

    if (error) return apiError('Failed to fetch KYC status', 500)

    return apiResponse(data)
  } catch (error) {
    console.error('KYC status error:', error)
    return apiError('Internal server error', 500)
  }
}
