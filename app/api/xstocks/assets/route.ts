import { NextResponse } from 'next/server'

const API_BASE = 'https://api.xstocks.fi/api/v2'

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/public/assets`, { next: { revalidate: 60 } })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: 'xStocks assets API unavailable', details: data }, { status: 502 })
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({ error: 'Could not reach xStocks public API.' }, { status: 502 })
  }
}
