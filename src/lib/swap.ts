import { 
  getContract, 
  erc20Abi, 
  parseUnits, 
  maxUint256, 
  formatUnits,
  encodeFunctionData,
  type Address,
  type PublicClient,
  type WalletClient
} from "viem";
import { WMON_TOKEN_ADDRESS, USDC_TESTNET_ADDRESS } from "./constants";

export interface SwapQuote {
  buyAmount: string;
  sellAmount: string;
  price: string;
  estimatedGas: string;
  transaction: {
    to: Address;
    data: `0x${string}`;
    value?: string;
  };
  issues?: {
    allowance?: {
      spender: Address;
    } | null;
    balance?: {
      actual: string;
      expected: string;
    };
    simulationIncomplete?: boolean;
  };
}

export interface SwapPrice {
  buyAmount: string;
  sellAmount: string;
  price: string;
  estimatedGas: string;
  issues: {
    allowance: {
      spender: Address;
      actual?: string;
    } | null;
    balance?: {
      actual: string;
      expected: string;
    };
    simulationIncomplete?: boolean;
  };
}

export class SwapService {
  private publicClient: PublicClient;
  private walletClient: WalletClient;
  private balanceCache = new Map<string, { balance: bigint; timestamp: number }>();
  private readonly BALANCE_CACHE_TTL = 5000; // 5 seconds cache
  private pendingBalanceCalls = new Map<string, Promise<bigint>>();

  constructor(publicClient: PublicClient, walletClient: WalletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  async getTokenBalance(tokenAddress: Address, userAddress: Address): Promise<bigint> {
    const cacheKey = `${tokenAddress}-${userAddress}`;
    const now = Date.now();
    
    // Check cache first
    const cached = this.balanceCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.BALANCE_CACHE_TTL) {
      console.log(`Using cached balance for ${tokenAddress}: ${cached.balance.toString()}`);
      return cached.balance;
    }
    
    // Check if there's already a pending call for this balance
    const pending = this.pendingBalanceCalls.get(cacheKey);
    if (pending) {
      console.log(`Reusing pending balance call for ${tokenAddress}`);
      return pending;
    }
    
    // Make the actual call
    console.log(`Fetching fresh balance for ${tokenAddress}`);
    const balancePromise = this.fetchTokenBalance(tokenAddress, userAddress);
    
    // Store the pending promise to prevent duplicate calls
    this.pendingBalanceCalls.set(cacheKey, balancePromise);
    
    try {
      const balance = await balancePromise;
      
      // Cache the result
      this.balanceCache.set(cacheKey, { balance, timestamp: now });
      
      return balance;
    } finally {
      // Remove from pending calls
      this.pendingBalanceCalls.delete(cacheKey);
    }
  }
  
  private async fetchTokenBalance(tokenAddress: Address, userAddress: Address): Promise<bigint> {
    try {
      const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: this.publicClient,
      });

