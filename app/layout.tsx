import './globals.css'
import type { Metadata } from 'next'
import BaseDeFi from '@/components/BaseDeFi'
import PrivyProvider from '@/components/PrivyProvider'

export const metadata: Metadata = {
  title: 'Flitzr — Defensive Autonomous Financial Agent',
  description: 'Flitzr is an autonomous onchain financial agent for Base. It turns natural-language goals into Defensive-controlled plans with explicit approval, wallet signing, multi-provider routing, and auditable execution.',
  keywords: [
    'Flitzr',
    'autonomous financial agent',
    'onchain agent',
    'Base',
    'Defensive',
    'Privy',
    'x402',
    'Uniswap',
    'Bankr',
    'Definitive',
    'tokenized stocks',
  ],
  openGraph: {
    title: 'Flitzr — Defensive Autonomous Financial Agent',
    description: 'Autonomous onchain finance on Base with deterministic Defensive guardrails, explicit wallet signing, and multi-provider execution.',
    type: 'website',
    url: 'https://flitzr.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flitzr — Defensive Autonomous Financial Agent',
    description: 'Natural language → Defensive → approval → signing → onchain execution on Base.',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PrivyProvider>{children}<BaseDeFi /></PrivyProvider></body></html>
}
