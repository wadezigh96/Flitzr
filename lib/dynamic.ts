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
      /** Address of the server wallet used by the agent (when created). */
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

/**
 * Returns whether Dynamic Server Wallets are configured for this deployment.
 * Safe to call from any API route; never throws.
 */
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

/**
 * Lazy-load the Dynamic EVM Node client so the package is only required
 * when the env is set. This keeps local/dev builds working without the SDK.
 */
async function getEvmClient() {
  const status = getDynamicStatus()
  if (!status.configured) throw new Error(status.reason)

  const { authToken, environmentId } = env()
  // Dynamic package: @dynamic-labs-wallet/node-evm
  // https://www.dynamic.xyz/docs/wallets/server-wallets/overview
  const { DynamicEvmWalletClient } = await import('@dynamic-labs-wallet/node-evm')

  const client = new DynamicEvmWalletClient({
    environmentId: environmentId!,
    enableMPCAccelerator: true,
  })
  await client.authenticateApiToken(authToken!)
  return client
}

/**
 * Ensure a server wallet exists for the agent on Base (chain 8453).
 * Creates one if needed and returns its address.
 * Call this only after policy checks + (when required) user approval.
 */
export async function ensureAgentServerWallet(): Promise<
  | { ok: false; error: string }
  | { ok: true; address: `0x${string}`; walletId: string }
> {
  try {
    const status = getDynamicStatus()
    if (!status.configured) return { ok: false, error: status.reason }

    const client = await getEvmClient()

    // Prefer an existing wallet if the environment already has one.
    // Dynamic server wallets are scoped to the developer account + environment.
    const existing = await (client as any).getWalletAccounts?.().catch(() => null)
    if (Array.isArray(existing) && existing.length > 0) {
      const first = existing[0]
      const address = (first.accountAddress || first.address) as `0x${string}`
      const walletId = String(first.walletId || first.id || address)
      if (address?.startsWith('0x')) {
        return { ok: true, address, walletId }
      }
    }

    // Create a new TWO_OF_TWO server wallet (standard for agent automation).
    const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')
    const result = await client.createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      backUpToClientShareService: true,
      onError: (err: Error) => {
        console.error('[dynamic] createWalletAccount error', err)
      },
    })

    const address = (result.accountAddress || result.address) as `0x${string}`
    const walletId = String(result.walletId || result.id || address)
    if (!address?.startsWith('0x')) {
      return { ok: false, error: 'Dynamic returned an invalid wallet address.' }
    }
    return { ok: true, address, walletId }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create or load Dynamic server wallet.'
    return { ok: false, error: message }
  }
}

/**
 * Sign a message with the agent's Dynamic server wallet.
 * Used for x402 payment headers, SIWE-style agent auth, or policy-gated actions.
 */
export async function signWithAgentWallet(
  message: string | Uint8Array,
): Promise<DynamicSignResult> {
  try {
    const wallet = await ensureAgentServerWallet()
    if (!wallet.ok) return { ok: false, error: wallet.error }

    const client = await getEvmClient()
    // Sign via Dynamic MPC. Exact method name follows the Node EVM SDK.
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

/**
 * High-level helper used by Flitzr execution / x402 flows.
 * Returns a short summary suitable for audit logs and the Runtime demo.
 */
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
