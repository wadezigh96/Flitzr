import './globals.css'
import type { Metadata } from 'next'
import BaseDeFi from '@/components/BaseDeFi'
import PrivyProvider from '@/components/PrivyProvider'

export const metadata: Metadata = {
  title: 'Flitzr — Autonomous Onchain Agent',
  description: 'Policy-controlled onchain financial agent for Base.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PrivyProvider>{children}</PrivyProvider><BaseDeFi /></body></html>
}
