import { NextResponse } from 'next/server'

const API = 'https://api.xstocks.fi/api/v2/public/assets'
const featured = ['AAPLx', 'NVDAx', 'TSLAx', 'MSFTx', 'AMZNx', 'METAx']

function pickBaseDeployment(asset: any) {
  const deployments = asset?.deployments || asset?.tokenDeployments || []
  return deployments.find((item: any) => String(item.network).toLowerCase() === 'base')
}

export async function GET() {
  try {
    const response = await fetch(API, { next: { revalidate: 60 } })
    if (!response.ok) throw new Error(`xStocks API returned ${response.status}`)
    const payload = await response.json()
    const list = Array.isArray(payload) ? payload : payload.assets || payload.data || []
    const assets = list
      .filter((asset: any) => featured.includes(asset.symbol))
      .map((asset: any) => {
        const deployment = pickBaseDeployment(asset)
        return {
          symbol: asset.symbol,
          name: asset.name || asset.description || asset.symbol,
          address: deployment?.address || deployment?.tokenAddress || deployment?.contractAddress || '',
          decimals: Number(deployment?.decimals ?? asset.decimals ?? 18),
          price: Number(asset.price ?? asset.priceData?.price ?? 0) || undefined,
        }
      })
      .filter((asset: any) => /^0x[a-fA-F0-9]{40}$/.test(asset.address))

    return NextResponse.json({ network: 'Base', chainId: 8453, assets })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load xStocks assets' }, { status: 502 })
  }
}
