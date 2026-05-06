import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { type } = await req.json()
    const serviceClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    let reportData: Record<string, unknown> = {}

    if (type === 'tax-report') {
      const { data: tc } = await serviceClient.from('tax_calculations').select('*').eq('user_id', user.id).eq('is_current', true).single()
      reportData = { type, calculation: tc }
    } else if (type === 'investment-plan') {
      const { data: ip } = await serviceClient.from('investment_plans').select('*').eq('user_id', user.id).eq('is_current', true).single()
      reportData = { type, plan: ip }
    } else if (type === 'form16-preview') {
      const { data: tc } = await serviceClient.from('tax_calculations').select('*').eq('user_id', user.id).eq('is_current', true).single()
      const { data: sp } = await serviceClient.from('salary_profiles').select('*').eq('user_id', user.id).eq('is_active', true).single()
      reportData = { type, calculation: tc, salary: sp }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: corsHeaders })
    }

    // In production: generate PDF using html-pdf-node, upload to Supabase Storage, return signed URL
    // For now: return structured JSON data for client-side PDF generation
    await serviceClient.from('audit_log').insert({
      user_id: user.id, action: 'report.generated', resource_type: 'reports', metadata: { type },
    })

    return new Response(JSON.stringify({ data: reportData }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
  }
})
