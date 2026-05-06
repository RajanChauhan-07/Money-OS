import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Providers } from './providers'
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: {
    default: 'Money OS — Tax-Optimized Savings Planner',
    template: '%s | Money OS',
  },
  description: 'Plan your taxes, optimize your savings, track your goals. Built for Indian salaried professionals.',
  keywords: ['tax planning', 'India', '80C', 'NPS', 'savings', 'ITR'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="relative min-h-screen bg-white dark:bg-zinc-950">
        <Providers>
          <AuroraBackground className="fixed inset-0 z-0 w-full h-full pointer-events-none" />
          <div className="relative z-10 flex flex-col min-h-screen">
            <header className="w-full max-w-7xl mx-auto px-6 pt-4 pb-2 flex justify-center items-center relative z-50">
              <NavHeader />
            </header>
            <div className="fixed right-4 top-4 z-50 md:right-6 md:top-6">
              <ThemeToggle />
            </div>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
