'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Sparkles, User, Loader2 } from 'lucide-react'
import { useTaxStore } from '@/lib/stores/tax-store'
import { cn } from '@/lib/utils'
import { formatRupee } from '@/lib/utils/format'

interface Message {
  role: 'user' | 'model'
  content: string
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your AI CA. I've analyzed your tax profile. Ask me anything about your regime comparison, deductions, or investment plan!" }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { taxResult, taxInput } = useTaxStore()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !taxResult || !taxInput) return

    const newMessages: Message[] = [...messages, { role: 'user', content: input.trim() }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Build context
    const context = {
      income: formatRupee(taxResult.old.grossIncome),
      recommendedRegime: taxResult.recommendedRegime,
      taxUnderOld: formatRupee(taxResult.old.totalTax),
      taxUnderNew: formatRupee(taxResult.new.totalTax),
      efficiencyScore: taxResult.taxEfficiencyScore,
      lossMeter: formatRupee(taxResult.lossMeter),
      insights: taxResult.insights.map(i => i.title),
      deductions: taxResult.old.deductionBreakdown?.map(d => `${d.section}: Claimed ${formatRupee(d.amount)} out of limit ${formatRupee(d.limit)}`)
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context })
      })
      const data = await res.json()
      
      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'model', content: "Sorry, I ran into an error generating a response." }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, there was a network error." }])
    } finally {
      setIsLoading(false)
    }
  }

  // Only render if we have a result
  if (!taxResult) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[var(--brand-primary)] text-[var(--text-inverse)] shadow-xl transition-transform hover:scale-110",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Sparkles size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-[var(--brand-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Tax Advisor</h3>
                  <p className="text-[10px] text-[var(--success)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block"></span>
                    Online & Analyzing
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex items-start gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1",
                    m.role === 'user' ? "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]" : "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  )}>
                    {m.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm",
                    m.role === 'user' ? "bg-[var(--text-primary)] text-[var(--bg-base)] rounded-tr-sm" : "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-tl-sm whitespace-pre-wrap"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={12} />
                  </div>
                  <div className="p-3 rounded-2xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-tl-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-[var(--text-tertiary)]" />
                    <span className="text-[var(--text-tertiary)]">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your taxes..."
                  disabled={isLoading}
                  className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-full px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-full bg-[var(--brand-primary)] text-[var(--text-inverse)] flex items-center justify-center disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send size={16} className="ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
