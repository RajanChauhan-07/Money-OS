// supabase/functions/amfi-nav-sync/index.ts
// Daily AMFI NAV sync — fetches ~15K fund rows, batch upserts to mf_funds

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AMFI_NAV_URL = 'https://www.amfiindia.com/spages/NAVAll.txt'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting AMFI NAV sync...')

    // Fetch NAV data from AMFI
    const response = await fetch(AMFI_NAV_URL)
    if (!response.ok) {
      throw new Error(`AMFI fetch failed: ${response.status}`)
    }

    const text = await response.text()
    const lines = text.split('\n')

    let currentAMC = ''
    let currentCategory = ''
    const funds: Array<{
      scheme_code: string
      isin_growth: string | null
      scheme_name: string
      amc_name: string
      category: string
      nav: number
      nav_date: string
      is_elss: boolean
    }> = []

    let skipped = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Check if it's a category header (no semicolons)
      if (!trimmed.includes(';')) {
        // AMC/category headers
        if (trimmed.includes('Mutual Fund')) {
          currentAMC = trimmed.replace(/\s*Mutual Fund.*/, ' Mutual Fund').trim()
        } else if (trimmed.includes('(') || trimmed.includes('Open Ended') || trimmed.includes('Close Ended')) {
          currentCategory = trimmed
        }
        continue
      }

      // Parse fund row: Scheme Code;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Date
      const parts = trimmed.split(';')
      if (parts.length < 5) continue

      const schemeCode = parts[0]?.trim()
      const isinGrowth = parts[1]?.trim() || null
      const schemeName = parts[3]?.trim()
      const navStr = parts[4]?.trim()
      const dateStr = parts[5]?.trim()

      if (!schemeCode || !schemeName || !navStr || navStr === 'N.A.') {
        skipped++
        continue
      }

      const nav = parseFloat(navStr)
      if (isNaN(nav) || nav <= 0) {
        skipped++
        continue
      }

      // Parse date (DD-MMM-YYYY or DD-Mon-YYYY)
      let navDate = ''
      if (dateStr) {
        try {
          const d = new Date(dateStr)
          if (!isNaN(d.getTime())) {
            navDate = d.toISOString().split('T')[0]
          }
        } catch {
          // Skip invalid dates
        }
      }

      // Determine if ELSS
      const nameUpper = schemeName.toUpperCase()
      const isElss = nameUpper.includes('ELSS') || nameUpper.includes('TAX SAVER') || nameUpper.includes('TAX SAVING')

      // Determine category
      let category = 'Other'
      if (currentCategory) {
        if (currentCategory.includes('Large Cap')) category = 'Large Cap'
        else if (currentCategory.includes('Mid Cap')) category = 'Mid Cap'
        else if (currentCategory.includes('Small Cap')) category = 'Small Cap'
        else if (currentCategory.includes('ELSS')) category = 'ELSS'
        else if (currentCategory.includes('Hybrid')) category = 'Hybrid'
        else if (currentCategory.includes('Debt') || currentCategory.includes('Liquid')) category = 'Debt'
        else if (currentCategory.includes('Index') || currentCategory.includes('ETF')) category = 'Index'
        else if (currentCategory.includes('Flexi')) category = 'Flexi Cap'
        else if (currentCategory.includes('Multi')) category = 'Multi Cap'
      }
      if (isElss) category = 'ELSS'

      funds.push({
        scheme_code: schemeCode,
        isin_growth: isinGrowth,
        scheme_name: schemeName,
        amc_name: currentAMC || 'Unknown',
        category,
        nav,
        nav_date: navDate || new Date().toISOString().split('T')[0],
        is_elss: isElss,
      })
    }

    console.log(`Parsed ${funds.length} funds, skipped ${skipped}`)

    // Batch upsert in chunks of 500
    let syncedCount = 0
    let failedCount = 0
    const batchSize = 500

    for (let i = 0; i < funds.length; i += batchSize) {
      const batch = funds.slice(i, i + batchSize)
      const { error } = await supabase
        .from('mf_funds')
        .upsert(
          batch.map((f) => ({
            ...f,
            is_active: true,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'scheme_code' }
        )

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error.message)
        failedCount += batch.length
      } else {
        syncedCount += batch.length
      }
    }

    // Log result
    await supabase.from('audit_log').insert({
      action: 'amfi.nav_sync',
      resource_type: 'mf_funds',
      metadata: {
        synced_count: syncedCount,
        failed_count: failedCount,
        total_parsed: funds.length,
        skipped,
        sync_date: new Date().toISOString(),
      },
    })

    console.log(`AMFI sync complete: ${syncedCount} synced, ${failedCount} failed`)

    return new Response(
      JSON.stringify({
        data: {
          synced_count: syncedCount,
          failed_count: failedCount,
          total_parsed: funds.length,
          sync_date: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('AMFI sync error:', error)
    return new Response(
      JSON.stringify({ error: `AMFI sync failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
