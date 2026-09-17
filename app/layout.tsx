import './globals.css'
import type { Metadata } from 'next'
import BaseDeFi from '@/components/BaseDeFi'

export const metadata: Metadata = {
  title: 'Flitzr — Autonomous Onchain Agent',
  description: 'Policy-controlled onchain financial agent for Base.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<BaseDeFi /></body></html>
}
