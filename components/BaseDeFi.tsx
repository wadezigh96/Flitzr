'use client'

import { useEffect, useState } from 'react'
import { encodeFunctionData, decodeFunctionResult } from 'viem'
import { usePrivy, useWallets } from '@privy-io/react-auth'

const AERODROME = 'https://aerodrome.finance/'
const AERO_LAUNCH = 'https://aerodrome.finance/docs/launcher'
const BASE_CHAIN_ID = '0x2105'

const BASE_TOKENS = [
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006' },
  { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' },
  { symbol: 'AERO', name: 'Aerodrome', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631' },
  { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' },
  { symbol: 'wstETH', name: 'Wrapped stETH', address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452' },
] as const

const AERODROME_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43'
const AERODROME_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da'
const UNISWAP_PROXY_APPROVAL = '0x0000000085E102724e78eCd2F45DC9cA239Affad'
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
const AERODROME_ABI = [{ type: 'function', name: 'getAmountsOut', stateMutability: 'view', inputs: [{ name: 'amountIn', type: 'uint256' }, { name: 'routes', type: 'tuple[]', components: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'stable', type: 'bool' }, { name: 'factory', type: 'address' }] }], outputs: [{ name: 'amounts', type: 'uint256[]' }] }] as const

type QuoteData = { provider?: string; routing?: string; quote?: { quoteId?: string; amountIn?: string; amountOut?: string; amountOutMin?: string; slippageTolerance?: number; route?: unknown; gasUseEstimateQuote?: string; gasUseEstimate?: string; priceImpact?: number | string } }
type SwapData = { transaction?: { to: string; data: string; value?: string; gasLimit?: string; gasPrice?: string; maxFeePerGas?: string; maxPriorityFeePerGas?: string }; routing?: string; requestId?: string }

export default function BaseDeFi() {
  const { ready, authenticated, connectOrCreateWallet, logout, getAccessToken } = usePrivy()
  const { wallets } = useWallets()
  const [tab, setTab] = useState<'swap' | 'stake' | 'tokenize'>('swap')
  const [sellToken, setSellToken] = useState(BASE_TOKENS[0].address)
  const [buyToken, setBuyToken] = useState(BASE_TOKENS[1].address)
  const [amount, setAmount] = useState('0.001')
  const [sellBalance, setSellBalance] = useState('—')
  const [sellDecimals, setSellDecimals] = useState(18)
  const [buyDecimals, setBuyDecimals] = useState(6)
  const [provider, setProvider] = useState<'uniswap' | 'aerodrome' | 'bankr'>('uniswap')
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [quoteAt, setQuoteAt] = useState<number | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [quoteTick, setQuoteTick] = useState(0)
  const [comparison, setComparison] = useState<{ uniswap: QuoteData | null; aerodrome: QuoteData | null }>({ uniswap: null, aerodrome: null })
  const [comparing, setComparing] = useState(false)

  const wallet = authenticated ? (wallets[0]?.address?.toLowerCase() || '') : ''
  const ethProvider = wallets[0]?.getEthereumProvider?.()

  function selectedToken(address: string) {
    return BASE_TOKENS.find(token => token.address.toLowerCase() === address.toLowerCase())
  }

  async function refreshSellBalance() {
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !ethProvider) return
    try {
      const decimalsHex = await ethProvider.request({ method: 'eth_call', params: [{ to: sellToken, data: '0x313ce567' }, 'latest'] }) as string
      const decimals = Number(BigInt(decimalsHex || '0x12'))
      const balanceHex = await ethProvider.request({ method: 'eth_call', params: [{ to: sellToken, data: `0x70a08231${wallet.slice(2).padStart(64, '0')}` }, 'latest'] }) as string
      const balance = Number(BigInt(balanceHex || '0x0')) / 10 ** decimals
      setSellDecimals(decimals)
      setSellBalance(Number.isFinite(balance) ? balance.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—')
    } catch { setSellBalance('—') }
  }

  useEffect(() => { void refreshSellBalance() }, [wallet, sellToken, ethProvider])

  useEffect(() => {
    if (!quoteAt) return
    const timer = window.setInterval(() => setQuoteTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [quoteAt])

  useEffect(() => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(buyToken) || !ethProvider) return
    void ethProvider.request({ method: 'eth_call', params: [{ to: buyToken, data: '0x313ce567' }, 'latest'] }).then(value => setBuyDecimals(Number(BigInt(String(value || '0x6'))))).catch(() => setBuyDecimals(18))
  }, [buyToken, ethProvider])

  function formatRawAmount(value: string | undefined, decimals: number) {

    if (!value) return '—'
    try {
      const raw = BigInt(value)
      const base = 10 ** decimals
      return (Number(raw) / base).toLocaleString(undefined, { maximumFractionDigits: Math.min(decimals, 8) })
    } catch { return value }
  }

  async function connect() {
    setError(''); setStatus('')
    try { await connectOrCreateWallet(); setStatus('Privy wallet connected on Base.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Wallet connection failed.') }
  }

  async function disconnect() {
    setError(''); setQuote(null)
    try { await logout(); setStatus('Wallet disconnected from Flitzr.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not disconnect the wallet.') }
  }

  async function authHeaders() {
    const token = await getAccessToken()
    if (!token) throw new Error('Privy authentication is not ready.')
    return { 'content-type': 'application/json', Authorization: `Bearer ${token}` }
  }

  async function getAerodromeQuote(rawAmount: string) {
    if (!ethProvider) throw new Error('Privy wallet provider is not available.')
    const weth = BASE_TOKENS[0].address
    const stablePair = [sellToken, buyToken].every(address => [BASE_TOKENS[1].address, BASE_TOKENS[2].address].some(stable => stable.toLowerCase() === address.toLowerCase()))
    const candidates = [
      [{ from: sellToken, to: buyToken, stable: stablePair, factory: AERODROME_FACTORY }],
      ...(sellToken.toLowerCase() !== weth.toLowerCase() && buyToken.toLowerCase() !== weth.toLowerCase()
        ? [[{ from: sellToken, to: weth, stable: false, factory: AERODROME_FACTORY }, { from: weth, to: buyToken, stable: false, factory: AERODROME_FACTORY }]]
        : []),
    ]
    for (const routes of candidates) {
      try {
        const data = encodeFunctionData({ abi: AERODROME_ABI, functionName: 'getAmountsOut', args: [BigInt(rawAmount), routes as any] })
        const result = await ethProvider.request({ method: 'eth_call', params: [{ to: AERODROME_ROUTER, data }, 'latest'] }) as string
        const amounts = decodeFunctionResult({ abi: AERODROME_ABI, functionName: 'getAmountsOut', data: result as `0x${string}` }) as readonly bigint[]
        const output = amounts[amounts.length - 1] || 0n
        if (output > 0n) return { provider: 'aerodrome', routing: routes.length > 1 ? 'Aerodrome · 2-hop via WETH' : 'Aerodrome · direct', quote: { amountIn: rawAmount, amountOut: output.toString(), slippageTolerance: 0.5, quoteId: `aero_${Date.now()}` } }
      } catch {}
    }
    throw new Error('Aerodrome could not find a liquid route for this pair.')
  }

  async function compareRoutes() {
    setError(''); setStatus(''); setComparison({ uniswap: null, aerodrome: null })
    if (!wallet || !authenticated) return setError('Connect your Privy wallet first.')
    if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !/^0x[a-fA-F0-9]{40}$/.test(buyToken)) return setError('Enter valid Base token contract addresses.')
    if (!/^\\d*\\.?\\d+$/.test(amount) || Number(amount) <= 0) return setError('Amount must be greater than 0.')
    setComparing(true)
    try {
      const rawAmount = BigInt(Math.round(Number(amount) * 10 ** sellDecimals)).toString()
      const [aerodrome, uniswap] = await Promise.all([
        getAerodromeQuote(rawAmount).catch(() => null),
        (async () => {
          const response = await fetch('/api/quote', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ sellToken, buyToken, amount: rawAmount, orderType: 'market', swapper: wallet, provider: 'uniswap' }) })
          const json = await response.json()
          return response.ok ? json : null
        })(),
      ])
      setComparison({ uniswap, aerodrome })
      if (!uniswap && !aerodrome) throw new Error('No route quote is currently available.')
      setStatus('Route comparison ready. Compare output, route and provider before choosing.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Route comparison failed.') } finally { setComparing(false) }
  }

  async function getQuote() {
    setError(''); setStatus(''); setQuote(null)
    if (!wallet || !authenticated) return setError('Connect your Privy wallet first.')
    if (!/^0x[a-fA-F0-9]{40}$/.test(sellToken) || !/^0x[a-fA-F0-9]{40}$/.test(buyToken)) return setError('Enter valid Base token contract addresses.')
    if (!/^\d*\.?\d+$/.test(amount) || Number(amount) <= 0) return setError('Amount must be greater than 0.')
    setLoading(true)
    try {
      const rawAmount = BigInt(Math.round(Number(amount) * 10 ** sellDecimals)).toString()
      const data = provider === 'aerodrome'
        ? await getAerodromeQuote(rawAmount)
        : await (async () => {
            const response = await fetch('/api/quote', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ sellToken, buyToken, amount: rawAmount, orderType: 'market', swapper: wallet, provider }) })
            const json = await response.json()
            if (!response.ok) throw new Error(json.error || 'Quote failed')
            return json
          })()
      setQuote(data); setQuoteAt(Date.now()); setReviewing(false); setStatus('Quote ready. Review it before approving or swapping.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Quote failed.') } finally { setLoading(false) }
  }

  async function approveToken() {
    setError(''); setStatus('')
    try {
      if (!ethProvider) throw new Error('Privy wallet provider is not available.')
      setExecuting(true)
      const spender = UNISWAP_PROXY_APPROVAL.slice(2).toLowerCase().padStart(64, '0')
      const value = MAX_UINT256.slice(2).padStart(64, '0')
      setStatus('Waiting for token approval in your Privy wallet…')
      const hash = await ethProvider.request({ method: 'eth_sendTransaction', params: [{ from: wallet, to: sellToken, data: `0x095ea7b3${spender}${value}`, value: '0x0' }] }) as string
      setStatus(`Approval submitted: ${hash.slice(0, 10)}…`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Approval failed.') } finally { setExecuting(false) }
  }

  async function executeSwap() {
    setError(''); setStatus('')
    if (provider !== 'uniswap') return setError('Executable wallet flow is currently enabled for Uniswap. Aerodrome is quote-only for now; Bankr remains quote-only.')
    if (!quote) return setError('Get a fresh quote first.')
    if (quoteAt && Date.now() - quoteAt > 30000) return setError('Quote expired. Get a fresh quote before signing.')
    if (!reviewing) return setReviewing(true)
    setExecuting(true)
    try {
      const rawAmount = BigInt(Math.round(Number(amount) * 10 ** sellDecimals)).toString()
      const response = await fetch('/api/swap', { method: 'POST', headers: await authHeaders(), body: JSON.stringify({ sellToken, buyToken, amount: rawAmount, swapper: wallet }) })
      const data = await response.json() as SwapData & { error?: string }
      if (!response.ok || !data.transaction) throw new Error(data.error || 'Could not build swap transaction.')
      if (!ethProvider) throw new Error('Privy wallet provider is not available.')
      setStatus('Transaction prepared. Confirm it in your Privy wallet…')
      const tx = data.transaction
      const params: Record<string, string> = { from: wallet, to: tx.to, data: tx.data, value: tx.value || '0x0' }
      if (tx.gasLimit) params.gas = `0x${BigInt(tx.gasLimit).toString(16)}`
      if (tx.maxFeePerGas) params.maxFeePerGas = `0x${BigInt(tx.maxFeePerGas).toString(16)}`
      if (tx.maxPriorityFeePerGas) params.maxPriorityFeePerGas = `0x${BigInt(tx.maxPriorityFeePerGas).toString(16)}`
      if (tx.gasPrice && !tx.maxFeePerGas) params.gasPrice = `0x${BigInt(tx.gasPrice).toString(16)}`
      const hash = await ethProvider.request({ method: 'eth_sendTransaction', params: [params] }) as string
      setReviewing(false)
      setStatus(`Swap submitted on Base: ${hash}`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Swap failed.') } finally { setExecuting(false) }
  }

  return <section className="card" style={{ marginTop: 16 }}>
    <div className="sectionHead"><div><div className="sectionKicker">05 · BASE DEFI HUB</div><h2>Swap · Stake · Tokenize</h2></div><span className="liveSmall">BASE · 8453</span></div>
    <p className="muted">Base-native control surface for market swaps, Aerodrome liquidity/staking, and tokenized assets. Every executable transaction is explicitly signed by the connected Privy wallet.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>{(['swap','stake','tokenize'] as const).map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? 'approveButton' : 'secondaryButton'}>{item === 'swap' ? '⇄ Swap' : item === 'stake' ? '◈ Stake' : '◎ Tokenize'}</button>)}</div>

    {tab === 'swap' && <div style={{ marginTop: 16 }}>
      <div className="stockControls">
        <div className="stockField"><label>SELL TOKEN · BASE</label><select value={sellToken} onChange={e => setSellToken(e.target.value)}>{BASE_TOKENS.map(token => <option key={token.address} value={token.address}>{token.symbol} · {token.name}</option>)}<option value="custom">Custom contract…</option></select>{!BASE_TOKENS.some(token => token.address.toLowerCase() === sellToken.toLowerCase()) && <input style={{ marginTop: 8 }} value={sellToken} onChange={e => setSellToken(e.target.value)} placeholder="0x… token contract" />}</div>
        <div className="stockField"><label>BUY TOKEN · BASE</label><select value={buyToken} onChange={e => setBuyToken(e.target.value)}>{BASE_TOKENS.map(token => <option key={token.address} value={token.address}>{token.symbol} · {token.name}</option>)}<option value="custom">Custom contract…</option></select>{!BASE_TOKENS.some(token => token.address.toLowerCase() === buyToken.toLowerCase()) && <input style={{ marginTop: 8 }} value={buyToken} onChange={e => setBuyToken(e.target.value)} placeholder="0x… token contract" />}</div>
      </div>
      <div className="stockControls"><div className="stockField"><label>AMOUNT · {selectedToken(sellToken)?.symbol || "TOKEN"}</label><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" /><small style={{ display: "block", marginTop: 6 }}>Balance: {sellBalance} {selectedToken(sellToken)?.symbol || ""} · {sellDecimals} decimals <button type="button" className="secondaryButton" style={{ marginLeft: 6, padding: "2px 7px" }} onClick={() => setAmount(sellBalance.replace(/,/g, ""))} disabled={sellBalance === "—"}>MAX</button></small></div><div className="stockField"><label>QUOTE ROUTER</label><select value={provider} onChange={e => setProvider(e.target.value as 'uniswap' | 'bankr')}><option value="uniswap">Uniswap</option><option value="aerodrome">Aerodrome · onchain route</option><option value="bankr">Bankr · quote</option></select></div></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}><button className="secondaryButton" onClick={wallet ? disconnect : connect} disabled={!ready}>{wallet ? `${wallet.slice(0,6)}…${wallet.slice(-4)} · Disconnect` : 'Connect Base wallet'}</button><button className="approveButton" onClick={getQuote} disabled={loading || !authenticated}>{loading ? 'Quoting…' : 'Get swap quote'}</button><button className="secondaryButton" onClick={compareRoutes} disabled={comparing || !authenticated}>{comparing ? 'Comparing…' : 'Compare routes'}</button></div>
      {(comparison.uniswap || comparison.aerodrome) && <div className="result" style={{ marginTop: 12 }}>
        <strong>Route Comparison</strong>
        <small style={{ display: 'block', marginTop: 4 }}>Same input · Base Mainnet · live provider quotes</small>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
          {(['uniswap','aerodrome'] as const).map(name => {
            const item = comparison[name]
            return <div key={name} className="result">
              <small>{name === 'uniswap' ? 'UNISWAP' : 'AERODROME'}</small>
              {item ? <>
                <strong>{formatRawAmount(item.quote?.amountOut, buyDecimals)} {selectedToken(buyToken)?.symbol || 'TOKEN'}</strong>
                <small style={{ display: 'block', marginTop: 5 }}>Route: {item.routing || 'Direct'}</small>
                <small style={{ display: 'block' }}>Slippage: {item.quote?.slippageTolerance ?? 0.5}%</small>
                <small style={{ display: 'block' }}>Quote ID: {item.quote?.quoteId || 'provider response'}</small>
              </> : <small style={{ display: 'block', marginTop: 6 }}>No quote available for this pair.</small>}
            </div>
          })}
        </div>
      </div>}

      {quote && <div className="result" style={{ marginTop: 12 }}>
        <strong>Swap quote</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
          <div className="result"><small>You Pay</small><strong>{amount} {selectedToken(sellToken)?.symbol || 'TOKEN'}</strong></div>
          <div className="result"><small>You Receive</small><strong>{formatRawAmount(quote.quote?.amountOut, buyDecimals)} {selectedToken(buyToken)?.symbol || 'TOKEN'}</strong></div>
          <div className="result"><small>Route</small><strong>{quote.routing || 'Direct'}</strong></div>
          <div className="result"><small>Provider</small><strong>{String(quote.provider || provider).toUpperCase()}</strong></div>
          <div className="result"><small>Slippage</small><strong>{quote.quote?.slippageTolerance ?? 0.5}%</strong></div>
          <div className="result"><small>Price Impact</small><strong>{quote.quote?.priceImpact != null ? `${quote.quote.priceImpact}%` : 'Provider data unavailable'}</strong></div>
          <div className="result"><small>Network Fee</small><strong>{quote.quote?.gasUseEstimateQuote ? `${quote.quote.gasUseEstimateQuote} ETH` : 'Provider data unavailable'}</strong></div>
          <div className="result"><small>Quote ID</small><strong style={{ overflowWrap: 'anywhere' }}>{quote.quote?.quoteId || 'Provider response'}</strong></div>
        </div>
        <small style={{ display: 'block', marginTop: 10 }}>Base Mainnet · Quote valid for 30 seconds. Review the output and route before signing.{quoteAt ? ` · ${Math.max(0, Math.ceil((30000 - (Date.now() - quoteAt)) / 1000))}s remaining` : ''}</small>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {provider === 'uniswap' && <>
            <button className="secondaryButton" onClick={approveToken} disabled={executing || (quoteAt !== null && Date.now() - quoteAt > 30000)}>Approve input token</button>
            {!reviewing ? <button className="approveButton" onClick={() => setReviewing(true)} disabled={executing || (quoteAt !== null && Date.now() - quoteAt > 30000)}>Review swap</button> : <button className="approveButton" onClick={executeSwap} disabled={executing}>{executing ? 'Waiting…' : 'Confirm in wallet'}</button>}
          </>}
          <button className="secondaryButton" onClick={getQuote} disabled={loading || executing}>{loading ? 'Refreshing…' : 'Refresh quote'}</button>
        </div></div>}
    </div>}

    {tab === 'stake' && <div style={{ marginTop: 16 }} className="result"><strong>Aerodrome staking & liquidity</strong><p className="muted">Aerodrome supports Base swaps, liquidity deposits and staking/emissions. AERO can also be locked into veAERO for voting and fee participation.</p><div className="chips"><span>Base</span><span>AERO / veAERO</span><span>LP staking</span><span>Explicit wallet approval</span></div><div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}><a className="secondaryButton" href={AERODROME} target="_blank" rel="noreferrer">Open Aerodrome ↗</a><a className="secondaryButton" href={AERO_LAUNCH} target="_blank" rel="noreferrer">Launch liquidity ↗</a></div></div>}

    {tab === 'tokenize' && <div style={{ marginTop: 16 }} className="result"><strong>Tokenized assets on Base</strong><p className="muted">Tokenized ERC-20 assets can stay inside the same Base wallet and swap workflow. Flitzr does not silently create or mint assets; token creation will be a separate explicit deployment flow.</p><div className="chips"><span>ERC-20</span><span>Base</span><span>Tokenized assets</span><span>Swap-compatible</span></div><p className="previewNote">Verify the token contract, issuer, liquidity and transfer restrictions before signing.</p></div>}

    {status && <p className="previewNote">{status}</p>}{error && <p className="error">{error}</p>}
    <p className="riskNote">Flitzr keeps API keys server-side and requires a wallet signature for authentication and each transaction. Never paste a private key into Flitzr.</p>
  </section>
}