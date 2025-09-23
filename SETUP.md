# Monad Swap DApp Setup

This is a decentralized application for swapping WMON to USDC on Monad Testnet using the 0x Protocol.

## Prerequisites

1. **Get a 0x API Key**
   - Visit [0x.org/docs/api](https://0x.org/docs/api)
   - Sign up and get your API key

2. **Set up Environment Variables**
   - Create a `.env.local` file in the root directory
   - Add your 0x API key:
   ```
   NEXT_PUBLIC_ZERO_EX_API_KEY=your_0x_api_key_here
   ```

3. **Monad Testnet Setup**
   - Make sure you have MON tokens in your wallet for testing
   - The app will automatically wrap MON to WMON if needed
   - Add Monad Testnet to your wallet:
     - Network Name: Monad Testnet
     - RPC URL: https://testnet1.monad.xyz
     - Chain ID: 10143
     - Currency Symbol: MON
     - Block Explorer: https://testnet.monadscan.com

## Token Addresses

- **WMON**: `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`
- **USDC Testnet**: `0xf817257fed379853cDe0fa4F97AB987181B1E5Ea`

## Features

✅ **Wallet Connection** - Connect your wallet using RainbowKit  
✅ **Token Balances** - View your WMON and USDC balances  
✅ **Price Quotes** - Get real-time swap quotes from 0x Protocol  
✅ **Token Approval** - Approve WMON spending when needed  
✅ **Swap Execution** - Execute WMON to USDC swaps  
✅ **Transaction Tracking** - View transactions on MonadScan  

## How to Use

1. **Connect Wallet** - Click the connect button and connect your wallet
2. **Enter Amount** - Enter the amount of WMON you want to swap
3. **Review Quote** - The app will automatically fetch a quote showing how much USDC you'll receive
4. **Approve (if needed)** - If this is your first swap, you'll need to approve WMON spending
5. **Swap** - Click the swap button to execute the transaction
6. **Confirm** - Confirm the transaction in your wallet
7. **Track** - View the transaction on MonadScan

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Wallet Integration**: wagmi + RainbowKit
- **Blockchain Interaction**: viem
- **Swap Protocol**: 0x Protocol v2 with Allowance Holder
- **Network**: Monad Testnet

## Troubleshooting

- **"Configuration Required" Error**: Make sure you've set the `NEXT_PUBLIC_ZERO_EX_API_KEY` environment variable
- **Transaction Fails**: Ensure you have enough MON for gas fees and WMON for the swap
- **Wallet Not Connecting**: Make sure you have Monad Testnet added to your wallet
- **No Quote**: Check that you have sufficient WMON balance and the amount is valid
