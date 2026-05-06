import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// POST — Submit risk quiz, compute score, store assessment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { answers } = body

    if (!answers || !Array.isArray(answers) || answers.length < 5) {
      return apiError('Risk quiz requires at least 5 answers', 400)
    }

    // Compute risk score from answers
    // Each answer has a value from 0-20, total max = 100
    const score = Math.min(
      100,
      answers.reduce((sum: number, a: { value: number }) => sum + (a.value || 0), 0)
    )

    // Determine profile and equity allocation
    let profile: 'conservative' | 'moderate' | 'aggressive'
    let equityPct: number

    if (score <= 30) {
      profile = 'conservative'
      equityPct = 30
    } else if (score <= 65) {
      profile = 'moderate'
      equityPct = 60
    } else {
      profile = 'aggressive'
      equityPct = 80
    }

    // Set previous assessment as not current
    await supabase
      .from('risk_assessments')
      .update({ is_current: false })
      .eq('user_id', user.id)
      .eq('is_current', true)

    // Insert new assessment
    const { data, error } = await supabase
      .from('risk_assessments')
      .insert({
        user_id: user.id,
        score,
        profile,
        equity_pct: equityPct,
        answers,
        is_current: true,
      })
      .select()
      .single()

    if (error) return apiError('Failed to save risk assessment', 500)

    // Update onboarding step
    await supabase
      .from('users')
      .update({ onboarding_step: 7 })
      .eq('id', user.id)

    const ip = getClientIP(request)
    await writeAuditLog({
      userId: user.id,
      action: 'risk.assessed',
      resourceType: 'risk_assessments',
      resourceId: data.id,
      ipAddress: ip,
      metadata: { score, profile, equity_pct: equityPct },
    })

    return apiResponse({
      id: data.id,
      score,
      profile,
      equity_pct: equityPct,
      debt_pct: 100 - equityPct,
    }, 201)
  } catch (error) {
    console.error('Risk POST error:', error)
    return apiError('Internal server error', 500)
  }
}

// GET — Get current risk assessment
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      return apiError('Failed to fetch risk assessment', 500)
    }

    return apiResponse(data)
  } catch (error) {
    console.error('Risk GET error:', error)
    return apiError('Internal server error', 500)
  }
}
