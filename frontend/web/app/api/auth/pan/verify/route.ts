import { NextRequest } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'
import { encryptPAN, getPANLast4, isValidPAN } from '@/lib/crypto/pan-encrypt'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { pan, full_name, dob } = body

    if (!pan) {
      return apiError('PAN number is required', 400)
    }

    // Validate PAN format
    const panUpper = pan.toUpperCase()
    if (!isValidPAN(panUpper)) {
      return apiError('Invalid PAN format. Expected: ABCDE1234F', 400)
    }

    // In production: call NSDL PAN verification API here
    // For now: simulate verification (always succeeds)
    const verifiedName = full_name || 'Verified User'

    // Encrypt PAN
    const panEncrypted = await encryptPAN(panUpper)
    const panLast4 = getPANLast4(panUpper)

    // Update user record via service client (user can update own row via RLS)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        pan_encrypted: panEncrypted,
        pan_last4: panLast4,
        full_name: verifiedName,
        dob: dob || null,
        onboarding_step: 2, // PAN verification is step 2
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('PAN update error:', updateError)
      return apiError('Failed to save PAN details', 500)
    }

    const ip = getClientIP(request)

    // Audit log
    await writeAuditLog({
      userId: user.id,
      action: 'user.pan_verified',
      resourceType: 'users',
      resourceId: user.id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: { pan_last4: panLast4, verification_source: 'simulated' },
    })

    return apiResponse({
      verified: true,
      name: verifiedName,
      pan_last4: panLast4,
    })
  } catch (error) {
    console.error('PAN verify error:', error)
    return apiError('Internal server error', 500)
  }
}
