import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError, getClientIP, writeAuditLog } from '@/lib/api-helpers'

// GET — List all active goals
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) return apiError('Failed to fetch goals', 500)
    return apiResponse(data || [])
  } catch (error) {
    console.error('Goals GET error:', error)
    return apiError('Internal server error', 500)
  }
}

// POST — Add a new goal
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const ip = getClientIP(request)

    if (!body.goal_type || !body.name || !body.target_amount || !body.target_year) {
      return apiError('goal_type, name, target_amount, and target_year are required', 400)
    }

    // Compute monthly SIP required (simple FV calculation)
    const yearsToGoal = body.target_year - new Date().getFullYear()
    const remaining = body.target_amount - (body.current_savings || 0)
    const assumedReturn = 0.12 // 12% annual
    const monthlyRate = assumedReturn / 12
    const months = Math.max(yearsToGoal * 12, 1)
    const monthlySIP = remaining > 0
      ? (remaining * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1)
      : 0

    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        user_id: user.id,
        goal_type: body.goal_type,
        name: body.name,
        target_amount: body.target_amount,
        target_year: body.target_year,
        current_savings: body.current_savings || 0,
        priority: body.priority || 3,
        monthly_sip_required: Math.round(monthlySIP),
      })
      .select()
      .single()

    if (error) return apiError('Failed to create goal', 500)

    await writeAuditLog({
      userId: user.id,
      action: 'goal.created',
      resourceType: 'financial_goals',
      resourceId: data.id,
      ipAddress: ip,
    })

    return apiResponse(data, 201)
  } catch (error) {
    console.error('Goals POST error:', error)
    return apiError('Internal server error', 500)
  }
}

// PATCH — Update a goal
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return apiError('Goal id is required', 400)

    // Recompute SIP if target changed
    if (updates.target_amount || updates.target_year) {
      const { data: goal } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (goal) {
        const targetAmount = updates.target_amount || goal.target_amount
        const targetYear = updates.target_year || goal.target_year
        const currentSavings = updates.current_savings ?? goal.current_savings
        const yearsToGoal = targetYear - new Date().getFullYear()
        const remaining = targetAmount - currentSavings
        const monthlyRate = 0.12 / 12
        const months = Math.max(yearsToGoal * 12, 1)
        updates.monthly_sip_required = remaining > 0
          ? Math.round((remaining * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1))
          : 0
      }
    }

    const { data, error } = await supabase
      .from('financial_goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return apiError('Failed to update goal', 500)
    return apiResponse(data)
  } catch (error) {
    console.error('Goals PATCH error:', error)
    return apiError('Internal server error', 500)
  }
}

// DELETE — Soft delete (set is_active=false)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return apiError('Goal id is required', 400)

    const { error } = await supabase
      .from('financial_goals')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return apiError('Failed to delete goal', 500)

    await writeAuditLog({
      userId: user.id,
      action: 'goal.deleted',
      resourceType: 'financial_goals',
      resourceId: id,
      ipAddress: getClientIP(request),
    })

    return apiResponse({ deleted: true })
  } catch (error) {
    console.error('Goals DELETE error:', error)
    return apiError('Internal server error', 500)
  }
}