      const balance = await contract.read.balanceOf([userAddress]) as bigint;
      console.log(`Balance fetched for ${tokenAddress}: ${balance.toString()}`);
      return balance;
    } catch (error) {
      console.error(`Error fetching balance for ${tokenAddress}:`, error);
      // Return 0 instead of throwing to prevent app crashes
      return BigInt(0);
    }
  }

  async getPrice(
    sellAmount: string,
    sellToken: Address = WMON_TOKEN_ADDRESS,
    buyToken: Address = USDC_TESTNET_ADDRESS,
    sellTokenDecimals: number = 18
  ): Promise<SwapPrice> {
    const priceParams = new URLSearchParams({
      chainId: this.publicClient.chain!.id.toString(),
      sellToken,
      buyToken,
      sellAmount: parseUnits(sellAmount, sellTokenDecimals).toString(),
    });

    console.log('Fetching price with params:', priceParams.toString());

    try {
      const response = await fetch(
        `/api/swap/price?${priceParams.toString()}`,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to fetch price: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Price data received:', data);
      return data;
    } catch (error) {
      console.error('Error in getPrice:', error);
      throw error;
    }
  }

  async approveToken(spenderAddress: Address, tokenAddress: Address = WMON_TOKEN_ADDRESS): Promise<`0x${string}`> {
    const tokenContract = getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: this.walletClient,
    });

    const hash = await tokenContract.write.approve([spenderAddress, maxUint256], {
      account: this.walletClient.account!,
      chain: this.walletClient.chain,
    });
    return hash;
  }

  async getQuote(
    sellAmount: string,
    takerAddress: Address,
    sellToken: Address = WMON_TOKEN_ADDRESS,
    buyToken: Address = USDC_TESTNET_ADDRESS,
    sellTokenDecimals: number = 18
  ): Promise<SwapQuote> {
    const quoteParams = new URLSearchParams({
      chainId: this.publicClient.chain!.id.toString(),
      sellToken,
      buyToken,
      sellAmount: parseUnits(sellAmount, sellTokenDecimals).toString(),
      taker: takerAddress,
    });

    console.log('Fetching quote with params:', quoteParams.toString());

    try {
      const response = await fetch(
        `/api/swap/quote?${quoteParams.toString()}`,
        { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Quote API Error Response:', errorData);
        throw new Error(`Failed to fetch quote: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Quote data received:', data);
      return data;
    } catch (error) {
      console.error('Error in getQuote:', error);
      throw error;
    }
  }

  async executeSwap(quote: SwapQuote): Promise<`0x${string}`> {
    const hash = await this.walletClient.sendTransaction({
      account: this.walletClient.account!,
      chain: this.walletClient.chain,
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: quote.transaction.value ? BigInt(quote.transaction.value) : undefined,
    });

    return hash;
  }

  async approveAndSwapEip5792(
    sellToken: Address,
    spender: Address,
    quote: SwapQuote
  ): Promise<`0x${string}`> {
    try {
      console.log('Checking wallet capabilities for EIP-5792...');
      
      // Try to check wallet capabilities (some wallets might not support this method)
      let capabilities: any = null;
      try {
        capabilities = await this.walletClient.request({
          method: 'wallet_getCapabilities',
          params: [],
        });
        console.log('Wallet capabilities:', capabilities);
      } catch (capError) {
        console.log('wallet_getCapabilities not supported, proceeding with direct EIP-5792 attempt');
      }

      // Build approve calldata
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, maxUint256]
      });

      const calls = [
        {
          to: sellToken,
          data: approveData,
          value: '0x0',
        },
        {
          to: quote.transaction.to,
          data: quote.transaction.data,
          value: quote.transaction.value ? `0x${BigInt(quote.transaction.value).toString(16)}` : '0x0',
        },
      ];

      console.log('EIP-5792 calls prepared:', {
        sellToken,
        spender,
        calls: calls.map(call => ({
          to: call.to,
          value: call.value,
          dataLength: call.data.length
        }))
      });

      console.log('Attempting EIP-5792 batch transaction...');
      
      // wallet_sendCalls per EIP-5792
      const result = await this.walletClient.request({
        method: 'wallet_sendCalls' as any,
        params: [
          {
            version: '1.0',
            chainId: `0x${this.publicClient.chain!.id.toString(16)}`,
            from: this.walletClient.account!.address,
            calls,
          },
        ],
      });

      console.log('EIP-5792 batch transaction successful:', result);
      
      // Handle different return formats
      if (typeof result === 'string') {
        return result as `0x${string}`;
      } else if (result && typeof result === 'object' && (result as any).hash) {
        return (result as any).hash as `0x${string}`;
      } else if (result && typeof result === 'object' && (result as any).bundleId) {
        // Some wallets return a bundleId, we'll treat it as the transaction hash
        return (result as any).bundleId as `0x${string}`;
      }
      
      throw new Error('Invalid response format from wallet_sendCalls');
      
    } catch (error: any) {
      console.error('EIP-5792 error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        data: error.data
      });
      
      // Check for specific error codes that indicate lack of support
      if (
        error.code === -32601 || // Method not found
        error.code === 4200 ||   // Unsupported method
        error.message?.includes('wallet_sendCalls') ||
        error.message?.toLowerCase().includes('not supported') ||
        error.message?.toLowerCase().includes('unknown method')
      ) {
        throw new Error('EIP-5792_NOT_SUPPORTED');
      }
      
      throw new Error(`EIP-5792_FAILED: ${error.message}`);
    }
  }

  formatTokenAmount(amount: bigint, decimals: number): string {
    return formatUnits(amount, decimals);
  }

  parseTokenAmount(amount: string, decimals: number): bigint {
    return parseUnits(amount, decimals);
  }
  
  clearBalanceCache(userAddress?: Address): void {
    if (userAddress) {
      // Clear cache for specific user
      const keysToDelete = Array.from(this.balanceCache.keys())
        .filter(key => key.endsWith(`-${userAddress}`));
      keysToDelete.forEach(key => this.balanceCache.delete(key));
      console.log(`Cleared balance cache for user ${userAddress}`);
    } else {
      // Clear all cache
      this.balanceCache.clear();
      console.log('Cleared all balance cache');
    }
  }
}
