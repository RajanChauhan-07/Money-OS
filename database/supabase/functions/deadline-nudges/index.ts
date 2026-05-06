import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const march31 = new Date(now.getMonth() < 3 ? now.getFullYear() : now.getFullYear() + 1, 2, 31)
    const daysToMarch31 = Math.ceil((march31.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Fetch all onboarded users with current plans
    const { data: users } = await supabase.from('users').select('id').eq('is_onboarded', true)
    let nudgesSent = 0

    for (const user of users || []) {
      // Check if already notified today
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).gte('created_at', today)
      if (count && count > 0) continue

      // Check 80C headroom
      const { data: plan } = await supabase.from('investment_plans').select('section_80c_used').eq('user_id', user.id).eq('is_current', true).single()
      if (plan) {
        const headroom = 150000 - Number(plan.section_80c_used || 0)
        if (headroom > 5000 && [30, 7, 3, 1].includes(daysToMarch31)) {
          await supabase.from('notifications').insert({
            user_id: user.id, category: 'tax',
            title: `${daysToMarch31} days left — ₹${(headroom/1000).toFixed(0)}K 80C unused`,
            body: `You have ₹${headroom.toLocaleString('en-IN')} headroom in Section 80C. Act before March 31.`,
            action_url: '/plan/summary', sent_via: ['in_app'],
          })
          nudgesSent++
          continue
        }
      }

      // Check SIP mandate expiry (30 days warning)
      const { data: sips } = await supabase.from('sip_mandates').select('id, mandate_expires_at, scheme_code')
        .eq('user_id', user.id).eq('status', 'active')
      for (const sip of sips || []) {
        if (sip.mandate_expires_at) {
          const expiryDate = new Date(sip.mandate_expires_at)
          const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (daysToExpiry <= 30 && daysToExpiry > 0) {
            await supabase.from('notifications').insert({
              user_id: user.id, category: 'sip',
              title: `SIP mandate expiring in ${daysToExpiry} days`,
              body: `Your eNACH mandate for a SIP expires on ${sip.mandate_expires_at}. Renew to avoid interruption.`,
              action_url: '/history/sip-management', sent_via: ['in_app'],
            })
            nudgesSent++
            break
          }
        }
      }

      // Advance tax deadlines: Jun 15, Sep 15, Dec 15, Mar 15
      const advanceTaxDates = [
        { month: 5, day: 15, label: 'Q1' }, { month: 8, day: 15, label: 'Q2' },
        { month: 11, day: 15, label: 'Q3' }, { month: 2, day: 15, label: 'Q4' },
      ]
      for (const atd of advanceTaxDates) {
        const atdDate = new Date(now.getFullYear(), atd.month, atd.day)
        const daysToATD = Math.ceil((atdDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysToATD === 7 || daysToATD === 1) {
          await supabase.from('notifications').insert({
            user_id: user.id, category: 'tax',
            title: `${atd.label} advance tax due in ${daysToATD} day(s)`,
            body: `Advance tax installment for ${atd.label} is due on ${atd.month + 1}/${atd.day}. Check your tax tracker.`,
            action_url: '/tracker', sent_via: ['in_app'],
          })
          nudgesSent++
          break
        }
      }
    }

    await supabase.from('audit_log').insert({
      action: 'nudges.processed', resource_type: 'notifications',
      metadata: { total_users: users?.length || 0, nudges_sent: nudgesSent, date: today },
    })

    return new Response(JSON.stringify({ data: { nudges_sent: nudgesSent, date: today } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: corsHeaders })
  }
})
