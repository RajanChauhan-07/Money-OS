"use client"
import * as React from "react"
import { Globe } from "lucide-react"

export function LanguageToggle() {
  const [lang, setLang] = React.useState('en')
  
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)]">
        <Globe size={16} />
        {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'தமிழ்'}
      </button>
      
      <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
        <div className="py-1">
          <button onClick={() => setLang('en')} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-surface)] text-[var(--text-primary)]">English</button>
          <button onClick={() => setLang('hi')} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-surface)] text-[var(--text-primary)]">हिंदी <span className="text-[10px] text-[var(--text-tertiary)] ml-1">(Beta)</span></button>
          <button onClick={() => setLang('ta')} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-surface)] text-[var(--text-primary)]">தமிழ் <span className="text-[10px] text-[var(--text-tertiary)] ml-1">(Beta)</span></button>
        </div>
      </div>
    </div>
  )
}
