import { NextResponse } from 'next/server'
import { agentPaymentReady, getDynamicStatus, PINNED_AGENT_WALLET } from '@/lib/dynamic'

export async function GET() {
  const status = getDynamicStatus()
  if (!status.configured) {
    return NextResponse.json({
      provider: 'dynamic',
      pattern: 'server-wallet',
      configured: false,
      ready: false,
      message: status.reason,
      chainId: 8453,
      network: 'Base',
    })
  }

  const ready = await agentPaymentReady()
  return NextResponse.json({
    provider: 'dynamic',
    pattern: 'server-wallet',
    configured: true,
    ready: ready.ready,
    address: ready.address ?? PINNED_AGENT_WALLET,
    walletId: ready.walletId ?? null,
    details: ready.details,
    chainId: 8453,
    network: 'Base',
    explorer: `https://basescan.org/address/${ready.address ?? PINNED_AGENT_WALLET}`,
    docs: {
      agents: 'https://www.dynamic.xyz/docs/overview/agents/overview',
      payments: 'https://www.dynamic.xyz/docs/overview/agents/agent-payments',
      track: 'https://runtime.nyc/tracks/dynamic',
    },
  })
}
