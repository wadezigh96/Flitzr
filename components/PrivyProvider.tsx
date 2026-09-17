'use client'

import { PrivyProvider as Provider } from '@privy-io/react-auth'

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!appId) return <>{children}</>

  return (
    <Provider
      appId={appId}
      config={{
        supportedChains: [{ id: 8453, name: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.base.org'] }, public: { http: ['https://mainnet.base.org'] } }, blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } } }] as any,
        defaultChain: { id: 8453, name: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.base.org'] }, public: { http: ['https://mainnet.base.org'] } }, blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } } } as any,
      }}
    >
      {children}
    </Provider>
  )
}
