'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MotionPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn('page-grid', className)}
    >
      {children}
    </motion.div>
  )
}
