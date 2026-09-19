'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import TokenizedStocks from '@/components/TokenizedStocks'
import AgentMarketplace from '@/components/AgentMarketplace'

type Execution = { id: string; state: string; provider?: string; amountUsd: number; quoteId?: string; providerOrderId?: string; txHash?: string }
type Result = { plan?: { intent: { type: string; amountUsd: number | null }; defencial: { allowed: boolean; needsApproval: boolean; reason: string }; policy?: { allowed: boolean; needsApproval: boolean; reason: string } }; execution?: Execution; quote?: { message?: string; quoteId?: string; raw?: any }; error?: string }
const states = ['planned', 'awaiting_approval', 'approved', 'quoted', 'signing', 'submitted', 'confirmed']

export default function Home() {
  const { ready, authenticated, login, logout, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [signingLoading, setSigningLoading] = useState(false)

  const walletObject = wallets.find(w => w.walletClientType === 'privy') || wallets[0]
  const wallet = authenticated ? (walletObject?.address?.toLowerCase() || wallets[0]?.address?.toLowerCase() || '') : ''
  const shortWallet = authenticated && wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect Wallet'

  useEffect(() => {
    if (!authenticated) setResult(null)
  }, [authenticated])

  async function authHeaders(extra: Record<string, string> = {}) {
    const token = await getAccessToken()
    if (!token) throw new Error('Privy authentication is not ready.')
    return { 'content-type': 'application/json', Authorization: `Bearer ${token}`, ...extra }
  }

  async function connectWallet() {
    setWalletError('')
    try {
      await login()
      const next = wallets.find(w => w.walletClientType === 'privy') || wallets[0]
      if (next?.switchChain) await next.switchChain(8453)
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : 'Privy wallet connection failed. Allow popups and add flitzr.vercel.app in the Privy dashboard allowed domains.')
    }
  }

  async function readJsonResponse(response: Response, fallback: string) {
    const contentType = response.headers.get('content-type') || ''
    const body = await response.text()
    if (!contentType.includes('application/json')) {
      throw new Error(response.ok ? fallback : 'Server returned ' + response.status + '. Please refresh and try again.')
    }
    try {
      return JSON.parse(body)
    } catch {
      throw new Error(fallback)
    }
  }

  async function runBankrAgent() {
    if (!prompt.trim() || loading || !authenticated || !wallet) return
    setLoading(true); setResult(null); setWalletError('')
    try {
      const response = await fetch('/api/agent/bankr', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ prompt, walletAddress: wallet }),
      })
      const data = await readJsonResponse(response, 'Bankr returned an invalid response.')
      if (!response.ok) {
        setResult({ error: data.message || data.error || 'Bankr agent request was blocked.' })
        return
      }
      setResult({
        plan: {
          intent: { type: 'market', amountUsd: null },
          defencial: data.defencial,
        },
        quote: { message: data.jobId ? `Bankr job ${data.jobId} is processing.` : 'Bankr accepted the agent command.' },
        error: undefined,
      })
      if (data.jobId) {
        const maxAttempts = 10
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const jobResponse = await fetch(`/api/agent/bankr/${encodeURIComponent(data.jobId)}`, { headers: await authHeaders() })
          const jobData = await readJsonResponse(jobResponse, 'Bankr job status was invalid.')
          if (!jobResponse.ok) throw new Error(jobData.error || 'Bankr job polling failed.')
          const status = String(jobData.status || jobData.state || '').toLowerCase()
          if (['completed', 'success', 'succeeded', 'failed', 'error', 'cancelled'].includes(status)) {
            setResult(prev => ({ ...prev, quote: { message: status === 'completed' || status === 'success' || status === 'succeeded' ? 'Bankr completed the agent job.' : `Bankr job ended with status: ${status}.` }, error: status === 'failed' || status === 'error' || status === 'cancelled' ? `Bankr job ended with status: ${status}.` : undefined }))
            break
          }
        }
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Bankr agent request failed.' })
    } finally { setLoading(false) }
  }

  async function logoutWallet() {
    try {
      await logout()
      setResult(null)
      setWalletError('Wallet disconnected from Flitzr.')
    } catch (error) { setWalletError(error instanceof Error ? error.message : 'Could not disconnect the wallet from Flitzr.') }
  }

  async function runAgent() {
    if (!prompt.trim() || loading) return
    if (!authenticated || !wallet) return setWalletError('Connect your wallet with Privy first.')
    setLoading(true); setResult(null); setWalletError('')
    try {
      const planResponse = await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const planData = await readJsonResponse(planResponse, 'Planner returned an invalid response.')
      const executionResponse = await fetch('/api/execution', { method: 'POST', headers: await authHeaders({ 'Idempotency-Key': crypto.randomUUID() }), body: JSON.stringify({ prompt, walletAddress: wallet }) })
      const executionData = await readJsonResponse(executionResponse, 'Execution API returned an invalid response.')
      setResult({ ...planData, execution: executionData.execution, error: planData.error || executionData.error })
    } catch (error) { setResult({ error: error instanceof Error ? error.message : 'Could not reach the Flitzr planner.' }) }
    finally { setLoading(false) }
  }

  async function approve() {
    if (!result?.execution?.id || !wallet || !authenticated || approvalLoading) return
    setApprovalLoading(true)
    try {
      const response = await fetch('/api/execution/approve', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ executionId: result.execution.id, approval: true, walletAddress: wallet }) })
      const data = await readJsonResponse(response, 'Flitzr API returned an invalid response.')
      if (!response.ok) return setResult(prev => ({ ...prev, error: data.error || 'Approval failed' }))
      setResult(prev => ({ ...prev, execution: data.execution, error: undefined }))
    } catch (error) { setResult(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Approval failed' })) }
    finally { setApprovalLoading(false) }
  }

  async function prepareQuote() {
    if (!result?.execution?.id || !wallet || !authenticated || quoteLoading) return
    setQuoteLoading(true)
    try {
      const response = await fetch('/api/execution/quote', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ executionId: result.execution.id, walletAddress: wallet }) })
      const data = await readJsonResponse(response, 'Flitzr API returned an invalid response.')
      if (!response.ok) return setResult(prev => ({ ...prev, error: data.error || 'Quote failed' }))
      setResult(prev => ({ ...prev, execution: data.execution, quote: data.quote, error: undefined }))
    } catch (error) { setResult(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Quote failed' })) }
    finally { setQuoteLoading(false) }
  }

  async function signAndSubmit() {
    if (!result?.execution?.id || !wallet || !authenticated || signingLoading) return
    setSigningLoading(true); setResult(prev => ({ ...prev, error: undefined }))
    try {
      const signer = wallets.find(w => w.address?.toLowerCase() === wallet) || wallets.find(w => w.walletClientType === 'privy') || wallets[0]
      if (!signer) throw new Error('Privy wallet is not available. Connect again and approve the Privy popup.')
      await signer.switchChain(8453)
      const payloadResponse = await fetch('/api/execution/signing-payload', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ executionId: result.execution.id, walletAddress: wallet }) })
      const payloadData = await readJsonResponse(payloadResponse, 'Signing API returned an invalid response.')
      if (!payloadResponse.ok) throw new Error(payloadData.error || 'Could not prepare signing payload')
      const provider = await signer.getEthereumProvider()
      const signature = await provider.request({ method: 'eth_signTypedData_v4', params: [wallet, JSON.stringify(payloadData.typedData)] }) as string
      const submitResponse = await fetch('/api/execution/submit', { method: 'POST', headers: await authHeaders({ 'Idempotency-Key': `submit_${result.execution.id}` }), body: JSON.stringify({ executionId: result.execution.id, walletAddress: wallet, userSignature: signature }) })
      const submitData = await readJsonResponse(submitResponse, 'Submission API returned an invalid response.')
      if (!submitResponse.ok) throw new Error(submitData.error || 'Order submission failed')
      setResult(prev => ({ ...prev, execution: submitData.execution, error: undefined }))
    } catch (error) { setResult(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Signing or submission failed.' })) }
    finally { setSigningLoading(false) }
  }

  const stateIndex = result?.execution ? states.indexOf(result.execution.state) : -1
  const canQuote = result?.execution && ['planned', 'approved'].includes(result.execution.state)
  const defencial = result?.plan?.defencial ?? result?.plan?.policy

  return (
    <main className="shell">
      <AgentMarketplace />
      <nav className="nav"><div className="brandWrap"><div className="brandMark">F</div><div><div className="brand">FLITZR</div><div className="brandSub">DEFENSIVE AGENTIC FINANCE</div></div></div><div className="navRight"><div className="live"><span /> BASE MAINNET · LIVE</div><button className="walletButton" onClick={authenticated ? logoutWallet : connectWallet} disabled={!ready}>{authenticated ? `${shortWallet} · Disconnect` : shortWallet}</button></div></nav>
      <section className="hero"><div><div className="eyebrow"><span className="eyebrowDot" /> DEFENSIVE-FIRST ONCHAIN AGENT</div><h1>Tell Flitzr.<br /><span>Defensive checks it.</span><br />You stay in control.</h1><p>Natural language in. A controlled execution plan out. Flitzr separates intent, Defensive, approval, routing, wallet signing, and settlement.</p><div className="heroSignals"><span>AI AGENT</span><b>→</b><span>DEFENSIVE</span><b>→</b><span>WALLET</span><b>→</b><span>BASE</span></div></div><div className="heroPanel"><div className="panelLabel">FLITZR CONTROL PLANE</div><div className="systemRow"><span className="pulse" /><strong>{authenticated ? 'Wallet authenticated' : 'Agent operational'}</strong></div><div className="systemMeta">Preview-first · Defensive-gated · Base Mainnet</div></div></section>
      <section className="metrics"><div className="metric"><span>AGENT</span><strong>READY</strong><small>Defensive engine online</small></div><div className="metric"><span>NETWORK</span><strong>BASE</strong><small>Chain ID 8453</small></div><div className="metric"><span>SINGLE LIMIT</span><strong>$25</strong><small>Approval above limit</small></div><div className="metric"><span>DAILY BUDGET</span><strong>$100</strong><small>Defensive-controlled</small></div></section>
      <section className="dashboardGrid"><div className="card askCard"><div className="sectionHead"><div><div className="sectionKicker">01 · COMMAND CENTER</div><h2>What should Flitzr do?</h2></div><span className="modeTag">PREVIEW MODE</span></div><p className="muted">Describe what you want your agent to do. Defensive is checked before a provider quote is prepared.</p><div className="agent"><input value={prompt} onChange={e => { setPrompt(e.target.value); setResult(null) }} onKeyDown={e => e.key === 'Enter' && runAgent()} placeholder="DCA $20 of ETH every week" /><button className="primaryAction" onClick={runAgent} disabled={loading}>{loading ? 'Analyzing…' : 'Run Defensive check →'}</button></div><div className="examples"><button onClick={() => setPrompt('DCA $20 of ETH every week')}>DCA $20 ETH weekly</button><button onClick={() => setPrompt('Limit buy $20 of ETH')}>Limit buy $20 ETH</button><button onClick={() => setPrompt('Swap $10 to ETH')}>Swap $10 to ETH</button><button onClick={runBankrAgent}>Send to Bankr ↗</button></div>{walletError && <p className="error">{walletError}</p>}{result?.error && <p className="error">{result.error}</p>}{result?.plan && defencial && <div className="result"><div className="resultTop"><div><span className="resultLabel">PROPOSED ACTION</span><strong>{result.plan.intent.type.toUpperCase()}</strong></div><span className={defencial.allowed ? 'okBadge' : 'blockedBadge'}>{defencial.needsApproval ? 'APPROVAL REQUIRED' : defencial.allowed ? 'DEFENSIVE OK' : 'BLOCKED'}</span></div><p>{defencial.reason.replaceAll('policy', 'Defensive').replaceAll('Policy', 'Defensive')}</p><div className="chips"><span>Base</span><span>{result.plan.intent.amountUsd === null ? 'Amount needed' : `$${result.plan.intent.amountUsd}`}</span><span>{defencial.allowed ? 'Within Defensive' : 'Defensive blocked'}</span><span>Quote preview</span></div>{result.quote?.message && <small>{result.quote.message}</small>}{result.quote?.quoteId && <small>Quote ready: {result.quote.quoteId}</small>}{result.execution?.state === 'awaiting_approval' && <button className="approveButton" onClick={approve} disabled={approvalLoading}>{approvalLoading ? 'Approving…' : 'Approve execution'}</button>}{canQuote && <button className="approveButton" onClick={prepareQuote} disabled={quoteLoading}>{quoteLoading ? 'Getting quote…' : 'Prepare provider quote'}</button>}{result.execution?.state === 'quoted' && <><small>Provider quote prepared. No transaction has been broadcast.</small>{result.execution.provider === 'definitive' && <button className="approveButton" onClick={signAndSubmit} disabled={signingLoading}>{signingLoading ? 'Sign & submit…' : 'Review & sign order'}</button>}</>}{result.execution?.state === 'submitted' && <small>Order submitted to the provider. Confirmation is not assumed until the provider/chain reports it.</small>}{result.execution?.providerOrderId && <small>Provider order: {result.execution.providerOrderId}</small>}{result.execution?.txHash && <small>Transaction: {result.execution.txHash}</small>}</div>}</div><aside className="card policyCard"><div className="sectionHead"><div><div className="sectionKicker">02 · SECURITY LAYER</div><h2>Defensive guardrails</h2></div><span className="shield">✓</span></div><div className="policy"><div><span>Network</span><strong>Base Mainnet</strong></div><div><span>Single trade</span><strong>$25 max</strong></div><div><span>Daily budget</span><strong>$100 max</strong></div><div><span>Approval gate</span><strong>&gt; $25</strong></div></div><div className="policyNote"><span className="dotGreen" /> Deterministic rules · independent of AI</div><div className="guardrailFlow"><span>INTENT</span><b>→</b><span>CHECK</span><b>→</b><span>APPROVE</span><b>→</b><span>SIGN</span></div></aside></section>
      <section className="card providersCard"><div className="sectionHead"><div><div className="sectionKicker">03 · EXECUTION STACK</div><h2>Connected infrastructure</h2></div><span className="liveSmall"><span className="miniPulse" /> 3 CONNECTED</span></div><div className="providers"><div className="provider"><div className="providerIcon bankr">B</div><div><strong>Bankr</strong><span>Agent & wallet operations</span></div><i>READY</i></div><div className="provider"><div className="providerIcon def">D</div><div><strong>Definitive Flash</strong><span>DCA & advanced order planning</span></div><i>ADAPTER</i></div><div className="provider"><div className="providerIcon uni">U</div><div><strong>Uniswap</strong><span>Spot routing on Base</span></div><i>ROUTER</i></div></div></section>
      <TokenizedStocks wallet={wallet} />
      {result?.execution && <section className="card timelineCard"><div className="sectionHead"><div><div className="sectionKicker">04 · OPERATIONS</div><h2>Execution timeline</h2></div><span className="stateBadge">{result.execution.state.replace('_', ' ')}</span></div><div className="timeline">{states.map((state, index) => <div className={`step ${index <= stateIndex ? 'active' : ''}`} key={state}><span className="dot" /><div><strong>{state.replace('_', ' ')}</strong><small>{state === 'awaiting_approval' ? 'Defensive approval gate' : state === 'quoted' ? 'Provider quote prepared' : state === 'signing' ? 'Wallet signing in progress' : state === 'submitted' ? 'Provider accepted the order' : state === 'confirmed' ? 'Chain confirmation' : 'Execution state'}</small></div></div>)}</div><p className="previewNote">Signing is an explicit wallet action. Flitzr never receives or stores private keys.</p></section>}
      <footer><span>FLITZR · DEFENSIVE · PRIVY · BASE</span><span>Autonomous finance, with explicit user control.</span></footer>
    </main>
  )
}
