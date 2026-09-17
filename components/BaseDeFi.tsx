'use client'

import { useState } from 'react'

const AERODROME = 'https://aerodrome.finance/'
const AERO_LAUNCH = 'https://aerodrome.finance/docs/launcher'

export default function BaseDeFi() {
  const [tab, setTab] = useState<'swap' | 'stake' | 'tokenize'>('swap')
  const [wallet, setWallet] = useState('')
  const [sellToken, setSellToken] = useState('0x4200000000000000000000000000000000000006')
  const [buyToken, setBuyToken] = useState('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
  const [amount, setAmount] = useState('1000000000000000')
  const [provider, setProvider] = useState<'uniswap' | 'bankr'>('uniswap')
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setError('')
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('Install a browser wallet first.')
      await ethereum.request({ method: 'eth_requestAccounts' })
      const chainId = await ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0x2105') await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] })
      const accounts = await ethereum.request({ method: 'eth_accounts' })
      if (!accounts?.[0]) throw new Error('No wallet account returned.')
      setWallet(accounts[0].toLowerCase())
    } catch (e) { setError(e instanceof Error ? e.message : 'Wallet connection failed.') }
  }

  async function getQuote() {
    setError(''); setQuote(null)
    if (!wallet) return setError('Connect your Base wallet first.')
    if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !/^0x[a-fA-F0-9]{40}$/.test(buyToken)) return setError('Enter valid Base token contract addresses.')
    if (!/^\d+$/.test(amount) || amount === '0') return setError('Amount must be a positive base-unit integer.')
    setLoading(true)
    try {
      const response = await fetch('/api/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sellToken, buyToken, amount, orderType: 'market', swapper: wallet, provider }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Quote failed')
      setQuote(data)
    } catch (e) { setError(e instanceof Error ? e.message : 'Quote failed.') } finally { setLoading(false) }
  }

  return <section className="card" style={{ marginTop: 16 }}>
    <div className="sectionHead"><div><div className="sectionKicker">05 · BASE DEFI HUB</div><h2>Swap · Stake · Tokenize</h2></div><span className="liveSmall">BASE · 8453</span></div>
    <p className="muted">One Base-native control surface for market swaps, Aerodrome staking/liquidity, and tokenized assets. Quotes are preview-only until an explicit wallet transaction is added.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
      {(['swap','stake','tokenize'] as const).map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'approveButton' : 'secondaryButton'}>{item === 'swap' ? '⇄ Swap' : item === 'stake' ? '◈ Stake' : '◎ Tokenize'}</button>)}
    </div>

    {tab === 'swap' && <div style={{ marginTop: 16 }}>
      <div className="stockControls">
        <div className="stockField"><label>SELL TOKEN · BASE CONTRACT</label><input value={sellToken} onChange={e => setSellToken(e.target.value)} /></div>
        <div className="stockField"><label>BUY TOKEN · BASE CONTRACT</label><input value={buyToken} onChange={e => setBuyToken(e.target.value)} /></div>
      </div>
      <div className="stockControls">
        <div className="stockField"><label>AMOUNT · BASE UNITS</label><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" /></div>
        <div className="stockField"><label>QUOTE ROUTER</label><select value={provider} onChange={e => setProvider(e.target.value as 'uniswap' | 'bankr')}><option value="uniswap">Uniswap</option><option value="bankr">Bankr</option></select></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button className="secondaryButton" onClick={wallet ? () => setWallet('') : connect}>{wallet ? `${wallet.slice(0,6)}…${wallet.slice(-4)} · Disconnect` : 'Connect Base wallet'}</button><button className="approveButton" onClick={getQuote} disabled={loading}>{loading ? 'Quoting…' : 'Get swap quote'}</button></div>
      {quote && <div className="result" style={{ marginTop: 12 }}><strong>{String(quote.provider).toUpperCase()} quote ready</strong><small>Base Mainnet · preview only · quote ID: {quote.quote?.quoteId || 'provider response'}</small></div>}
    </div>}

    {tab === 'stake' && <div style={{ marginTop: 16 }} className="result">
      <strong>Aerodrome staking & liquidity</strong>
      <p className="muted">Aerodrome supports Base swaps, liquidity deposits and staking/emissions. AERO can also be locked into veAERO for voting and fee participation.</p>
      <div className="chips"><span>Base</span><span>AERO / veAERO</span><span>LP staking</span><span>Explicit wallet approval</span></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}><a className="secondaryButton" href={AERODROME} target="_blank" rel="noreferrer">Open Aerodrome ↗</a><a className="secondaryButton" href={AERO_LAUNCH} target="_blank" rel="noreferrer">Launch liquidity ↗</a></div>
    </div>}

    {tab === 'tokenize' && <div style={{ marginTop: 16 }} className="result">
      <strong>Tokenized assets on Base</strong>
      <p className="muted">Flitzr already exposes tokenized-equity balances in the portfolio. This hub keeps tokenized ERC-20 assets inside the same Base wallet and swap workflow.</p>
      <div className="chips"><span>ERC-20</span><span>Base</span><span>Tokenized equities</span><span>Swap-compatible</span></div>
      <p className="previewNote">Asset availability, eligibility and transfer restrictions can vary. Verify the contract and jurisdiction before signing.</p>
    </div>}

    {error && <p className="error">{error}</p>}
    <p className="riskNote">Flitzr separates intent, policy, quote and wallet signing. No private key is requested or stored by this component.</p>
  </section>
}
