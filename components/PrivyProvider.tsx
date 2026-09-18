'use client'

import { PrivyProvider as Provider } from '@privy-io/react-auth'
import { base } from 'viem/chains'

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!appId) return <>{children}</>

  return (
    <Provider
      appId={appId}
      config={{
        defaultChain: base,
        supportedChains: [base],
        appearance: {
          theme: 'dark',
          walletChainType: 'ethereum-only',
          landingHeader: 'Connect to Flitzr',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        loginMethods: ['wallet', 'email'],
      }}
    >
      {children}
    </Provider>
  )
}
