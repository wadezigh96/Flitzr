'use client'

import { useState } from 'react'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function runAgent() {
    if (!prompt.trim()) return
    setSubmitted(true)
  }

  return (
    <main className="shell">
      <nav className="nav"><div className="brand">FLITZR</div><div className="status">BASE · AGENT READY</div></nav>
      <section className="hero">
        <div className="eyebrow">Autonomous onchain financial agent</div>
        <h1>Money moves by policy, not by guesswork.</h1>
        <p>Flitzr turns a natural-language goal into a controlled execution plan. The agent can use Base liquidity and sponsor infrastructure while staying inside limits you define.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Ask Flitzr</h2>
          <div className="agent"><input value={prompt} onChange={e => {setPrompt(e.target.value);setSubmitted(false)}} placeholder="e.g. DCA $20 of ETH every week" /><button onClick={runAgent}>Plan</button></div>
          {submitted && <p style={{color:'#9aa6b5',lineHeight:1.5}}>Plan queued: <strong>{prompt}</strong>. Execution adapters will be connected in the next integration step.</p>}
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

      <section className="card" style={{marginTop:18}}>
        <h2>Execution layer</h2>
        <div className="features">
          <div className="feature"><strong>Bankr Agent API</strong><span>Natural-language agent and wallet operations — server-side key only.</span></div>
          <div className="feature"><strong>Definitive Flash</strong><span>Advanced trading orders such as DCA and limit orders for the RUNTIME track.</span></div>
          <div className="feature"><strong>Base + DEX routing</strong><span>Onchain settlement layer, with Uniswap integration planned for direct swap routing.</span></div>
        </div>
      </section>
      <div className="footer">Flitzr · RUNTIME Agent Week build · API credentials are never committed to the repository.</div>
    </main>
  )
}
