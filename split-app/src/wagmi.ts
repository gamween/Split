import { createConfig, http } from 'wagmi'
import { base } from 'viem/chains'

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL!)
  },
  ssr: true
})
