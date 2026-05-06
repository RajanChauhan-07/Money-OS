import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { apiResponse, apiError } from '@/lib/api-helpers'

// GET — Single fund detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ schemeCode: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('Unauthorized', 401)

    const { schemeCode } = await params

    const { data, error } = await supabase
      .from('mf_funds')
      .select('*')
      .eq('scheme_code', schemeCode)
      .single()

    if (error || !data) {
      return apiError('Fund not found', 404)
    }

    return apiResponse(data)
  } catch (error) {
    console.error('Fund detail error:', error)
    return apiError('Internal server error', 500)
  }
}
