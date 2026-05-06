import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

async function fetchJSON(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

// Holdings with live NAV
export function useHoldings() {
  return useQuery({
    queryKey: ['portfolio', 'holdings'],
    queryFn: () => fetchJSON('/api/portfolio/holdings'),
  })
}

// Transactions
export function useTransactions(params?: { limit?: number; offset?: number; type?: string }) {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  if (params?.type) query.set('type', params.type)

  return useQuery({
    queryKey: ['portfolio', 'transactions', params],
    queryFn: () => fetchJSON(`/api/portfolio/transactions?${query}`),
  })
}

// XIRR
export function usePortfolioXIRR() {
  return useQuery({
    queryKey: ['portfolio', 'xirr'],
    queryFn: () => fetchJSON('/api/portfolio/xirr'),
  })
}

// SIP mandates
export function useSIPMandates() {
  return useQuery({
    queryKey: ['portfolio', 'sip'],
    queryFn: () => fetchJSON('/api/portfolio/sip'),
  })
}

// Create SIP
export function useCreateSIP() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { scheme_code: string; amount: number; sip_date: number; frequency?: string; goal_id?: string }) => {
      const res = await fetch('/api/portfolio/sip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'sip'] }),
  })
}

// Modify SIP (pause/resume/cancel)
export function useModifySIP() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; action: 'pause' | 'resume' | 'cancel' | 'modify'; amount?: number }) => {
      const res = await fetch('/api/portfolio/sip', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', 'sip'] }),
  })
}

// Lumpsum invest
export function useInvest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { scheme_code: string; amount: number; goal_id?: string; section?: string }) => {
      const res = await fetch('/api/portfolio/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio'] })
    },
  })
}
