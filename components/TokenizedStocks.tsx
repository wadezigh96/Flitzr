'use client'

import { useEffect, useMemo, useState } from 'react'

type Asset = {
  symbol: string
  name: string
  address: string
  decimals: number
  price?: number
}

const featured = ['AAPLx', 'NVDAx', 'TSLAx', 'MSFTx', 'AMZNx', 'METAx']

export default function TokenizedStocks({ wallet }: { wallet: string }) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [symbol, setSymbol] = useState('AAPLx')
  const [direction, setDirection] = useState<'send' | 'receive'>('send')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tokenized-stocks')
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load tokenized stocks')
        setAssets(data.assets || [])
      })
      .catch(error => setError(error instanceof Error ? error.message : 'Could not load tokenized stocks'))
  }, [])

  const selected = useMemo(() => assets.find(asset => asset.symbol === symbol), [assets, symbol])

  async function sendToken() {
    setError(''); setMessage('')
    if (!wallet) return setError('Connect your Base wallet first.')
    if (!selected) return setError('This token is not currently available on Base.')
    if (!amount || Number(amount) <= 0) return setError('Enter an amount.')
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) return setError('Enter a valid recipient wallet address.')
    setLoading(true)
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('Wallet provider not found.')
      const decimals = BigInt(selected.decimals)
      const [whole, fraction = ''] = amount.split('.')
      if (fraction.length > selected.decimals) throw new Error(`Maximum ${selected.decimals} decimal places.`)
      const value = BigInt(whole || '0') * (10n ** decimals) + BigInt((fraction || '').padEnd(selected.decimals, '0') || '0')
      const data = '0xa9059cbb' + recipient.slice(2).padStart(64, '0') + value.toString(16).padStart(64, '0')
      const txHash = await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: wallet, to: selected.address, data }] })
      setMessage(`Transaction submitted: ${txHash.slice(0, 10)}…`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Token transfer failed.')
    } finally { setLoading(false) }
  }

  return <section className="card stocksCard">
    <div className="sectionHead"><div><div className="sectionKicker">03.5 · TOKENIZED EQUITIES</div><h2>Send / receive tokenized stocks</h2></div><span className="liveSmall">BASE · ERC-20</span></div>
    <p className="muted">Choose a supported tokenized equity, then send it directly from your connected wallet or use your wallet address to receive it. Flitzr never receives your private key.</p>
    <div className="stockControls">
      <div className="stockField"><label>ASSET</label><select value={symbol} onChange={event => setSymbol(event.target.value)}>{(assets.length ? assets.filter(asset => featured.includes(asset.symbol)) : featured.map(symbol => ({ symbol, name: symbol, address: '', decimals: 18 }))).map(asset => <option key={asset.symbol} value={asset.symbol}>{asset.symbol} · {asset.name}</option>)}</select></div>
      <div className="stockField"><label>ACTION</label><div className="segmented"><button className={direction === 'send' ? 'selected' : ''} onClick={() => setDirection('send')}>Send</button><button className={direction === 'receive' ? 'selected' : ''} onClick={() => setDirection('receive')}>Receive</button></div></div>
    </div>
    {direction === 'send' ? <div className="stockControls">
      <div className="stockField"><label>AMOUNT</label><input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0.10" /></div>
      <div className="stockField"><label>RECIPIENT</label><input value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="0x…" /></div>
    </div> : <div className="receiveBox"><span>RECEIVE {symbol}</span><strong>{wallet || 'Connect wallet to show address'}</strong><small>Share this Base wallet address with the sender. Verify the selected asset and network before receiving.</small></div>}
    {selected?.price ? <div className="stockMeta">Reference price · ${selected.price.toFixed(2)} · Contract · {selected.address.slice(0, 8)}…{selected.address.slice(-6)}</div> : <div className="stockMeta">Asset contracts are resolved from the official xStocks public API. Only Base deployments are shown.</div>}
    {direction === 'send' && <button className="secondaryButton stockButton" onClick={sendToken} disabled={loading}>{loading ? 'Waiting for wallet…' : 'Send tokenized stock'}</button>}
    {message && <p className="success">{message}</p>}
    {error && <p className="error">{error}</p>}
    <p className="riskNote">Tokenized equities are financial instruments with jurisdiction and eligibility restrictions. Flitzr does not provide investment advice. Confirm the asset, destination and network before signing.</p>
  </section>
}
