'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Bell,
  ArrowLeft,
  TrendingUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { fmtRupee } from '@/lib/stores/tracker-store'

const glass = 'rounded-[2.5rem] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-[40px] shadow-2xl dark:shadow-none'
const surface = 'rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 backdrop-blur-xl'

type EventType = 'Tax' | 'SIP' | 'Bill' | 'Dividend' | 'Reminder'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: EventType
  amount?: number
  description?: string
  completed?: boolean
}

const TAX_EVENTS: Omit<CalendarEvent, 'id'>[] = [
  { title: 'ITR Filing Deadline', date: new Date(2025, 6, 31), type: 'Tax', description: 'Individual tax filing deadline for FY 2024-25' },
  { title: 'Advance Tax Q1', date: new Date(2025, 5, 15), type: 'Tax', description: '15% of estimated tax due' },
  { title: 'Advance Tax Q2', date: new Date(2025, 8, 15), type: 'Tax', description: '45% of estimated tax due' },
  { title: 'Advance Tax Q3', date: new Date(2025, 11, 15), type: 'Tax', description: '75% of estimated tax due' },
  { title: 'Advance Tax Q4', date: new Date(2026, 2, 15), type: 'Tax', description: '100% of estimated tax due' },
]

export default function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const events: CalendarEvent[] = [
    ...TAX_EVENTS.map((e, i) => ({ ...e, id: `tax-${i}` })),
    { id: 'sip-1', title: 'Monthly SIP - Index Fund', date: new Date(year, month, 5), type: 'SIP', amount: 25000, completed: true },
    { id: 'sip-2', title: 'Monthly SIP - Midcap', date: new Date(year, month, 10), type: 'SIP', amount: 15000 },
    { id: 'bill-1', title: 'Credit Card Payment', date: new Date(year, month, 18), type: 'Bill', amount: 42500 },
    { id: 'div-1', title: 'HDFC Dividend Credit', date: new Date(year, month, 22), type: 'Dividend', amount: 1200 },
    { id: 'rem-1', title: 'Review Portfolio', date: new Date(year, month, 28), type: 'Reminder' },
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const prevMonthPadding = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))

  const getEventsForDay = (day: number) => {
    return events.filter(e => 
      e.date.getDate() === day && 
      e.date.getMonth() === month && 
      e.date.getFullYear() === year
    )
  }

  const selectedDayEvents = selectedDate ? events.filter(e => 
    e.date.getDate() === selectedDate.getDate() && 
    e.date.getMonth() === selectedDate.getMonth() && 
    e.date.getFullYear() === selectedDate.getFullYear()
  ) : []

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} /> Back
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/5 dark:bg-white/10 flex items-center justify-center backdrop-blur-3xl border border-black/5 dark:border-white/10">
                <CalendarIcon className="text-zinc-900 dark:text-white" size={24} />
              </div>
              Financial Calendar
            </h1>
            <p className="text-zinc-500 dark:text-white/50 text-lg font-medium">Never miss a tax deadline or investment milestone.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 p-2 rounded-[2rem] border border-black/5 dark:border-white/10 backdrop-blur-3xl">
            <button onClick={prevMonth} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"><ChevronLeft size={20} /></button>
            <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white min-w-[140px] text-center">{monthName} {year}</span>
            <button onClick={nextMonth} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
          
          {/* Calendar View */}
          <div className={cn(glass, "p-10")}>
            {/* Weekday Headers */}
            <div 
              className="gap-2 mb-6"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/20 pb-4">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div 
              className="gap-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            >
              {prevMonthPadding.map(i => (
                <div key={`padding-${i}`} className="aspect-square" />
              ))}
              
              {days.map(day => {
                const dayEvents = getEventsForDay(day)
                const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    style={{ aspectRatio: '1/1' }}
                    className={cn(
                      "relative rounded-2xl md:rounded-[2rem] p-2 transition-all duration-300 group flex flex-col items-center justify-center border",
                      isSelected 
                        ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white shadow-2xl z-10" 
                        : "bg-black/5 dark:bg-white/[0.03] border-black/5 dark:border-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10"
                    )}
                  >
                    <span className={cn(
                      "text-sm md:text-xl font-bold",
                      isSelected ? "text-white dark:text-black" : "text-zinc-400 dark:text-white/40 group-hover:text-zinc-900 dark:group-hover:text-white"
                    )}>
                      {day}
                    </span>
                    
                    {isToday && !isSelected && (
                      <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}

                    <div className="absolute bottom-3 flex gap-1">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div key={i} className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isSelected ? "bg-white/40 dark:bg-black/20" : 
                          e.type === 'Tax' ? "bg-amber-500" :
                          e.type === 'SIP' ? "bg-emerald-500" :
                          e.type === 'Bill' ? "bg-rose-500" : "bg-zinc-400"
                        )} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-8 h-full">
            <div className={cn(glass, "p-10 flex flex-col min-h-[500px]")}>
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tighter">
                    {selectedDate?.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40">Today's Focus</p>
                </div>
                <button className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all">
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {selectedDayEvents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-500 mb-4" />
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No activities</p>
                  </div>
                ) : (
                  selectedDayEvents.map(e => (
                    <div key={e.id} className={cn(surface, "p-6 group hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all")}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                              e.type === 'Tax' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                              e.type === 'SIP' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                              "bg-zinc-500/10 border-zinc-500/20 text-zinc-500"
                            )}>
                              {e.type}
                            </span>
                            {e.completed && <CheckCircle2 size={12} className="text-emerald-500" />}
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{e.title}</h4>
                          {e.amount && <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">{fmtRupee(e.amount)}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-10 pt-10 border-t border-black/5 dark:border-white/5 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/40 flex items-center gap-2">
                  <Bell size={14} className="text-rose-500" /> Critical
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start p-5 rounded-3xl bg-rose-500/5 border border-rose-500/10">
                    <AlertCircle className="text-rose-500 mt-1" size={18} />
                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400/80 leading-relaxed">Advance tax Q4 is approaching. Ensure liquidity by Mar 15.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
