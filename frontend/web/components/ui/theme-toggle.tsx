"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { flushSync } from "react-dom"

import { Moon, Sun } from "lucide-react"

import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDarkMode(document.documentElement.classList.contains("dark"))

    const syncTheme = () =>
      setDarkMode(document.documentElement.classList.contains("dark"))

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  const onToggle = useCallback(async () => {
    if (!buttonRef.current) return

    const toggleTheme = () => {
      flushSync(() => {
        const toggled = !darkMode
        setDarkMode(toggled)
        document.documentElement.classList.toggle("dark", toggled)
        localStorage.setItem("theme", toggled ? "dark" : "light")
      })
    }

    // Fallback for browsers that don't support View Transitions API
    if (!document.startViewTransition) {
      toggleTheme()
      return
    }

    await document.startViewTransition(toggleTheme).ready

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [darkMode])

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      aria-label="Switch theme"
      className={cn(
        "flex items-center justify-center p-2 rounded-full outline-none focus:outline-none active:outline-none focus:ring-0 cursor-pointer transition-all",
        className
      )}
      type="button"
    >
      {mounted && (
        <AnimatePresence mode="wait" initial={false}>
          {darkMode ? (
            <motion.span
              key="sun-icon"
              initial={{ opacity: 0, scale: 0.55, rotate: 25 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.33 }}
              className="text-white"
            >
              <Sun className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="moon-icon"
              initial={{ opacity: 0, scale: 0.55, rotate: -25 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.33 }}
              className="text-black"
            >
              <Moon className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      )}
    </button>
  )
}
