import { NextRequest } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'
import { compare } from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, otp, mobile, consent_ip, consent_version } = body

    if (!session_id || !otp || !mobile) {
      return apiError('session_id, otp, and mobile are required', 400)
    }

    if (!/^\d{6}$/.test(otp)) {
      return apiError('OTP must be 6 digits', 400)
    }

    const ip = getClientIP(request)
    const serviceClient = createSupabaseServiceClient()

    // Fetch OTP session
    const { data: session, error: fetchError } = await serviceClient
      .from('otp_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (fetchError || !session) {
      return apiError('Invalid or expired OTP session', 400)
    }

    // Check if already verified
    if (session.verified_at) {
      return apiError('OTP already verified', 400)
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      return apiError('OTP has expired. Please request a new one.', 400)
    }

    // Check attempts (max 3)
    if (session.attempts >= 3) {
      return apiError('Too many incorrect attempts. Please request a new OTP.', 429)
    }

    // Bcrypt compare
    const isValid = await compare(otp, session.otp_hash)

    if (!isValid) {
      // Increment attempts
      await serviceClient
        .from('otp_sessions')
        .update({ attempts: session.attempts + 1 })
        .eq('id', session_id)

      const attemptsLeft = 2 - session.attempts
      return apiError(
        `Incorrect OTP. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining.` : 'No attempts remaining.'}`,
        400
      )
    }

    // Mark OTP as verified
    await serviceClient
      .from('otp_sessions')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', session_id)

    // Hash mobile for user lookup
    const mobileHash = crypto
      .createHash('sha256')
      .update(mobile + (process.env.MOBILE_HASH_SALT || 'money-os-salt'))
      .digest('hex')

    // Check if user already exists
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id')
      .eq('mobile_hash', mobileHash)
      .single()

    let userId: string
    let isNewUser = false

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create Supabase auth user with phone
      const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
        phone: `+91${mobile}`,
        phone_confirm: true,
      })

      if (authError || !authUser.user) {
        console.error('Auth user creation error:', authError)
        return apiError('Failed to create account', 500)
      }

      userId = authUser.user.id
      isNewUser = true

      // Create users row
      const { error: userError } = await serviceClient.from('users').insert({
        id: userId,
        mobile_hash: mobileHash,
        dpdp_consent_at: new Date().toISOString(),
        dpdp_consent_ip: consent_ip || ip,
        dpdp_consent_version: consent_version || '1.0',
      })

      if (userError) {
        console.error('User row creation error:', userError)
        // Clean up auth user on failure
        await serviceClient.auth.admin.deleteUser(userId)
        return apiError('Failed to create user profile', 500)
      }

      // Write audit log
      await writeAuditLog({
        userId,
        action: 'user.created',
        resourceType: 'users',
        resourceId: userId,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
        metadata: { channel: 'sms_otp' },
      })
    }

    // Generate a session for the user
    // Use signInWithPassword with a generated token via admin
    // For phone auth, we use admin.generateLink or create a custom session
    const { data: sessionData, error: signInError } =
      await serviceClient.auth.admin.generateLink({
        type: 'magiclink',
        email: `${mobile}@phone.moneyos.in`, // synthetic email for phone users
      })

    // Write audit log for login
    await writeAuditLog({
      userId,
      action: 'user.logged_in',
      resourceType: 'users',
      resourceId: userId,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return apiResponse({
      user_id: userId,
      is_new_user: isNewUser,
      redirect: isNewUser ? '/profile' : '/dashboard',
      // In production, set httpOnly cookie with JWT instead of returning it
    })
  } catch (error) {
    console.error('OTP verify error:', error)
    return apiError('Internal server error', 500)
  }
}
