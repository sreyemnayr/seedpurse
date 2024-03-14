'use client'

import React, { ReactNode } from 'react'
import { config, projectId } from '@/config'

import { createWeb3Modal } from '@web3modal/wagmi/react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { State, WagmiProvider } from 'wagmi'

// 0. Setup queryClient
const queryClient = new QueryClient()
// 3. Create modal
createWeb3Modal({ wagmiConfig: config, projectId, themeMode: 'dark' })

export function Web3Modal({
  children,
  initialState
}: {
  children: ReactNode
  initialState?: State
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}