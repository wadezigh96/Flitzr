import { NextResponse } from 'next/server'
import { recoverTypedDataAddress } from 'viem'
import { definitiveOrder } from '@/lib/definitive'
import { executionStore } from '@/lib/ledger'
import { auditEvent } from '@/lib/audit'
import { normalizeWallet, transition } from '@/lib/execution'
import { readSession } from '@/lib/auth'

function sessionFromRequest(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const token = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('flitzr_session='))?.slice('flitzr_session='.length)
  return readSession(token)
}

function extractString(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object') return undefined
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key]
    if (typeof candidate === 'string' && candidate.length > 0) return candidate
  }
  return undefined
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const executionId = typeof body.executionId === 'string' ? body.executionId : ''
    const walletAddress = normalizeWallet(body.walletAddress)
    const userSignature = typeof body.userSignature === 'string' ? body.userSignature : ''
    const idempotencyKey = request.headers.get('Idempotency-Key') || ''

    if (!executionId || !walletAddress || !userSignature) return NextResponse.json({ error: 'executionId, walletAddress and userSignature are required.' }, { status: 400 })
    if (userSignature.length < 132) return NextResponse.json({ error: 'The wallet signature is invalid or incomplete.' }, { status: 400 })
    if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 128)) return NextResponse.json({ error: 'Idempotency-Key must be 8-128 characters.' }, { status: 400 })

    const session = sessionFromRequest(request)
    if (!session || session.address.toLowerCase() !== walletAddress) return NextResponse.json({ error: 'Authenticate the connected wallet first.' }, { status: 401 })

    const execution = await executionStore.get(executionId)
    if (!execution) return NextResponse.json({ error: 'Execution not found.' }, { status: 404 })
    if (execution.ownerWallet !== walletAddress) return NextResponse.json({ error: 'This execution belongs to a different wallet.' }, { status: 403 })

    if (idempotencyKey) {
      const claim = await executionStore.claimIdempotency(idempotencyKey, walletAddress, executionId)
      if (!claim.sameExecution) {
        return NextResponse.json({ error: 'This Idempotency-Key is already associated with another execution.' }, { status: 409 })
      }
      if (!claim.claimed && claim.existingExecution && (claim.existingExecution.state === 'submitted' || claim.existingExecution.state === 'confirmed')) {
        return NextResponse.json({ execution: claim.existingExecution, alreadySubmitted: true, idempotentReplay: true })
      }
    }

    if (execution.state === 'submitted' || execution.state === 'confirmed') return NextResponse.json({ execution, alreadySubmitted: true, idempotentReplay: Boolean(idempotencyKey) })
    if (execution.state === 'signing') return NextResponse.json({ execution, submissionInProgress: true }, { status: 202 })
    if (execution.state !== 'quoted') return NextResponse.json({ error: `Execution cannot be submitted from state ${execution.state}.` }, { status: 409 })

    const quoteId = execution.quoteId
    const typedData = execution.quoteTypedData
    if (execution.provider !== 'definitive' || !quoteId || !typedData) {
      return NextResponse.json({ error: 'A valid Definitive quote and signing payload are required.' }, { status: 409 })
    }

    let recovered: string
    try {
      recovered = await recoverTypedDataAddress({
        domain: typedData.domain as any,
        types: typedData.types as any,
        primaryType: typedData.primaryType as any,
        message: typedData.message as any,
        signature: userSignature as `0x${string}`,
      })
    } catch {
      return NextResponse.json({ error: 'Could not verify the EIP-712 signature against the quoted order.' }, { status: 400 })
    }
    if (recovered.toLowerCase() !== walletAddress) return NextResponse.json({ error: 'The signature does not belong to the connected wallet.' }, { status: 400 })

    const signing = transition(execution, 'signing')
    await executionStore.update(signing)
    await executionStore.addAudit(auditEvent(signing.id, 'signing', { provider: signing.provider ?? 'definitive', quoteId, idempotencyKey: idempotencyKey || null }))

    try {
      const raw = await definitiveOrder({ quoteId, evmOrderTypedData: typedData, userSignature })
      const providerOrderId = extractString(raw, ['orderId', 'id', 'orderID'])
      const txHash = extractString(raw, ['txHash', 'transactionHash', 'transaction_hash'])
      const submitted = transition(signing, 'submitted')
      const next = {
        ...submitted,
        ...(providerOrderId ? { providerOrderId } : {}),
        ...(txHash ? { txHash } : {}),
      }
      await executionStore.update(next)
      await executionStore.addAudit(auditEvent(next.id, 'submitted', {
        provider: next.provider ?? 'definitive',
        quoteId,
        providerOrderId: providerOrderId ?? null,
        txHash: txHash ?? null,
        idempotencyKey: idempotencyKey || null,
      }))
      return NextResponse.json({ execution: next, provider: raw, previewOnly: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Provider submission failed.'
      const failed = transition(signing, 'failed')
      const next = { ...failed, error: errorMessage }
      await executionStore.update(next)
      await executionStore.addAudit(auditEvent(next.id, 'failed', { error: errorMessage }))
      return NextResponse.json({ error: errorMessage, execution: next }, { status: 502 })
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Order submission failed.' }, { status: 400 })
  }
}
