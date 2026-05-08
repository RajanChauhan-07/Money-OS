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

// Premium Frosted Utilities
const glass = 'rounded-[2rem] bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 backdrop-blur-[100px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]'
const surface = 'rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5'

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

  if (!taxResult) return null

  return (
    <div className="fixed bottom-8 right-8 z-[100] pointer-events-none">
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "pointer-events-auto p-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black shadow-2xl transition-all hover:scale-110 active:scale-95 group",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <Sparkles size={28} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            className={cn(glass, "pointer-events-auto w-[400px] max-w-[calc(100vw-4rem)] h-[650px] max-h-[calc(100vh-10rem)] flex flex-col overflow-hidden")}
          >
            {/* Header */}
            <div className="p-8 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
                  <Sparkles size={20} className="text-white dark:text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">AI Strategy Advisor</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400/80">Active Analysis</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex items-start gap-4 max-w-[90%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm",
                    m.role === 'user' ? "bg-zinc-100 dark:bg-white/10 text-zinc-400 dark:text-white/40" : "bg-zinc-900 dark:bg-white text-white dark:text-black"
                  )}>
                    {m.role === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  </div>
                  <div className={cn(
                    "p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm",
                    m.role === 'user' ? "bg-zinc-900 dark:bg-white text-white dark:text-black rounded-tr-sm" : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-zinc-900 dark:text-white rounded-tl-sm whitespace-pre-wrap"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4 max-w-[90%]">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={14} />
                  </div>
                  <div className="p-5 rounded-[1.5rem] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-tl-sm flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-zinc-400 dark:text-white/40" />
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-white/40">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-white/40 dark:bg-white/[0.02] border-t border-black/5 dark:border-white/10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="flex items-center gap-4"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a financial question..."
                  disabled={isLoading}
                  className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-zinc-900 dark:text-white font-bold placeholder-zinc-400 dark:placeholder-white/20 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-50 transition-all shadow-xl hover:scale-105 active:scale-95 shrink-0"
                >
                  <Send size={20} className="ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
