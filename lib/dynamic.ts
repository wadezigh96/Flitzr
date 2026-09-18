/**
 * Dynamic Server Wallet adapter for Flitzr.
 * Pattern: Server wallets. Status checks must NEVER create a new wallet.
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

/** Stable reviewer address. Override with DYNAMIC_WALLET_ADDRESS. */
export const PINNED_AGENT_WALLET = (
  process.env.DYNAMIC_WALLET_ADDRESS?.trim() || '0xC9d6d9a9D059c6E3F41744FeD834bE818DB389e8'
) as `0x${string}`

function env() {
  const authToken = process.env.DYNAMIC_AUTH_TOKEN?.trim()
  const environmentId = process.env.DYNAMIC_ENVIRONMENT_ID?.trim()
  const backupPassword = process.env.DYNAMIC_WALLET_BACKUP_PASSWORD?.trim()
  const pinnedAddress = PINNED_AGENT_WALLET
  return { authToken, environmentId, backupPassword, pinnedAddress }
}

function isAddress(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
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

export async function peekAgentServerWallet(): Promise<
  | { ok: false; error: string }
  | { ok: true; address: `0x${string}`; walletId: string; source: 'pin' }
> {
  const status = getDynamicStatus()
  if (!status.configured) return { ok: false, error: status.reason }
  const { pinnedAddress } = env()
  if (!isAddress(pinnedAddress)) {
    return {
      ok: false,
      error: 'Set DYNAMIC_WALLET_ADDRESS to pin a single Dynamic server wallet. Status will not create wallets.',
    }
  }
  return { ok: true, address: pinnedAddress, walletId: pinnedAddress, source: 'pin' }
}

export async function agentPaymentReady(): Promise<{
  ready: boolean
  pattern: 'server-wallet'
  details: string
  address?: `0x${string}`
  walletId?: string
}> {
  const peeked = await peekAgentServerWallet()
  if (!peeked.ok) {
    return { ready: false, pattern: 'server-wallet', details: peeked.error }
  }
  return {
    ready: true,
    pattern: 'server-wallet',
    details: `Dynamic server wallet pinned on Base. Address ${peeked.address}. GET /api/dynamic/status does not create wallets.`,
    address: peeked.address,
    walletId: peeked.walletId,
  }
}
