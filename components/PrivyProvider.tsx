'use client'

import { PrivyProvider as Provider } from '@privy-io/react-auth'

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  if (!appId) return <>{children}</>
  return (
    <Provider
      appId={appId}
      config={{
        appearance: { walletChainType: 'ethereum' },
      }}
    >
      {children}
    </Provider>
  )
}
