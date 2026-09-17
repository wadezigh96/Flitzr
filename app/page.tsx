'use client'

import { useState } from 'react'

type Result = { plan?: { intent: { type: string; amountUsd: number | null }; policy: { allowed: boolean; needsApproval: boolean; reason: string }; execution: string; nextStep: string }; quote?: { configured?: boolean; demo?: boolean; message?: string; quoteId?: string }; error?: string }

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [wallet, setWallet] = useState('')
  const [walletError, setWalletError] = useState('')

  async function connectWallet() {
    setWalletError('')
    const ethereum = (window as any).ethereum
    if (!ethereum) return setWalletError('Install a browser wallet to connect.')
    try {
      await ethereum.request({ method: 'eth_requestAccounts' })
      const chainId = await ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0x2105') await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] })
      const accounts = await ethereum.request({ method: 'eth_accounts' })
      setWallet(accounts?.[0] || '')
    } catch { setWalletError('Wallet connection failed. Please switch to Base Mainnet.') }
  }

  async function runAgent() {
    if (!prompt.trim() || loading) return
    setLoading(true); setResult(null)
    try {
      const response = await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await response.json()
      setResult(data)
    } catch { setResult({ error: 'Could not reach the Flitzr planner.' }) }
    finally { setLoading(false) }
  }

  const shortWallet = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : 'Connect Wallet'

  return (
    <main className="shell">
      <nav className="nav"><div className="brand">FLITZR</div><div className="navRight"><div className="status">BASE · AGENT READY</div><button className="walletButton" onClick={connectWallet}>{shortWallet}</button></div></nav>
      <section className="hero"><div className="eyebrow">Autonomous onchain financial agent</div><h1>Money moves by policy, not by guesswork.</h1><p>Flitzr turns a natural-language goal into a controlled execution plan. Every request is checked against your policy before a trading adapter is allowed to proceed.</p></section>
      <section className="grid">
        <div className="card"><h2>Ask Flitzr</h2><div className="agent"><input value={prompt} onChange={e => { setPrompt(e.target.value); setResult(null) }} onKeyDown={e => e.key === 'Enter' && runAgent()} placeholder="e.g. DCA $20 of ETH every week" /><button onClick={runAgent} disabled={loading}>{loading ? 'Planning…' : 'Plan'}</button></div>
          {walletError && <p className="error">{walletError}</p>}
          {result?.error && <p className="error">{result.error}</p>}
          {result?.plan && <div className="result"><div className="resultTop"><strong>{result.plan.intent.type.toUpperCase()} PLAN</strong><span>{result.plan.policy.needsApproval ? 'APPROVAL REQUIRED' : result.plan.execution}</span></div><p>{result.plan.policy.reason}</p><div className="chips"><span>Base</span><span>{result.plan.intent.amountUsd === null ? 'Amount needed' : `$${result.plan.intent.amountUsd}`}</span><span>{result.plan.policy.allowed ? 'Policy OK' : 'Blocked'}</span><span>Preview only</span></div>{result.quote?.message && <small>{result.quote.message}</small>}{result.quote?.quoteId && <small>Quote ready: {result.quote.quoteId}</small>}</div>}
        </div>
        <div className="card"><h2>Agent policy</h2><div className="policy"><div><div className="label">Network</div><div className="value">Base</div></div><div><div className="label">Single trade</div><div className="value">$25 max</div></div><div><div className="label">Daily budget</div><div className="value">$100 max</div></div><div><div className="label">Approval</div><div className="value">Required &gt; $25</div></div></div></div>
      </section>
      <section className="card" style={{ marginTop: 18 }}><h2>Execution layer</h2><div className="features"><div className="feature"><strong>Bankr Agent API</strong><span>Natural-language agent and wallet operations — server-side key only.</span></div><div className="feature"><strong>Definitive Flash</strong><span>DCA and limit quote planning is wired server-side. Signing and live submission remain disabled until explicit approval.</span></div><div className="feature"><strong>Base + routing</strong><span>Base-first settlement with a server-side Uniswap adapter ready for configured credentials.</span></div></div></section>
      <div className="footer">Flitzr · RUNTIME Agent Week build · secrets stay server-side · planner is preview-only</div>
    </main>
  )
}
