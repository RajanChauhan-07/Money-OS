import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

async function fetchJSON(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

// Current tax calculation
export function useTaxCurrent() {
  return useQuery({
    queryKey: ['tax', 'current'],
    queryFn: () => fetchJSON('/api/tax/current'),
  })
}

// Tax calculation history
export function useTaxHistory() {
  return useQuery({
    queryKey: ['tax', 'history'],
    queryFn: () => fetchJSON('/api/tax/history'),
  })
}

// Current investment plan
export function useInvestmentPlan() {
  return useQuery({
    queryKey: ['tax', 'plan'],
    queryFn: () => fetchJSON('/api/tax/plan'),
  })
}

// Trigger tax recalculation
export function useCalculateTax() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (triggerReason?: string) => {
      const res = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_reason: triggerReason || 'manual' }),
      })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax'] })
    },
  })
}
