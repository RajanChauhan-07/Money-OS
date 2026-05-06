import type { Metadata } from 'next'
import { DashboardScreen } from '@/components/screens/dashboard-screen'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Money OS home dashboard with annual tax status, next action, and portfolio context.',
}

export default function DashboardPage() {
  return <DashboardScreen />
}
