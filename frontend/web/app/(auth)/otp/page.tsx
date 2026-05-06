'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@money-os/ui'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function OTPPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(60)
  const [sessionData, setSessionData] = useState<{
    session_id: string
    mobile: string
    channel: string
    dev_otp?: string | null
  } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // Load session data from signup page
  useEffect(() => {
    const stored = sessionStorage.getItem('otp_session')
    if (!stored) {
      router.push('/signup')
      return
    }

    try {
      const parsed = JSON.parse(stored)
      // Check if session is expired (10 min)
      if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
        sessionStorage.removeItem('otp_session')
        router.push('/signup')
        return
      }
      setSessionData(parsed)
    } catch {
      router.push('/signup')
    }
  }, [router])

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Handle OTP input
  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      const lastInput = document.getElementById('otp-5')
      lastInput?.focus()
    }
  }

  // Verify OTP
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const otpStr = otp.join('')

    if (otpStr.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    if (!sessionData) {
      setError('Session expired. Please start over.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionData.session_id,
          otp: otpStr,
          mobile: sessionData.mobile,
        }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setIsLoading(false)
        // Clear OTP on wrong attempt
        setOtp(['', '', '', '', '', ''])
        const firstInput = document.getElementById('otp-0')
        firstInput?.focus()
        return
      }

      // Clear session storage
      sessionStorage.removeItem('otp_session')

      // Store user info
      if (data.data?.user_id) {
        sessionStorage.setItem('user_id', data.data.user_id)
      }

      // Navigate based on new/existing user
      const redirect = data.data?.redirect || '/dashboard'
      router.push(redirect)
    } catch {
      setError('Verification failed. Please try again.')
      setIsLoading(false)
    }
  }, [otp, sessionData, router])

  // Resend OTP
  const handleResend = async () => {
    if (!sessionData || resendCooldown > 0) return

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: sessionData.mobile }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      // Update session with new session_id
      const updated = {
        ...sessionData,
        session_id: data.data.session_id,
        channel: data.data.channel,
        timestamp: Date.now(),
      }
      sessionStorage.setItem('otp_session', JSON.stringify(updated))
      setSessionData(updated)

      // Reset OTP fields and cooldown
      setOtp(['', '', '', '', '', ''])
      setResendCooldown(60)
      setError('')
      const firstInput = document.getElementById('otp-0')
      firstInput?.focus()

      // Restart timer
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 0) {
            clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError('Failed to resend OTP. Please try again.')
    }
  }

  const maskedMobile = sessionData?.mobile
    ? `${sessionData.mobile.slice(0, 2)}****${sessionData.mobile.slice(-4)}`
    : '**********'

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="p-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)]">
          <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-6 py-8 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-[var(--brand-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Enter OTP
          </h1>
          <p className="text-[var(--text-secondary)] mb-1">
            We sent a 6-digit code to <span className="font-semibold text-[var(--text-primary)]">+91 {maskedMobile}</span>
          </p>
          {sessionData?.channel && sessionData.channel !== 'sms' && (
            <p className="text-xs text-[var(--warning)] mb-4">
              SMS delivery pending — check your messages in a moment.
            </p>
          )}
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div
            className="flex justify-between gap-2 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-14 text-center text-xl font-semibold rounded-xl border ${
                  error
                    ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                    : 'border-[var(--border-default)] focus:border-[var(--brand-primary)]'
                } bg-[var(--bg-base)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all`}
                autoFocus={index === 0}
              />
            ))}
          </motion.div>

          {error && (
            <motion.p
              className="text-sm text-[var(--danger)] mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={otp.join('').length !== 6 || isLoading}
            >
              Verify OTP
            </Button>
          </motion.div>
        </form>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[var(--text-secondary)] text-sm mb-2">
            Didn&apos;t receive the OTP?
          </p>
          {resendCooldown > 0 ? (
            <p className="text-[var(--text-tertiary)] text-sm">
              Resend in <span className="font-semibold text-[var(--text-primary)]">{resendCooldown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-[var(--brand-primary)] font-medium text-sm hover:underline"
            >
              Resend OTP
            </button>
          )}
        </motion.div>

        {/* Dev mode OTP display */}
        {sessionData?.dev_otp && (
          <motion.div
            className="mt-6 p-4 rounded-xl bg-[var(--info-bg)] border border-[var(--brand-primary)]/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <p className="text-xs font-medium text-[var(--brand-primary)] mb-1">Development Mode</p>
            <p className="text-sm text-[var(--text-secondary)]">
              SMS provider not configured. Your OTP is: <span className="font-bold text-lg text-[var(--text-primary)] tracking-widest">{sessionData.dev_otp}</span>
            </p>
          </motion.div>
        )}

        {/* Security info */}
        <motion.div
          className="mt-6 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck size={16} className="text-[var(--success)] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)]">Bank-grade security</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                OTP is bcrypt-hashed before storage. Three incorrect attempts trigger a cooldown.
                Your mobile number is SHA-256 hashed and never stored in plaintext.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
