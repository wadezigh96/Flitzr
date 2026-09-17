'use client'

import { useState } from 'react'

type Result = { plan?: { intent: { type: string; amountUsd: number | null }; policy: { allowed: boolean; needsApproval: boolean; reason: string }; execution: string; nextStep: string }; quote?: { configured?: boolean; demo?: boolean; message?: string; quoteId?: string }; error?: string }

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  async function runAgent() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await response.json()
      setResult(data)
    } catch {
      setResult({ error: 'Could not reach the Flitzr planner.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="shell">
      <nav className="nav"><div className="brand">FLITZR</div><div className="status">BASE · AGENT READY</div></nav>
      <section className="hero">
        <div className="eyebrow">Autonomous onchain financial agent</div>
        <h1>Money moves by policy, not by guesswork.</h1>
        <p>Flitzr turns a natural-language goal into a controlled execution plan. Every request is checked against your policy before a trading adapter is allowed to proceed.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Ask Flitzr</h2>
          <div className="agent"><input value={prompt} onChange={e => { setPrompt(e.target.value); setResult(null) }} onKeyDown={e => e.key === 'Enter' && runAgent()} placeholder="e.g. DCA $20 of ETH every week" /><button onClick={runAgent} disabled={loading}>{loading ? 'Planning…' : 'Plan'}</button></div>
          {result?.error && <p className="error">{result.error}</p>}
          {result?.plan && <div className="result">
            <div className="resultTop"><strong>{result.plan.intent.type.toUpperCase()} PLAN</strong><span>{result.plan.execution}</span></div>
            <p>{result.plan.policy.reason}</p>
            <div className="chips"><span>Base</span><span>{result.plan.intent.amountUsd === null ? 'Amount needed' : `$${result.plan.intent.amountUsd}`}</span><span>{result.plan.policy.allowed ? 'Policy OK' : 'Approval needed'}</span></div>
            {result.quote?.message && <small>{result.quote.message}</small>}
            {result.quote?.quoteId && <small>Quote ready: {result.quote.quoteId}</small>}
          </div>}
        </div>
        <div className="card">
          <h2>Agent policy</h2>
          <div className="policy">
            <div><div className="label">Network</div><div className="value">Base</div></div>
            <div><div className="label">Single trade</div><div className="value">$25 max</div></div>
            <div><div className="label">Daily budget</div><div className="value">$100 max</div></div>
            <div><div className="label">Approval</div><div className="value">Required &gt; $25</div></div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Execution layer</h2>
        <div className="features">
          <div className="feature"><strong>Bankr Agent API</strong><span>Natural-language agent and wallet operations — server-side key only.</span></div>
          <div className="feature"><strong>Definitive Flash</strong><span>DCA and limit quote planning is wired server-side. Signing and live submission remain a deliberate next step.</span></div>
          <div className="feature"><strong>Base</strong><span>Policy-first settlement layer. No real transaction is submitted from the planner.</span></div>
        </div>
      </section>
      <div className="footer">Flitzr · RUNTIME Agent Week build · secrets stay server-side · planner is preview-only</div>
    </main>
  )
}
