/**
 * Broker deep links for investment execution.
 * Instead of building a broker integration, we deep-link users to their preferred platform.
 */

export interface BrokerLink {
  name: string
  logo: string // emoji for now
  url: string
  description: string
}

const brokers: Record<string, BrokerLink> = {
  zerodha: {
    name: 'Zerodha Coin',
    logo: '🟢',
    url: 'https://coin.zerodha.com/explore',
    description: "India's largest broker. Great for ELSS and index funds.",
  },
  groww: {
    name: 'Groww',
    logo: '🟡',
    url: 'https://groww.in/mutual-funds',
    description: 'Simple UI. Good for beginners and SIP setup.',
  },
  kuvera: {
    name: 'Kuvera',
    logo: '🔵',
    url: 'https://kuvera.in/explore',
    description: 'Direct plans only. Zero commission. Tax harvesting built-in.',
  },
  hdfc: {
    name: 'HDFC MF',
    logo: '🔴',
    url: 'https://www.hdfcfund.com/investor-desk',
    description: 'Direct from AMC. Best for HDFC Tax Saver.',
  },
  nps: {
    name: 'NPS (eNPS)',
    logo: '🏛️',
    url: 'https://enps.nsdl.com/eNPS/',
    description: 'Official NPS portal. For 80CCD(1B) deduction.',
  },
  ppf: {
    name: 'PPF (SBI)',
    logo: '🏦',
    url: 'https://www.onlinesbi.sbi/',
    description: 'Open or contribute to PPF via your bank.',
  },
}

export type InstrumentType = 'ELSS' | 'NPS' | 'PPF' | 'Health Insurance' | 'Index Fund' | 'Debt Fund'

export function getBrokerLinksForInstrument(instrument: InstrumentType): BrokerLink[] {
  switch (instrument) {
    case 'ELSS':
      return [brokers.kuvera, brokers.groww, brokers.zerodha, brokers.hdfc]
    case 'NPS':
      return [brokers.nps]
    case 'PPF':
      return [brokers.ppf]
    case 'Health Insurance':
      return [
        { name: 'PolicyBazaar', logo: '🛡️', url: 'https://www.policybazaar.com/health-insurance/', description: 'Compare health insurance plans.' },
      ]
    case 'Index Fund':
    case 'Debt Fund':
      return [brokers.kuvera, brokers.groww, brokers.zerodha]
    default:
      return [brokers.kuvera, brokers.groww]
  }
}

export function getAllBrokers(): BrokerLink[] {
  return Object.values(brokers)
}
