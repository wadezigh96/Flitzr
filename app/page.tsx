'use client'

import { useEffect, useState } from 'react'
import TokenizedStocks from '@/components/TokenizedStocks'

type Execution = { id: string; state: string; provider?: string; amountUsd: number; quoteId?: string; providerOrderId?: string; txHash?: string }
type Result = {
  plan?: { intent: { type: string; amountUsd: number | null }; policy: { allowed: boolean; needsApproval: boolean; reason: string } }
  execution?: Execution
  quote?: { message?: string; quoteId?: string; raw?: any }
  error?: string
}

const states = ['planned', 'awaiting_approval', 'approved', 'quoted', 'signing', 'submitted', 'confirmed']

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState('')
  const [walletError, setWalletError] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [signingLoading, setSigningLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const ethereum = (window as any).ethereum
    if (!ethereum?.on) return
    const handleAccountsChanged = (accounts: string[]) => {
      const address = accounts?.[0]?.toLowerCase() || ''
      setWallet(address)
      setAuthenticated(false)
      setResult(null)
      setWalletError(address ? 'Wallet account changed. Sign in again.' : 'Wallet disconnected.')
    }
    const handleChainChanged = (chainId: string) => {
      setAuthenticated(false)
      setResult(null)
      setWalletError(chainId === '0x2105' ? 'Network changed. Sign in again.' : 'Flitzr requires Base Mainnet.')
    }
    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)
    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      ethereum.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [])

  async function connectWallet() {
    setWalletError('')
    const ethereum = (window as any).ethereum
    if (!ethereum) return setWalletError('Install a browser wallet to connect.')
    try {
      await ethereum.request({ method: 'eth_requestAccounts' })
      const chainId = await ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0x2105') await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] })
      const accounts = await ethereum.request({ method: 'eth_accounts' })
      const address = accounts?.[0]?.toLowerCase() || ''
      if (!address) throw new Error('No wallet account returned')
      setWallet(address)
      const nonceResponse = await fetch('/api/auth/nonce', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ walletAddress: address }) })
      const nonceData = await nonceResponse.json()
      if (!nonceResponse.ok) throw new Error(nonceData.error || 'Could not start wallet authentication')
      const signature = await ethereum.request({ method: 'personal_sign', params: [nonceData.message, address] })
      const verifyResponse = await fetch('/api/auth/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address, message: nonceData.message, signature, nonce: nonceData.nonce }) })
      const verifyData = await verifyResponse.json()
      if (!verifyResponse.ok) throw new Error(verifyData.error || 'Signature verification failed')
      setAuthenticated(true)
    } catch (error) {
      setAuthenticated(false)
      setWalletError(error instanceof Error ? error.message : 'Wallet authentication failed.')
    }
  }

  async function logoutWallet() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    setAuthenticated(false)
    setResult(null)
    setWallet('')
    setWalletError('Wallet session ended.')
  }

  async function runAgent() {
    if (!prompt.trim() || loading) return
    if (!wallet || !authenticated) return setWalletError('Connect and sign in with your Base wallet first.')
    setLoading(true)
    setResult(null)
    try {
      const planResponse = await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const planData = await planResponse.json()
      const executionResponse = await fetch('/api/execution', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ prompt, walletAddress: wallet }),
      })
      const executionData = await executionResponse.json()
      setResult({ ...planData, execution: executionData.execution, error: planData.error || executionData.error })
    } catch {
      setResult({ error: 'Could not reach the Flitzr planner.' })
    } finally {
      setLoading(false)
    }
  }

  async function approve() {
    if (!result?.execution?.id || !wallet || !authenticated || approvalLoading) return
    setApprovalLoading(true)
    try {
      const response = await fetch('/api/execution/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ executionId: result.execution.id, approval: true, walletAddress: wallet }) })
      const data = await response.json()
      if (!response.ok) return setResult(prev => ({ ...prev, error: data.error || 'Approval failed' }))
      setResult(prev => ({ ...prev, execution: data.execution, error: undefined }))
    } finally {
      setApprovalLoading(false)
    }
  }

  async function prepareQuote() {
    if (!result?.execution?.id || !wallet || !authenticated || quoteLoading) return
    setQuoteLoading(true)
    try {
      const response = await fetch('/api/execution/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ executionId: result.execution.id, walletAddress: wallet }) })
      const data = await response.json()
      if (!response.ok) return setResult(prev => ({ ...prev, error: data.error || 'Quote failed' }))
      setResult(prev => ({ ...prev, execution: data.execution, quote: data.quote, error: undefined }))
    } finally {
      setQuoteLoading(false)
    }
  }

  async function signAndSubmit() {
    if (!result?.execution?.id || !wallet || !authenticated || signingLoading) return
    setSigningLoading(true)
    setResult(prev => ({ ...prev, error: undefined }))
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('Wallet provider is not available.')
      const payloadResponse = await fetch('/api/execution/signing-payload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ executionId: result.execution.id, walletAddress: wallet }) })
      const payloadData = await payloadResponse.json()
      if (!payloadResponse.ok) throw new Error(payloadData.error || 'Could not prepare signing payload')

      const signature = await ethereum.request({ method: 'eth_signTypedData_v4', params: [wallet, JSON.stringify(payloadData.typedData)] })
      const submitResponse = await fetch('/api/execution/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': `submit_${result.execution.id}` },
        body: JSON.stringify({ executionId: result.execution.id, walletAddress: wallet, userSignature: signature }),
      })
      const submitData = await submitResponse.json()
      if (!submitResponse.ok) throw new Error(submitData.error || 'Order submission failed')
      setResult(prev => ({ ...prev, execution: submitData.execution, error: undefined }))
    } catch (error) {
      setResult(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Signing or submission failed.' }))
    } finally {
      setSigningLoading(false)
    }
  }

  const shortWallet = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect Wallet'
  const stateIndex = result?.execution ? states.indexOf(result.execution.state) : -1
  const canQuote = result?.execution && ['planned', 'approved'].includes(result.execution.state)

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brandWrap"><div className="brandMark">F</div><div><div className="brand">FLITZR</div><div className="brandSub">DEFENCIAL AGENTIC FINANCE</div></div></div>
        <div className="navRight"><div className="live"><span /> BASE MAINNET · LIVE</div><button className="walletButton" onClick={authenticated ? logoutWallet : connectWallet}>{authenticated ? `${shortWallet} · Sign out` : wallet ? 'Sign in wallet' : shortWallet}</button></div>
      </nav>

      <section className="hero">
        <div><div className="eyebrow">Defencial-first onchain agent</div><h1>Your money.<br /><span>Your Defencial.</span><br />Your agent.</h1><p>Turn a financial goal into a controlled execution plan. Flitzr separates intent, Defencial, approval, routing, and settlement.</p></div>
        <div className="heroPanel"><div className="panelLabel">SYSTEM STATUS</div><div className="systemRow"><span className="pulse" /><strong>{authenticated ? 'Wallet authenticated' : 'Agent operational'}</strong></div><div className="systemMeta">Preview-first execution · Base · SIWE protected</div></div>
      </section>

      <section className="metrics">
        <div className="metric"><span>AGENT</span><strong>READY</strong><small>Defencial engine online</small></div>
        <div className="metric"><span>NETWORK</span><strong>BASE</strong><small>Chain ID 8453</small></div>
        <div className="metric"><span>SINGLE LIMIT</span><strong>$25</strong><small>Approval above limit</small></div>
        <div className="metric"><span>DAILY BUDGET</span><strong>$100</strong><small>Defencial-controlled</small></div>
      </section>

      <section className="dashboardGrid">
        <div className="card askCard">
          <div className="sectionHead"><div><div className="sectionKicker">01 · COMMAND</div><h2>Ask Flitzr</h2></div><span className="modeTag">PREVIEW MODE</span></div>
          <p className="muted">Describe what you want your agent to do. Defencial is checked before a provider quote is prepared.</p>
          <div className="agent"><input value={prompt} onChange={e => { setPrompt(e.target.value); setResult(null) }} onKeyDown={e => e.key === 'Enter' && runAgent()} placeholder="DCA $20 of ETH every week" /><button onClick={runAgent} disabled={loading}>{loading ? 'Planning…' : 'Plan execution →'}</button></div>
          <div className="examples"><button onClick={() => setPrompt('DCA $20 of ETH every week')}>DCA $20 ETH weekly</button><button onClick={() => setPrompt('Limit buy $20 of ETH')}>Limit buy $20 ETH</button><button onClick={() => setPrompt('Swap $10 to ETH')}>Swap $10 to ETH</button></div>
          {walletError && <p className="error">{walletError}</p>}
          {result?.error && <p className="error">{result.error}</p>}
          {result?.plan && (
            <div className="result">
              <div className="resultTop"><div><span className="resultLabel">PROPOSED ACTION</span><strong>{result.plan.intent.type.toUpperCase()}</strong></div><span className={result.plan.policy.allowed ? 'okBadge' : 'blockedBadge'}>{result.plan.policy.needsApproval ? 'APPROVAL REQUIRED' : result.plan.policy.allowed ? 'DEFENCIAL OK' : 'BLOCKED'}</span></div>
              <p>{result.plan.policy.reason.replaceAll('policy', 'Defencial').replaceAll('Policy', 'Defencial')}</p>
              <div className="chips"><span>Base</span><span>{result.plan.intent.amountUsd === null ? 'Amount needed' : `$${result.plan.intent.amountUsd}`}</span><span>{result.plan.policy.allowed ? 'Within Defencial' : 'Defencial blocked'}</span><span>Quote preview</span></div>
              {result.quote?.message && <small>{result.quote.message}</small>}
              {result.quote?.quoteId && <small>Quote ready: {result.quote.quoteId}</small>}
              {result.execution?.state === 'awaiting_approval' && <button className="approveButton" onClick={approve} disabled={approvalLoading}>{approvalLoading ? 'Approving…' : 'Approve execution'}</button>}
              {canQuote && <button className="approveButton" onClick={prepareQuote} disabled={quoteLoading}>{quoteLoading ? 'Getting quote…' : 'Prepare provider quote'}</button>}
              {result.execution?.state === 'quoted' && <>
                <small>Provider quote prepared. No transaction has been broadcast.</small>
                {result.execution.provider === 'definitive' && <button className="approveButton" onClick={signAndSubmit} disabled={signingLoading}>{signingLoading ? 'Sign & submit…' : 'Review & sign order'}</button>}
              </>}
              {result.execution?.state === 'submitted' && <small>Order submitted to the provider. Confirmation is not assumed until the provider/chain reports it.</small>}
              {result.execution?.providerOrderId && <small>Provider order: {result.execution.providerOrderId}</small>}
              {result.execution?.txHash && <small>Transaction: {result.execution.txHash}</small>}
            </div>
          )}
        </div>

        <aside className="card policyCard">
          <div className="sectionHead"><div><div className="sectionKicker">02 · GUARDRAILS</div><h2>Defencial guardrails</h2></div><span className="shield">✓</span></div>
          <div className="policy"><div><span>Network</span><strong>Base Mainnet</strong></div><div><span>Single trade</span><strong>$25 max</strong></div><div><span>Daily budget</span><strong>$100 max</strong></div><div><span>Approval gate</span><strong>&gt; $25</strong></div></div>
          <div className="policyNote"><span className="dotGreen" /> Deterministic Defencial · independent of AI</div>
        </aside>
      </section>

      <section className="card providersCard">
        <div className="sectionHead"><div><div className="sectionKicker">03 · EXECUTION STACK</div><h2>Agents & providers</h2></div><span className="liveSmall">3 CONNECTED</span></div>
        <div className="providers"><div className="provider"><div className="providerIcon bankr">B</div><div><strong>Bankr</strong><span>Agent & wallet operations</span></div><i>READY</i></div><div className="provider"><div className="providerIcon def">D</div><div><strong>Definitive Flash</strong><span>DCA & advanced order planning</span></div><i>ADAPTER</i></div><div className="provider"><div className="providerIcon uni">U</div><div><strong>Uniswap</strong><span>Spot routing on Base</span></div><i>ROUTER</i></div></div>
      </section>

      <TokenizedStocks wallet={wallet} />

      {result?.execution && (
        <section className="card timelineCard">
          <div className="sectionHead"><div><div className="sectionKicker">04 · OPERATIONS</div><h2>Execution timeline</h2></div><span className="stateBadge">{result.execution.state.replace('_', ' ')}</span></div>
          <div className="timeline">{states.map((state, index) => <div className={`step ${index <= stateIndex ? 'active' : ''}`} key={state}><span className="dot" /><div><strong>{state.replace('_', ' ')}</strong><small>{state === 'awaiting_approval' ? 'Defencial approval gate' : state === 'quoted' ? 'Provider quote prepared' : state === 'signing' ? 'Wallet signing in progress' : state === 'submitted' ? 'Provider accepted the order' : state === 'confirmed' ? 'Chain confirmation' : 'Execution state'}</small></div></div>)}</div>
          <p className="previewNote">Signing is an explicit wallet action. Flitzr never receives or stores private keys.</p>
        </section>
      )}

      <footer><span>FLITZR · DEFENCIAL · SIGNATURE-GATED · BASE</span><span>Autonomous finance, with explicit user control.</span></footer>
    </main>
  )
}
