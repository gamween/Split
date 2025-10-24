'use client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { config } from '@/src/wagmi'
import { MiniAppProvider } from './miniapp-provider'

const qc = new QueryClient()

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <MiniAppProvider>
          {children}
        </MiniAppProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
