import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Monad Testnet chain
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://monad-testnet.g.alchemy.com/v2/z3lKYVOiH22EHYo_llexTcfAFu_jrVzp'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'MonadScan', 
      url: 'https://testnet.monadscan.com',
      apiUrl: 'https://testnet.monadscan.com/api'
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Monad Swap DApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [monadTestnet],
  ssr: true,
});
