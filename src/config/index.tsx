import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage } from 'wagmi'

import { WagmiProvider } from 'wagmi'
import { polygon, mainnet } from 'wagmi/chains'



// 1. Get projectId at https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// 2. Create wagmiConfig
const metadata = {
  name: 'Flower Girls Seed Purse',
  description: 'Seed Purse for Seeds',
  url: 'https://seeds.flowergirlsnft.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, polygon] as const
export const config = defaultWagmiConfig({ 
  chains, 
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
})