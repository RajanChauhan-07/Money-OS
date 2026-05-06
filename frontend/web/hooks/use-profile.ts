import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

async function fetchJSON(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// Salary profile
export function useSalaryProfile() {
  return useQuery({
    queryKey: ['profile', 'salary'],
    queryFn: () => fetchJSON('/api/profile/salary'),
  })
}

export function useUpdateSalary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => postJSON('/api/profile/salary', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'salary'] })
      qc.invalidateQueries({ queryKey: ['tax'] })
    },
  })
}

// Life situation
export function useLifeSituation() {
  return useQuery({
    queryKey: ['profile', 'life'],
    queryFn: () => fetchJSON('/api/profile/life'),
  })
}

export function useUpdateLife() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => postJSON('/api/profile/life', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'life'] })
      qc.invalidateQueries({ queryKey: ['tax'] })
    },
  })
}

// Existing investments
export function useExistingInvestments() {
  return useQuery({
    queryKey: ['profile', 'investments'],
    queryFn: () => fetchJSON('/api/profile/investments'),
  })
}

export function useUpdateInvestments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => postJSON('/api/profile/investments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'investments'] })
      qc.invalidateQueries({ queryKey: ['tax'] })
    },
  })
}

// Financial goals
export function useGoals() {
  return useQuery({
    queryKey: ['profile', 'goals'],
    queryFn: () => fetchJSON('/api/profile/goals'),
  })
}

export function useAddGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => postJSON('/api/profile/goals', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch('/api/profile/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'goals'] }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/profile/goals?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'goals'] }),
  })
}

// Risk assessment
export function useRiskAssessment() {
  return useQuery({
    queryKey: ['profile', 'risk'],
    queryFn: () => fetchJSON('/api/profile/risk'),
  })
}

export function useSubmitRisk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answers: Array<{ q: number; a: string; value: number }>) =>
      postJSON('/api/profile/risk', { answers }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'risk'] }),
  })
}
