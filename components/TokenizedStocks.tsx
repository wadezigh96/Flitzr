'use client'

import { useEffect, useMemo, useState } from 'react'

type Asset = { symbol: string; name: string; address: string; decimals: number; price?: number; balance?: number }
const featured = ['AAPLx', 'NVDAx', 'TSLAx', 'MSFTx', 'AMZNx', 'METAx']
const BASE_CHAIN_HEX = '0x2105'

export default function TokenizedStocks({ wallet }: { wallet: string }) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [symbol, setSymbol] = useState('AAPLx')
  const [direction, setDirection] = useState<'send' | 'receive'>('send')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading] = useState(false)
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/tokenized-stocks').then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not load tokenized stocks'); setAssets(data.assets || []) }).catch(error => setError(error instanceof Error ? error.message : 'Could not load tokenized stocks'))
  }, [])

  useEffect(() => {
    if (!wallet || !assets.length) return
    const ethereum = (window as any).ethereum
    if (!ethereum) return
    let cancelled = false
    setBalancesLoading(true)
    Promise.all(assets.map(async asset => {
      try {
        const data = '0x70a08231' + wallet.slice(2).padStart(64, '0')
        const raw = await ethereum.request({ method: 'eth_call', params: [{ to: asset.address, data }, 'latest'] })
        const units = BigInt(raw || '0'); const decimals = BigInt(asset.decimals)
        const balance = Number(units / (10n ** decimals)) + Number(units % (10n ** decimals)) / Number(10n ** decimals)
        return { ...asset, balance }
      } catch { return { ...asset, balance: 0 } }
    })).then(next => { if (!cancelled) setAssets(next) }).finally(() => { if (!cancelled) setBalancesLoading(false) })
    return () => { cancelled = true }
  }, [wallet, assets.length])

  const selected = useMemo(() => assets.find(asset => asset.symbol === symbol), [assets, symbol])
  const portfolioValue = useMemo(() => assets.reduce((sum, asset) => sum + (asset.balance || 0) * (asset.price || 0), 0), [assets])

  async function sendToken() {
    setError(''); setMessage('')
    if (!wallet) return setError('Connect your Base wallet first.')
    if (!selected || !/^0x[a-fA-F0-9]{40}$/.test(selected.address)) return setError('This token is not currently available on Base.')
    if (!amount || Number(amount) <= 0) return setError('Enter an amount.')
    if (!Number.isFinite(Number(amount))) return setError('Enter a valid amount.')
    if (Number(amount) > (selected.balance || 0)) return setError(`Insufficient ${selected.symbol} balance.`)
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) return setError('Enter a valid recipient wallet address.')
    setLoading(true)
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('Wallet provider not found.')
      const chainId = await ethereum.request({ method: 'eth_chainId' })
      if (String(chainId).toLowerCase() !== BASE_CHAIN_HEX) {
        try {
          await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BASE_CHAIN_HEX }] })
        } catch (switchError: any) {
          if (switchError?.code === 4902) {
            await ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: BASE_CHAIN_HEX, chainName: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] }] })
          } else {
            throw new Error('Please switch your wallet to Base Mainnet before sending.')
          }
        }
      }

      const decimals = BigInt(selected.decimals); const [whole, fraction = ''] = amount.split('.')
      if (fraction.length > selected.decimals) throw new Error(`Maximum ${selected.decimals} decimal places.`)
      const value = BigInt(whole || '0') * (10n ** decimals) + BigInt((fraction || '').padEnd(selected.decimals, '0') || '0')
      const data = '0xa9059cbb' + recipient.slice(2).padStart(64, '0') + value.toString(16).padStart(64, '0')
      const txHash = await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: wallet, to: selected.address, data }] })
      setMessage(`Transaction submitted: ${txHash.slice(0, 10)}…`)
      setAmount('')
    } catch (error) { setError(error instanceof Error ? error.message : 'Token transfer failed.') } finally { setLoading(false) }
  }

  return <section className="card stocksCard">
    <div className="sectionHead"><div><div className="sectionKicker">03.5 · TOKENIZED EQUITIES</div><h2>Tokenized stock portfolio</h2></div><span className="liveSmall">BASE · ERC-20</span></div>
    <p className="muted">View supported tokenized equity balances and use the same wallet to send or receive. Flitzr never receives your private key.</p>
    <div className="stockPortfolio"><div><span>PORTFOLIO VALUE</span><strong>{portfolioValue > 0 ? `$${portfolioValue.toFixed(2)}` : balancesLoading ? 'Loading…' : '$0.00'}</strong></div><div><span>ASSETS</span><strong>{assets.length || featured.length}</strong></div><div><span>NETWORK</span><strong>Base</strong></div></div>
    <div className="stockControls"><div className="stockField"><label>ASSET</label><select value={symbol} onChange={event => setSymbol(event.target.value)}>{(assets.length ? assets.filter(asset => featured.includes(asset.symbol)) : featured.map(symbol => ({ symbol, name: symbol, address: '', decimals: 18 }))).map(asset => <option key={asset.symbol} value={asset.symbol}>{asset.symbol} · {asset.name}</option>)}</select></div><div className="stockField"><label>ACTION</label><div className="segmented"><button className={direction === 'send' ? 'selected' : ''} onClick={() => setDirection('send')}>Send</button><button className={direction === 'receive' ? 'selected' : ''} onClick={() => setDirection('receive')}>Receive</button></div></div></div>
    <div className="stockList">{(assets.length ? assets : featured.map(symbol => ({ symbol, name: symbol, address: '', decimals: 18 }))).map(asset => <button type="button" key={asset.symbol} onClick={() => setSymbol(asset.symbol)} className={asset.symbol === symbol ? 'stockRow selected' : 'stockRow'}><span className="ticker">{asset.symbol.replace('x', '')}</span><div><strong>{asset.symbol}</strong><small>{asset.name}</small></div><span>{asset.balance === undefined ? '—' : asset.balance.toFixed(4)}</span></button>)}</div>
    {direction === 'send' ? <div className="stockControls"><div className="stockField"><label>AMOUNT</label><input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0.10" /></div><div className="stockField"><label>RECIPIENT</label><input value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="0x…" /></div></div> : <div className="receiveBox"><span>RECEIVE {symbol}</span><strong>{wallet || 'Connect wallet to show address'}</strong><small>Share this Base wallet address with the sender. Verify the selected asset and network before receiving.</small></div>}
    {selected?.price ? <div className="stockMeta">Reference price · ${selected.price.toFixed(2)} · Contract · {selected.address.slice(0, 8)}…{selected.address.slice(-6)}</div> : <div className="stockMeta">Asset contracts and public price data are resolved from xStocks. Only Base deployments are shown.</div>}
    {direction === 'send' && <button className="secondaryButton stockButton" onClick={sendToken} disabled={loading}>{loading ? 'Waiting for wallet…' : `Send ${symbol}`}</button>}
    {message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}
    <p className="riskNote">Tokenized equities are financial instruments with jurisdiction and eligibility restrictions. Flitzr does not provide investment advice. Confirm the asset, destination and network before signing.</p>
    <style jsx>{`.stockPortfolio{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-top:16px}.stockPortfolio>div{border:1px solid #172a22;background:#09120f;border-radius:11px;padding:12px}.stockPortfolio span{display:block;color:#587068;font-size:8px;font-weight:900;letter-spacing:.1em}.stockPortfolio strong{display:block;font-size:16px;margin-top:5px}.stockList{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.stockRow{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;text-align:left;border:1px solid #172a22;background:#09120f;color:#eef8f3;border-radius:10px;padding:9px;cursor:pointer}.stockRow.selected{border-color:#326b53;background:#0d1a14}.stockRow .ticker{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:#10281d;color:#55e7a7;font-size:9px;font-weight:900}.stockRow strong,.stockRow small{display:block}.stockRow strong{font-size:10px}.stockRow small{color:#60766e;font-size:8px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stockRow>span:last-child{color:#83a096;font-size:9px}.stockButton{width:100%}@media(max-width:700px){.stockPortfolio{grid-template-columns:1fr 1fr}.stockPortfolio>div:first-child{grid-column:1/-1}.stockList{grid-template-columns:1fr 1fr}}@media(max-width:450px){.stockList{grid-template-columns:1fr}}`}</style>
  </section>
}
