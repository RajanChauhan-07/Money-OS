"use client"
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { Info } from "lucide-react"

export function InfoTooltip({ text }: { text: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button type="button" className="inline-flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]">
            <Info size={14} className="ml-1 opacity-70 hover:opacity-100" />
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          sideOffset={4}
          className="z-50 max-w-[280px] rounded-lg bg-[#111111] border border-[#222222] px-3 py-2.5 text-xs text-white shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 leading-relaxed"
        >
          {text}
          <TooltipPrimitive.Arrow className="fill-[#222222]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
