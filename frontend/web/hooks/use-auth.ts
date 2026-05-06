import { useMutation } from '@tanstack/react-query'

interface OTPSendResponse {
  data: { session_id: string; expires_in: number; channel: string } | null
  error: string | null
}

interface OTPVerifyResponse {
  data: { user_id: string; is_new_user: boolean; redirect: string } | null
  error: string | null
}

export function useSendOTP() {
  return useMutation({
    mutationFn: async (mobile: string): Promise<OTPSendResponse> => {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })
      return res.json()
    },
  })
}

export function useVerifyOTP() {
  return useMutation({
    mutationFn: async (params: {
      session_id: string
      otp: string
      mobile: string
    }): Promise<OTPVerifyResponse> => {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      return res.json()
    },
  })
}

export function useVerifyPAN() {
  return useMutation({
    mutationFn: async (params: { pan: string; full_name?: string; dob?: string }) => {
      const res = await fetch('/api/auth/pan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      return res.json()
    },
  })
}

export function useKYC() {
  return useMutation({
    mutationFn: async (action: 'initiate' | 'callback' | 'verify') => {
      const res = await fetch('/api/auth/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      return res.json()
    },
  })
}
