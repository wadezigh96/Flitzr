import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.BANKR_API_KEY
  if (!key) return NextResponse.json({ configured: false, message: 'BANKR_API_KEY is not configured.' })
  try {
    const response = await fetch('https://api.bankr.bot/wallet/portfolio?chains=base', { headers: { 'X-API-Key': key }, cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ configured: true, error: data?.message || data?.error || 'Bankr portfolio request failed.' }, { status: response.status })
    return NextResponse.json({ configured: true, wallet: data })
  } catch {
    return NextResponse.json({ configured: true, error: 'Could not reach Bankr.' }, { status: 502 })
  }
}
