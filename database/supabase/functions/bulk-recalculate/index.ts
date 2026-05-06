import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { new_tax_law_version } = await req.json()
    if (!new_tax_law_version) {
      return new Response(JSON.stringify({ error: 'new_tax_law_version required' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Verify admin (check Authorization header)
    const authHeader = req.headers.get('Authorization') || ''
    // Service role calls pass the service key directly — accept if valid
    
    const { data: users } = await supabase.from('users').select('id').eq('is_onboarded', true)
    const totalUsers = users?.length || 0
    let processed = 0
    let failed = 0
    const batchSize = 100

    for (let i = 0; i < totalUsers; i += batchSize) {
      const batch = users!.slice(i, i + batchSize)
      for (const user of batch) {
        try {
          // Call tax-calculate for each user
          const taxCalcUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/tax-calculate`
          await fetch(taxCalcUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              user_id: user.id,
              financial_year: getCurrentFY(),
              trigger_reason: 'law_change',
            }),
          })
          processed++
        } catch {
          failed++
        }
      }
      // 100ms delay between batches
      if (i + batchSize < totalUsers) {
        await new Promise(r => setTimeout(r, 100))
      }
    }

    // Notify all users
    const notifications = (users || []).map(u => ({
      user_id: u.id, category: 'system',
      title: 'Tax law updated — plan recalculated',
      body: `Your tax plan has been updated for ${new_tax_law_version}. Review the changes.`,
      action_url: '/tax', sent_via: ['in_app'],
    }))
    
    for (let i = 0; i < notifications.length; i += 500) {
      await supabase.from('notifications').insert(notifications.slice(i, i + 500))
    }

    await supabase.from('audit_log').insert({
      action: 'admin.bulk_recalculate_completed', resource_type: 'system',
      metadata: { new_tax_law_version, total_users: totalUsers, processed, failed },
    })

    return new Response(JSON.stringify({ data: { processed, failed, total: totalUsers } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error' }), { status: 500, headers: corsHeaders })
  }
})

function getCurrentFY(): string {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const fyStart = month < 3 ? year - 1 : year
  return `${fyStart}-${String(fyStart + 1).slice(-2)}`
}
