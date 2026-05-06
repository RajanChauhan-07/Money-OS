'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@money-os/ui'
import { Lock } from 'lucide-react'

export default function MPINPage() {
  const router = useRouter()
  const [mpin, setMpin] = useState(['', '', '', '', '', ''])
  const [confirmMpin, setConfirmMpin] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'set' | 'confirm'>('set')
  const [error, setError] = useState('')

  const handleChange = (index: number, value: string, isConfirm: boolean) => {
    if (value.length > 1) return
    const setter = isConfirm ? setConfirmMpin : setMpin
    const current = isConfirm ? confirmMpin : mpin
    const newMpin = [...current]
    newMpin[index] = value
    setter(newMpin)

    if (value && index < 5) {
      const nextInput = document.getElementById(`mpin-${isConfirm ? 'confirm' : 'set'}-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean) => {
    if (e.key === 'Backspace' && !mpin[index] && index > 0) {
      const prevInput = document.getElementById(`mpin-${isConfirm ? 'confirm' : 'set'}-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleContinue = () => {
    const mpinStr = mpin.join('')
    if (mpinStr.length !== 6) return
    setError('')
    setStep('confirm')
    setConfirmMpin(['', '', '', '', '', ''])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const mpinStr = mpin.join('')
    const confirmStr = confirmMpin.join('')
    if (mpinStr !== confirmStr) {
      setError('MPINs do not match. Please try again.')
      setStep('set')
      return
    }
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="h-1 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--brand-primary)] w-full rounded-full" />
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-2">Step 6 of 6</p>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 px-6 py-8 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-4">
            <Lock className="text-[var(--brand-primary)]" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {step === 'set' ? 'Set your MPIN' : 'Confirm your MPIN'}
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {step === 'set'
              ? 'Create a 6-digit MPIN to secure your account'
              : 'Re-enter your 6-digit MPIN to confirm'}
          </p>
        </motion.div>

        <motion.div
          className="flex justify-between gap-2 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {(step === 'set' ? mpin : confirmMpin).map((digit, index) => (
            <input
              key={index}
              id={`mpin-${step === 'set' ? 'set' : 'confirm'}-${index}`}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value, step === 'confirm')}
              onKeyDown={(e) => handleKeyDown(index, e, step === 'confirm')}
              className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 outline-none transition-all"
            />
          ))}
        </motion.div>

        {error && (
          <motion.div
            className="mb-4 p-3 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger)]/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xs text-[var(--danger)]">{error}</p>
          </motion.div>
        )}

        <motion.div
          className="pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {step === 'set' ? (
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleContinue}
              disabled={mpin.join('').length !== 6}
            >
              Continue
            </Button>
          ) : (
            <form onSubmit={handleSubmit}>
              <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                Complete Setup
              </Button>
            </form>
          )}
        </motion.div>

        <motion.div
          className="mt-8 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[var(--brand-primary)] text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">Choose a unique MPIN</p>
              <p className="text-xs text-[var(--text-tertiary)]">Don't use obvious combinations like 123456</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[var(--brand-primary)] text-xs font-bold">🔒</span>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">Keep it private</p>
              <p className="text-xs text-[var(--text-tertiary)]">Never share your MPIN with anyone</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
