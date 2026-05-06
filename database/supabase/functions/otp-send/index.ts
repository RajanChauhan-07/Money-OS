import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hash as bcryptHash } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { mobile } = await req.json()
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return new Response(JSON.stringify({ error: 'Valid 10-digit mobile required' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Hash mobile
    const encoder = new TextEncoder()
    const data = encoder.encode(mobile + (Deno.env.get('MOBILE_HASH_SALT') || 'money-os-salt'))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const mobileHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    // Rate limit: 3 per hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { count } = await supabase.from('otp_sessions').select('id', { count: 'exact', head: true }).eq('mobile_hash', mobileHash).gte('created_at', oneHourAgo)
    if (count && count >= 3) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: corsHeaders })
    }

    // Generate OTP
    const otpArray = new Uint32Array(1)
    crypto.getRandomValues(otpArray)
    const otp = String(100000 + (otpArray[0] % 900000))

    // Bcrypt hash
    const otpHash = await bcryptHash(otp)

    // Store session
    const { data: session } = await supabase.from('otp_sessions').insert({
      mobile_hash: mobileHash, otp_hash: otpHash, ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0',
    }).select('id, expires_at').single()

    // Send SMS via MSG91
    let channel = 'sms'
    const MSG91_KEY = Deno.env.get('MSG91_API_KEY')
    if (MSG91_KEY) {
      try {
        const smsRes = await fetch('https://api.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authkey: MSG91_KEY },
          body: JSON.stringify({ template_id: Deno.env.get('MSG91_TEMPLATE_ID'), mobile: `91${mobile}`, otp, otp_expiry: 10 }),
        })
        const smsData = await smsRes.json()
        if (smsData.type !== 'success') channel = 'sms_failed'
      } catch { channel = 'sms_failed' }
    }

    // Fallback to email if SMS failed
    if (channel === 'sms_failed') {
      const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_KEY) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
            body: JSON.stringify({ from: 'Money OS <noreply@moneyos.in>', to: `${mobile}@phone.moneyos.in`, subject: `${otp} — Money OS OTP`, html: `<p>Your OTP is <strong>${otp}</strong>. Valid for 10 minutes.</p>` }),
          })
          channel = 'email'
        } catch { channel = 'failed' }
      }
    }

    return new Response(JSON.stringify({ data: { session_id: session?.id, expires_in: 600, channel } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: corsHeaders })
  }
})
