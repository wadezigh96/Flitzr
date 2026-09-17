import { NextResponse } from 'next/server'
import { bankrWalletMe } from '@/lib/bankr'

export async function GET() {
  try {
    if (!process.env.BANKR_API_KEY) {
      return NextResponse.json({ configured: false, provider: 'bankr' })
    }
    const data = await bankrWalletMe() as { success?: boolean; wallets?: Array<{ chain?: string; address?: string }> }
    const evm = data.wallets?.find(wallet => wallet.chain === 'evm')
    return NextResponse.json({
      configured: true,
      provider: 'bankr',
      wallet: evm?.address ? { chain: 'base', address: evm.address } : null,
    })
  } catch (error) {
    return NextResponse.json({
      configured: true,
      provider: 'bankr',
      error: error instanceof Error ? error.message : 'Bankr connection failed',
    }, { status: 502 })
  }
}
