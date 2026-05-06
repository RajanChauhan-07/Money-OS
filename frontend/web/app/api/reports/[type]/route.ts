import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/api-helpers'

// GET — Generate report (returns data for PDF generation)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { type } = await params

    switch (type) {
      case 'tax': {
        const { data } = await supabase
          .from('tax_calculations')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_current', true)
          .single()
        return apiResponse({ type: 'tax-report', data })
      }
      case 'investment-plan': {
        const { data } = await supabase
          .from('investment_plans')
          .select('*, tax_calculations(*)')
          .eq('user_id', user.id)
          .eq('is_current', true)
          .single()
        return apiResponse({ type: 'investment-plan', data })
      }
      case 'form16': {
        const { data: taxCalc } = await supabase
          .from('tax_calculations')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_current', true)
          .single()
        const { data: salary } = await supabase
          .from('salary_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()
        return apiResponse({ type: 'form16-preview', taxCalc, salary })
      }
      default:
        return apiError('Invalid report type. Use: tax, investment-plan, form16', 400)
    }
  } catch (error) {
    console.error('Report error:', error)
    return apiError('Internal server error', 500)
  }
}
