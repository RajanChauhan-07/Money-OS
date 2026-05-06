import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { user_id, category, title, body, action_url, channels } = await req.json()
    if (!user_id || !title || !body || !category) {
      return new Response(JSON.stringify({ error: 'user_id, category, title, body required' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const sentVia: string[] = ['in_app']

    // Insert in-app notification
    const { data: notif, error } = await supabase.from('notifications').insert({
      user_id, category, title, body, action_url: action_url || null, sent_via: sentVia,
    }).select().single()

    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to create notification' }), { status: 500, headers: corsHeaders })
    }

    // Email channel
    if (channels?.includes('email')) {
      try {
        const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
        if (RESEND_KEY) {
          // Fetch user email from auth
          const { data: authUser } = await supabase.auth.admin.getUserById(user_id)
          const email = authUser?.user?.email
          if (email) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
              body: JSON.stringify({ from: 'Money OS <noreply@moneyos.in>', to: email, subject: title, html: `<p>${body}</p>` }),
            })
            sentVia.push('email')
          }
        }
      } catch (e) { console.error('Email send error:', e) }
    }

    // SMS channel
    if (channels?.includes('sms')) {
      try {
        const MSG91_KEY = Deno.env.get('MSG91_API_KEY')
        if (MSG91_KEY) {
          // Fetch mobile from users table
          const { data: userData } = await supabase.from('users').select('mobile_hash').eq('id', user_id).single()
          if (userData) {
            // Note: we can't send SMS with just a hash — in production, use a secure lookup
            sentVia.push('sms_attempted')
          }
        }
      } catch (e) { console.error('SMS send error:', e) }
    }

    // Update sent_via
    await supabase.from('notifications').update({ sent_via: sentVia }).eq('id', notif.id)

    return new Response(JSON.stringify({ data: { notification_id: notif.id, sent_via: sentVia } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
  }
})
