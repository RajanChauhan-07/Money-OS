import { NextRequest } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'
import { hash } from 'bcryptjs'
import { sendOTPSMS } from '@/lib/msg91/client'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mobile } = body

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return apiError('Valid 10-digit mobile number required', 400)
    }

    const ip = getClientIP(request)

    // Hash the mobile number (one-way — never store plain)
    const mobileHash = crypto
      .createHash('sha256')
      .update(mobile + (process.env.MOBILE_HASH_SALT || 'money-os-salt'))
      .digest('hex')

    // Rate limit: max 3 OTPs per mobile per hour
    const serviceClient = createSupabaseServiceClient()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { count } = await serviceClient
      .from('otp_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('mobile_hash', mobileHash)
      .gte('created_at', oneHourAgo)

    if (count !== null && count >= 3) {
      return apiError('Too many OTP requests. Please try after some time.', 429)
    }

    // Rate limit per IP: max 10 OTPs per hour
    const { count: ipCount } = await serviceClient
      .from('otp_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', oneHourAgo)

    if (ipCount !== null && ipCount >= 10) {
      return apiError('Too many requests from this IP. Please try later.', 429)
    }

    // Generate cryptographically random 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999))

    // Bcrypt hash the OTP (10 rounds)
    const otpHash = await hash(otp, 10)

    // Insert OTP session
    const { data: session, error: insertError } = await serviceClient
      .from('otp_sessions')
      .insert({
        mobile_hash: mobileHash,
        otp_hash: otpHash,
        ip_address: ip,
      })
      .select('id, expires_at')
      .single()

    if (insertError) {
      console.error('OTP session insert error:', insertError)
      return apiError('Failed to create OTP session', 500)
    }

    // Send SMS via MSG91 (or fallback to dev mode)
    let channel = 'sms'
    const isDev = !process.env.MSG91_API_KEY || process.env.MSG91_API_KEY === 'your_msg91_api_key'

    if (isDev) {
      // DEV MODE: Log OTP to console instead of sending SMS
      console.log(`\n🔐 [DEV MODE] OTP for +91${mobile}: ${otp}\n`)
      channel = 'dev_console'
    } else {
      const smsResult = await sendOTPSMS(mobile, otp)
      if (!smsResult.success) {
        console.warn('SMS failed:', smsResult.message)
        channel = 'sms_failed'
      }
    }

    // Write audit log
    await writeAuditLog({
      action: 'otp.sent',
      resourceType: 'otp_sessions',
      resourceId: session.id,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: { channel },
    })

    const responseData: Record<string, unknown> = {
      session_id: session.id,
      expires_in: 600,
      channel,
    }

    // In dev mode, include the OTP in response for testing
    if (isDev) {
      responseData.dev_otp = otp
    }

    return apiResponse(responseData)
  } catch (error) {
    console.error('OTP send error:', error)
    return apiError('Internal server error', 500)
  }
}
