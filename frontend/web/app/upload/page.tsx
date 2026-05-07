'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, CheckCircle2, Shield, Loader2, Info, ArrowLeft } from 'lucide-react'
import { useTaxStore } from '@/lib/stores/tax-store'
import type { UploadState } from '@/lib/stores/tax-store'
import { cn } from '@/lib/utils'

const stageMessages: Record<string, { title: string; description: string }> = {
  uploading: {
    title: 'Uploading securely',
    description: 'Encrypting and transmitting your file for processing.'
  },
  reading: {
    title: 'Reading your document',
    description: 'Our OCR engine is identifying tables and salary fields.'
  },
  extracting: {
    title: 'Organizing your data',
    description: 'Sorting your income and tax deductions.'
  },
  reviewing: {
    title: 'Final checks',
    description: 'Cross-verifying totals to ensure 99.9% accuracy.'
  },
  done: {
    title: 'Analysis Complete',
    description: 'Your tax profile is ready. Redirecting you to review...'
  },
  error: {
    title: 'Upload Failed',
    description: 'Something went wrong. Please check your file and try again.'
  }
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const {
    uploadState,
    setUploadState,
    uploadError,
    setUploadError,
    setForm16Extraction,
    setDerivedProfile,
    setMissedOpportunities,
  } = useTaxStore()

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      setUploadError('Please upload a PDF file.')
      return
    }

    setUploadError(null)
    setUploadState('uploading')

    // Save the PDF as base64 so it persists reliably across page navigations
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      useTaxStore.getState().setPdfUrl(dataUrl)
    }
    reader.readAsDataURL(file)

    // Simulate stages with delays for UX
    await new Promise(r => setTimeout(r, 800))
    setUploadState('reading')
    await new Promise(r => setTimeout(r, 600))
    setUploadState('extracting')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/form16/parse', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error || 'Failed to parse Form 16.')
        return
      }

      setUploadState('reviewing')
      await new Promise(r => setTimeout(r, 500))

      setForm16Extraction(data.extraction)
      setDerivedProfile(data.derivedProfile)
      setMissedOpportunities(data.missedOpportunities || [])
      setUploadState('done')

      // Navigate to review page after a brief moment
      setTimeout(() => router.push('/review'), 1200)
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError('Network error. Please check your connection and try again.')
    }
  }, [router, setUploadState, setUploadError, setForm16Extraction, setDerivedProfile, setMissedOpportunities])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const isProcessing = ['uploading', 'reading', 'extracting', 'reviewing', 'done'].includes(uploadState)
  const stage = stageMessages[uploadState] || stageMessages.uploading

  return (
    <div className="min-h-screen flex flex-col items-center relative z-20">
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-[72px] pb-24">
        <div className="mb-12">
          <button
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 px-4 py-2 -ml-4 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-4">
              Upload your Form 16
            </h1>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isProcessing && uploadState !== 'done' ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative group cursor-pointer aspect-[16/10] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-12 overflow-hidden",
                  isDragging 
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5" 
                    : "border-[var(--border-strong)] hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface)]"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                  accept=".pdf"
                />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="text-[var(--brand-primary)]" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Click to upload or drag & drop
                  </h3>
                  <p className="text-sm text-[var(--text-tertiary)] max-w-[240px]">
                    Only PDF files are supported. <br />Max file size 5MB.
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/setup');
                    }}
                    className="mt-10 group flex items-center gap-1.5 text-xs font-bold tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors uppercase z-20"
                  >
                    <FileText className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                    Enter manually instead
                  </button>
                </div>

                {isDragging && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-[var(--brand-primary)]/5 backdrop-blur-[2px] z-0 pointer-events-none"
                  />
                )}
              </div>

              {uploadState === 'error' && uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger)]/20 flex items-start gap-3"
                >
                  <X size={18} className="text-[var(--danger)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--danger)]">{uploadError}</p>
                </motion.div>
              )}

              <p className="text-center mt-6 text-xs text-[var(--text-tertiary)] flex items-center justify-center gap-1.5">
                <Shield size={12} />
                Your PDF is processed in memory and never stored permanently.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="progress"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md mx-auto text-center"
            >
              <div className="mb-8">
                {uploadState === 'done' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 size={40} className="text-[var(--success)]" />
                  </motion.div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center mx-auto">
                    <Loader2 size={32} className="text-[var(--brand-primary)] animate-spin" />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                {stage.title}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {stage.description}
              </p>

              {/* Progress stages */}
              <div className="mt-10 space-y-3 text-left">
                {(['uploading', 'reading', 'extracting', 'reviewing'] as UploadState[]).map((s, i) => {
                  const stageOrder = ['uploading', 'reading', 'extracting', 'reviewing']
                  const currentIdx = stageOrder.indexOf(uploadState)
                  const thisIdx = i
                  const isDone = uploadState === 'done' || thisIdx < currentIdx
                  const isCurrent = thisIdx === currentIdx
                  
                  return (
                    <div key={s} className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-[var(--success)] shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 size={18} className="text-[var(--brand-primary)] animate-spin shrink-0" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-[var(--border-default)] shrink-0" />
                      )}
                      <span className={cn("text-sm", (isDone || isCurrent) ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
                        {stageMessages[s].title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
