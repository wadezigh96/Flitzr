import { NextResponse } from 'next/server'
import { agentPaymentReady, getDynamicStatus } from '@/lib/dynamic'

/**
 * GET /api/dynamic/status
 * Public health / demo endpoint for the Runtime Dynamic track.
 * Shows whether the agent server wallet is configured and ready.
 * Never exposes API tokens.
 */
export async function GET() {
  const status = getDynamicStatus()
  if (!status.configured) {
    return NextResponse.json({
      provider: 'dynamic',
      pattern: 'server-wallet',
      configured: false,
      ready: false,
      message: status.reason,
      docs: {
        agents: 'https://www.dynamic.xyz/docs/overview/agents/overview',
        payments: 'https://www.dynamic.xyz/docs/overview/agents/agent-payments',
        track: 'https://runtime.nyc/tracks/dynamic',
      },
    })
  }

  const ready = await agentPaymentReady()
  return NextResponse.json({
    provider: 'dynamic',
    pattern: 'server-wallet',
    configured: true,
    ready: ready.ready,
    address: ready.address ?? null,
    details: ready.details,
    chainId: 8453,
    network: 'Base',
    docs: {
      agents: 'https://www.dynamic.xyz/docs/overview/agents/overview',
      payments: 'https://www.dynamic.xyz/docs/overview/agents/agent-payments',
      track: 'https://runtime.nyc/tracks/dynamic',
    },
  })
}
