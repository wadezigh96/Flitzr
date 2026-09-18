/**
 * Dynamic Server Wallet adapter for Flitzr.
 *
 * Pattern: Server wallets (API token auth, wallets belong to developer account).
 * Used by the agent for Defencial-checked payment / signing actions on Base.
 *
 * Track: Runtime "Dynamic – Best Agentic Wallet or Payment Experience"
 * Docs: https://www.dynamic.xyz/docs/overview/agents/overview
 *       https://www.dynamic.xyz/docs/overview/agents/agent-payments
 *
 * Current Node SDK returns:
 *   { walletMetadata: { accountAddress, walletId }, publicKeyHex, ... }
 * Address is NOT always on the root object. This adapter reads both shapes.
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
  const backupPassword = process.env.DYNAMIC_WALLET_BACKUP_PASSWORD?.trim()
  const pinnedAddress = process.env.DYNAMIC_WALLET_ADDRESS?.trim() as `0x${string}` | undefined
  return { authToken, environmentId, backupPassword, pinnedAddress }
}

function isAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
}

function pickAddress(...candidates: unknown[]): `0x${string}` | undefined {
  for (const candidate of candidates) {
    if (isAddress(candidate)) return candidate
  }
  return undefined
}

function walkForAddress(value: unknown, depth = 0): `0x${string}` | undefined {
  if (depth > 5 || value == null) return undefined
  if (isAddress(value)) return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walkForAddress(item, depth + 1)
      if (found) return found
    }
    return undefined
  }
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>
    const direct = pickAddress(
      rec.accountAddress,
      rec.address,
      rec.walletAddress,
      (rec.walletMetadata as Record<string, unknown> | undefined)?.accountAddress,
      (rec.walletMetadata as Record<string, unknown> | undefined)?.address,
      (rec.wallet as Record<string, unknown> | undefined)?.accountAddress,
      (rec.wallet as Record<string, unknown> | undefined)?.address,
    )
    if (direct) return direct
    for (const nested of Object.values(rec)) {
      const found = walkForAddress(nested, depth + 1)
      if (found) return found
    }
  }
  return undefined
}

function pickWalletId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const rec = value as Record<string, unknown>
  const meta = rec.walletMetadata as Record<string, unknown> | undefined
  const raw = rec.walletId ?? rec.id ?? meta?.walletId ?? meta?.id
  return raw != null ? String(raw) : undefined
}

export function getDynamicStatus(): DynamicWalletStatus {
  const { authToken, environmentId, pinnedAddress } = env()
  if (!authToken || !environmentId) {
    return {
      configured: false,
      reason:
        'DYNAMIC_AUTH_TOKEN and DYNAMIC_ENVIRONMENT_ID are required. Create them in the Dynamic dashboard (app.dynamic.xyz).',
    }
  }
  return {
    configured: true,
    environmentId,
    ...(isAddress(pinnedAddress) ? { address: pinnedAddress } : {}),
  }
}

async function getEvmClient() {
  const status = getDynamicStatus()
  if (!status.configured) throw new Error(status.reason)

  const { authToken, environmentId } = env()
  const { DynamicEvmWalletClient } = await import('@dynamic-labs-wallet/node-evm')

  const client = new DynamicEvmWalletClient({
    environmentId: environmentId!,
    enableMPCAccelerator: false,
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

    const { pinnedAddress, backupPassword } = env()
    if (isAddress(pinnedAddress)) {
      return { ok: true, address: pinnedAddress, walletId: pinnedAddress }
    }

    const client = await getEvmClient()

    const listFns = ['getWalletAccounts', 'listWalletAccounts', 'listWallets', 'getWallets'] as const
    for (const fn of listFns) {
      const listed = await (client as any)[fn]?.().catch(() => null)
      const address = walkForAddress(listed)
      if (address) {
        const walletId = pickWalletId(listed) || address
        return { ok: true, address, walletId }
      }
    }

    const { ThresholdSignatureScheme } = await import('@dynamic-labs-wallet/node')
    const createOptions: Record<string, unknown> = {
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      onError: (err: Error) => {
        console.error('[dynamic] createWalletAccount error', err)
      },
    }
    if (backupPassword) {
      createOptions.password = backupPassword
      createOptions.backUpToDynamic = true
      createOptions.backUpToClientShareService = true
    }

    const result = await (client as any).createWalletAccount(createOptions)
    const address = walkForAddress(result)
    const walletId = pickWalletId(result) || address || ''

    if (!address) {
      const keys = result && typeof result === 'object' ? Object.keys(result as object).join(', ') : typeof result
      return {
        ok: false,
        error: `Dynamic created a wallet but no EVM address was found in the SDK payload (keys: ${keys}). Set DYNAMIC_WALLET_ADDRESS after copying walletMetadata.accountAddress from Dynamic.`,
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
  walletId?: string
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
    walletId: wallet.walletId,
  }
}
