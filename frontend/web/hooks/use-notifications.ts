import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

async function fetchJSON(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

// All notifications
export function useNotifications(unreadOnly = false) {
  const params = unreadOnly ? '?unread=true' : ''
  return useQuery({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: () => fetchJSON(`/api/notifications${params}`),
    refetchInterval: 60000, // Poll every 60 seconds
  })
}

// Unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?unread=true')
      const json = await res.json()
      return json.data?.unread_count || 0
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

// Mark as read
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { id?: string; mark_all_read?: boolean }) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
