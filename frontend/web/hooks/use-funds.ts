import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

async function fetchJSON(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

// Debounced fund search
export function useFundSearch(query: string, options?: { category?: string; isElss?: boolean }) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const params = new URLSearchParams()
  if (debouncedQuery) params.set('q', debouncedQuery)
  if (options?.category) params.set('category', options.category)
  if (options?.isElss) params.set('is_elss', 'true')

  return useQuery({
    queryKey: ['funds', 'search', debouncedQuery, options],
    queryFn: () => fetchJSON(`/api/funds/search?${params}`),
    enabled: debouncedQuery.length >= 2 || !!options?.category || !!options?.isElss,
  })
}

// Single fund detail
export function useFundDetail(schemeCode: string) {
  return useQuery({
    queryKey: ['funds', schemeCode],
    queryFn: () => fetchJSON(`/api/funds/${schemeCode}`),
    enabled: !!schemeCode,
  })
}
