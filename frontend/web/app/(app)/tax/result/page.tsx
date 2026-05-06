import type { Metadata } from 'next'
import { TaxResultScreen } from '@/components/screens/tax-result-screen'

export const metadata: Metadata = {
  title: 'Regime Result',
  description: 'Side-by-side tax regime comparison with recommendation and annual savings delta.',
}

export default function TaxResultPage() {
  return <TaxResultScreen />
}
