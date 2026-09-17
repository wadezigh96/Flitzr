/**
 * Dynamic Server Wallet adapter for Flitzr.
 *
 * Pattern: Server wallets (API token auth, wallets belong to developer account).
 * Used by the agent for policy-checked payment / signing actions on Base.
 *
 * Track: Runtime "Dynamic – Best Agentic Wallet or Payment Experience"
 * Docs: https://www.dynamic.xyz/docs/overview/agents/overview
 *       https://www.dynamic.xyz/docs/overview/agents/agent-payments
 *
 * This adapter is optional. If DYNAMIC_AUTH_TOKEN / DYNAMIC_ENVIRONMENT_ID
 * are missing, all methods return a clear "not configured" result so the
 * rest of Flitzr continues to work with user-controlled SIWE wallets.
 */

export type DynamicWalletStatus =
  | { configured: false; reason: string }
  | {
      configured: true
      environmentId: string
      address?: `0x${string}`
      walletId?: string
    }

export type DynamicSignResult =
  | { ok: false; error: string }
  | { ok: true; signature: `0x${string}`; address: `0x${string}` }

function env() {
  const authToken = process.env.DYNAMIC_AUTH_TOKEN?.trim()
  const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID?.trim()
  return { authToken, environmentId }
}

export function getDynamicStatus(): DynamicWalletStatus {
  const { authToken, environmentId } = env()
  if (!authToken || !environmentId) {
    return {
      configured: false,
      reason:
        'DYNAMIC_AUTH_TOKEN and DYNAMIC_ENVIRONMENT_ID are required. Create them in the Dynamic dashboard (app.dynamic.xyz).',
    }
  }
  return { configured: true, environmentId }
}

async function getEvmClient() {
  const status = getDynamicStatus()
  if (!status.configured) throw new Error(status.reason)

  const { authToken, environmentId } = env()
  const { DynamicEvmWalletClient } = await import('@dynamic-labs-wallet/node-evm')

  const client = new DynamicEvmWalletClient({
    environmentId: environmentId!,
    enableMPCAccelerator: true,
  })
  await client.authenticateApiToken(authToken!)
  return client
}

export async function ensureAgentServerWallet(): Promise<
  | { ok: false; error: string }
  | { ok: true; address: `0x${string}`; walletId: string }
> {
  try {
    const status = getDynamicStatus()
    if (!status.configured) return { ok: false, error: status.reason }

    const client = await getEvmClient()

    // Keep this adapter tolerant of minor Dynamic SDK response-shape changes.
    const existing = await (client as any).getWalletAccounts?.().catch(() => null)
    if (Array.isArray(existing) && existing.length > 0) {
      const first = existing[0] as any
      const address = (first.accountAddress || first.address || first.walletMetadata?.address) as `0x${string}`
      const walletId = String(first.walletId || first.id || first.walletMetadata?.id || address || '')
      if (address?.startsWith('0x')) return { ok: true, address, walletId }
    }

    const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')
    const result = await (client as any).createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      backUpToDynamic: true,
      onError: (err: Error) => {
        console.error('[dynamic] createWalletAccount error', err)
      },
    })

    const created = result as any
    const metadata = created?.walletMetadata || {}
    const address = (created?.accountAddress || created?.address || metadata?.address || metadata?.walletAddress) as `0x${string}`
    const walletId = String(created?.walletId || created?.id || metadata?.walletId || metadata?.id || address || '')
    if (!address?.startsWith('0x')) {
      return {
        ok: false,
        error: 'Dynamic created the wallet but did not return a readable EVM address in the current SDK response.',
      }
    }
    return { ok: true, address, walletId }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create or load Dynamic server wallet.'
    return { ok: false, error: message }
  }
}

export async function signWithAgentWallet(
  message: string | Uint8Array,
): Promise<DynamicSignResult> {
  try {
    const wallet = await ensureAgentServerWallet()
    if (!wallet.ok) return { ok: false, error: wallet.error }

    const client = await getEvmClient()
    const signature = await (client as any).signMessage({
      accountAddress: wallet.address,
      message: typeof message === 'string' ? message : Buffer.from(message).toString('hex'),
    })

    const sig = (typeof signature === 'string' ? signature : signature?.signature) as `0x${string}`
    if (!sig?.startsWith('0x')) {
      return { ok: false, error: 'Dynamic signMessage did not return a valid signature.' }
    }
    return { ok: true, signature: sig, address: wallet.address }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Dynamic sign failed.'
    return { ok: false, error: message }
  }
}

export async function agentPaymentReady(): Promise<{
  ready: boolean
  pattern: 'server-wallet'
  details: string
  address?: `0x${string}`
}> {
  const status = getDynamicStatus()
  if (!status.configured) {
    return {
      ready: false,
      pattern: 'server-wallet',
      details: status.reason,
    }
  }
  const wallet = await ensureAgentServerWallet()
  if (!wallet.ok) {
    return {
      ready: false,
      pattern: 'server-wallet',
      details: wallet.error,
    }
  }
  return {
    ready: true,
    pattern: 'server-wallet',
    details: `Dynamic server wallet ready on Base. Address ${wallet.address}. Agent authenticates with API token; wallets belong to the developer account.`,
    address: wallet.address,
  }
}
