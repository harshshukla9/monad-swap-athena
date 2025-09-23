'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SwapService, type SwapPrice, type SwapQuote } from '@/lib/swap';
import { TOKENS, WMON_TOKEN_ADDRESS, USDC_TESTNET_ADDRESS } from '@/lib/constants';
import { formatUnits, parseUnits } from 'viem';

export default function SwapInterface() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [price, setPrice] = useState<SwapPrice | null>(null);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSellWMON, setIsSellWMON] = useState(true);
  
  // Token balances
  const [wmonBalance, setWmonBalance] = useState<bigint>(BigInt(0));
  const [usdcBalance, setUsdcBalance] = useState<bigint>(BigInt(0));
  
  // Refs to prevent multiple simultaneous calls
  const fetchingPrice = useRef(false);
  const fetchingBalances = useRef(false);
  
  const swapService = publicClient && walletClient 
    ? new SwapService(publicClient, walletClient)
    : null;

  // Fetch token balances
  useEffect(() => {
    if (!swapService || !address) {
      setWmonBalance(BigInt(0));
      setUsdcBalance(BigInt(0));
      return;
    }

    const fetchBalances = async () => {
      if (fetchingBalances.current) return;
      fetchingBalances.current = true;
      
      try {
        const [wmon, usdc] = await Promise.all([
          swapService.getTokenBalance(WMON_TOKEN_ADDRESS, address),
          swapService.getTokenBalance(USDC_TESTNET_ADDRESS, address),
        ]);
        setWmonBalance(wmon);
        setUsdcBalance(usdc);
      } catch (error) {
        console.error('Error fetching balances:', error);
        // Don't reset balances on error, just log it
      } finally {
        fetchingBalances.current = false;
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Update every 30 seconds to reduce RPC load
    return () => clearInterval(interval);
  }, [address, swapService]);

  // Get price when sell amount changes
  useEffect(() => {
    if (!swapService || !sellAmount || parseFloat(sellAmount) <= 0) {
      setPrice(null);
      setBuyAmount('');
      return;
    }

    const fetchPrice = async () => {
      if (fetchingPrice.current) return;
      fetchingPrice.current = true;
      
      setIsLoading(true);
      setError('');
      try {
        const priceData = await swapService.getPrice(
          sellAmount,
          isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS,
          isSellWMON ? USDC_TESTNET_ADDRESS : WMON_TOKEN_ADDRESS,
          isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
        );
        setPrice(priceData);
        setBuyAmount(
          formatUnits(
            BigInt(priceData.buyAmount),
            isSellWMON ? TOKENS.USDC.decimals : TOKENS.WMON.decimals
          )
        );
      } catch (error) {
        console.error('Error fetching price:', error);
        setError('Failed to fetch price. Please try again.');
        setPrice(null);
        setBuyAmount('');
      } finally {
        setIsLoading(false);
        fetchingPrice.current = false;
      }
    };

    const debounceTimer = setTimeout(fetchPrice, 1500); // Increased to 1.5 seconds to reduce RPC load
    return () => clearTimeout(debounceTimer);
  }, [sellAmount, isSellWMON]); // Debounced on amount changes only

  // When wallet client becomes available (swapService created), refresh balances & price once
  useEffect(() => {
    if (!swapService || !address) return;
    // trigger immediate balance refresh
    (async () => {
      try {
        const [wmon, usdc] = await Promise.all([
          swapService.getTokenBalance(WMON_TOKEN_ADDRESS, address),
          swapService.getTokenBalance(USDC_TESTNET_ADDRESS, address),
        ]);
        setWmonBalance(wmon);
        setUsdcBalance(usdc);
      } catch (err) {
        console.error('Error refreshing balances on wallet ready:', err);
      }
    })();

    // fetch price for existing amount if present
    if (sellAmount && parseFloat(sellAmount) > 0) {
      (async () => {
        try {
          const priceData = await swapService.getPrice(
            sellAmount,
            isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS,
            isSellWMON ? USDC_TESTNET_ADDRESS : WMON_TOKEN_ADDRESS,
            isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
          );
          setPrice(priceData);
          setBuyAmount(
            formatUnits(
              BigInt(priceData.buyAmount),
              isSellWMON ? TOKENS.USDC.decimals : TOKENS.WMON.decimals
            )
          );
        } catch (err) {
          console.error('Error refreshing price on wallet ready:', err);
        }
      })();
    }
  }, [swapService, address, isSellWMON]);

  const handleApprove = async () => {
    if (!swapService || !price?.issues.allowance?.spender) return;

    setIsApproving(true);
    setError('');
    try {
      const hash = await swapService.approveToken(
        price.issues.allowance.spender,
        isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS
      );
      console.log('Approval transaction sent:', hash);
      
      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      console.log('Approval transaction confirmed:', receipt);
      
      // Wait a bit more for blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh price to update allowance status - retry up to 3 times
      if (sellAmount) {
        let attempts = 0;
        let priceData;
        
        do {
          attempts++;
          console.log(`Fetching updated price data, attempt ${attempts}`);
          priceData = await swapService.getPrice(
            sellAmount,
            isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS,
            isSellWMON ? USDC_TESTNET_ADDRESS : WMON_TOKEN_ADDRESS,
            isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
          );
          
          // If allowance is still not updated, wait and try again
          if (priceData.issues.allowance?.actual === "0" && attempts < 3) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } while (priceData.issues.allowance?.actual === "0" && attempts < 3);
        
        setPrice(priceData);
        console.log('Updated price data after approval:', priceData);
      }
    } catch (error) {
      console.error('Error approving token:', error);
      setError('Failed to approve token. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!swapService || !address || !sellAmount) return;

    setIsSwapping(true);
    setError('');
    setTxHash('');
    
    try {
      // Validate balance before proceeding
      const sellAmountBigInt = swapService.parseTokenAmount(
        sellAmount,
        isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
      );
      const currentBalance = isSellWMON ? wmonBalance : usdcBalance;
      
      if (sellAmountBigInt > currentBalance) {
        throw new Error(`Insufficient ${isSellWMON ? 'WMON' : 'USDC'} balance. You have ${formatUnits(currentBalance, isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals)} ${isSellWMON ? 'WMON' : 'USDC'}, but trying to swap ${sellAmount} ${isSellWMON ? 'WMON' : 'USDC'}.`);
      }

      // Get fresh quote
      const quoteData = await swapService.getQuote(
        sellAmount,
        address,
        isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS,
        isSellWMON ? USDC_TESTNET_ADDRESS : WMON_TOKEN_ADDRESS,
        isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
      );
      setQuote(quoteData);

      // Check for balance issues in the quote
      if (quoteData.issues?.balance) {
        throw new Error(`Insufficient balance: You have ${formatUnits(BigInt(quoteData.issues.balance.actual), isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals)} ${isSellWMON ? 'WMON' : 'USDC'}, but need ${formatUnits(BigInt(quoteData.issues.balance.expected), isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals)} ${isSellWMON ? 'WMON' : 'USDC'}.`);
      }

      // Try EIP-5792 one-click approve + swap first, with fallback to traditional flow
      let hash: `0x${string}`;
      let usedEip5792 = false;
      
      if (quoteData.issues?.allowance?.spender) {
        console.log('Approval needed. Attempting EIP-5792 batch transaction...');
        
        // Try EIP-5792 first
        try {
          hash = await swapService.approveAndSwapEip5792(
            isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS,
            quoteData.issues.allowance.spender,
            quoteData
          );
          usedEip5792 = true;
          console.log('EIP-5792 batch transaction successful:', hash);
        } catch (eipError: any) {
          console.log('EIP-5792 failed, falling back to traditional approve + swap:', eipError.message);
          
          // Fallback to traditional approve + swap
          console.log('Executing traditional approve transaction...');
          const approveHash = await swapService.approveToken(
            quoteData.issues.allowance.spender,
            isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS
          );
          console.log('Approval transaction hash:', approveHash);
          
          // Wait for approval to be confirmed
          const approveReceipt = await publicClient?.waitForTransactionReceipt({ hash: approveHash });
          console.log('Approval confirmed:', approveReceipt?.status);
          
          if (approveReceipt?.status !== 'success') {
            throw new Error('Approval transaction failed');
          }

          // Wait a bit more for the allowance to be reflected
          await new Promise((r) => setTimeout(r, 2000));
          
          // Get fresh quote after approval
          console.log('Getting fresh quote after approval...');
          const refreshedQuote = await swapService.getQuote(
            sellAmount,
            address,
            isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS,
            isSellWMON ? USDC_TESTNET_ADDRESS : WMON_TOKEN_ADDRESS,
            isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
          );
          
          // Check if allowance issue is resolved
          if (refreshedQuote.issues?.allowance?.spender) {
            throw new Error('Allowance still not sufficient after approval. Please try again.');
          }
          
          console.log('Executing swap transaction...');
          hash = await swapService.executeSwap(refreshedQuote);
        }
      } else {
        console.log('No approval needed, executing swap directly...');
        hash = await swapService.executeSwap(quoteData);
      }
      
      console.log('Swap transaction hash:', hash);
      setTxHash(hash);
      
      // Wait for transaction and refresh balances
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      console.log('Swap transaction receipt:', receipt?.status);
      
      if (receipt?.status !== 'success') {
        throw new Error('Swap transaction failed');
      }
      
      // Reset form
      setSellAmount('');
      setBuyAmount('');
      setPrice(null);
      setQuote(null);
      
      // Clear balance cache and refresh balances after successful transaction
      if (swapService) {
        swapService.clearBalanceCache(address);
        const [wmon, usdc] = await Promise.all([
          swapService.getTokenBalance(WMON_TOKEN_ADDRESS, address),
          swapService.getTokenBalance(USDC_TESTNET_ADDRESS, address),
        ]);
        setWmonBalance(wmon);
        setUsdcBalance(usdc);
      }
      
    } catch (error: any) {
      console.error('Error executing swap:', error);
      setError(error.message || 'Failed to execute swap. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const canSwap = () => {
    if (!isConnected || !sellAmount || !price || isLoading) return false;
    const sellAmountBigInt = parseUnits(
      sellAmount,
      isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
    );
    
    // Check if user has enough balance
    const hasEnoughBalance = isSellWMON
      ? sellAmountBigInt <= wmonBalance
      : sellAmountBigInt <= usdcBalance;
    
    // For allowance, if there was a successful approval, allow swap even if API shows "0"
    // This is a workaround for 0x API delay in reflecting allowance updates
    const hasAllowance = !price.issues.allowance || 
                        (price.issues.allowance && 
                         price.issues.allowance.actual !== "0") ||
                        // Allow if balance is sufficient and there's no other blocking issue
                        (hasEnoughBalance && price.issues.simulationIncomplete === false);
    
    console.log('canSwap check:', {
      isConnected,
      sellAmount,
      hasPrice: !!price,
      isLoading,
      sellAmountBigInt: sellAmountBigInt.toString(),
      wmonBalance: wmonBalance.toString(),
      hasEnoughBalance,
      hasAllowance,
      allowanceData: price.issues.allowance,
      balanceIssue: price.issues.balance
    });
    
    return hasEnoughBalance && hasAllowance;
  };

  const needsApproval = () => {
    const needs = price?.issues.allowance !== null && 
                  price?.issues.allowance?.actual === "0";
    console.log('needsApproval check:', {
      allowanceExists: price?.issues.allowance !== null,
      actualValue: price?.issues.allowance?.actual,
      needsApproval: needs
    });
    return needs;
  };


  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Swap Tokens</h2>
        <p className="text-gray-600 mt-1">Exchange WMON for USDC on Monad Testnet</p>
      </div>

      {!isConnected ? (
        <div className="text-center">
          <ConnectButton />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Balances */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">WMON Balance</p>
              <p className="font-semibold text-gray-900">
                {formatUnits(wmonBalance, TOKENS.WMON.decimals).slice(0, 8)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">USDC Balance</p>
              <p className="font-semibold text-gray-900">
                {formatUnits(usdcBalance, TOKENS.USDC.decimals).slice(0, 8)}
              </p>
            </div>
          </div>

          {/* Sell Input */}
          <div className="space-y-2 text-black">
            <label className="block text-sm font-medium text-gray-700">
              You Pay
            </label>
            <div className="relative">
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.0"
                className="w-full p-4 pr-24 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.01"
                min="0"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <button
                  onClick={() => {
                    const maxAmount = formatUnits(
                      isSellWMON ? wmonBalance : usdcBalance,
                      isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
                    );
                    setSellAmount(maxAmount);
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  MAX
                </button>
                <span className="text-gray-600 font-medium">{isSellWMON ? 'WMON' : 'USDC'}</span>
              </div>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div
              className="p-2 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200"
              onClick={() => {
                setIsSellWMON((v) => !v);
                setSellAmount('');
                setBuyAmount('');
                setPrice(null);
              }}
              title="Switch direction"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Buy Output */}
          <div className="space-y-2 text-black">
            <label className="block text-sm font-medium text-gray-700">
              You Receive
            </label>
            <div className="relative">
              <input
                type="text"
                value={buyAmount}
                readOnly
                placeholder="0.0"
                className="w-full p-4 pr-20 text-lg border border-gray-300 rounded-lg bg-gray-50"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-600 font-medium">{isSellWMON ? 'USDC' : 'WMON'}</span>
              </div>
            </div>
          </div>

          {/* Price Info */}
          {price && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {isSellWMON
                  ? `Rate: 1 WMON = ${(parseFloat(buyAmount) / parseFloat(sellAmount) || 0).toFixed(6)} USDC`
                  : `Rate: 1 USDC = ${(parseFloat(buyAmount) / parseFloat(sellAmount) || 0).toFixed(6)} WMON`}
              </p>
              {/* Debug info */}
              <div className="mt-2 text-xs text-gray-600">
                <p>Allowance Status: {price.issues.allowance ? `actual: ${price.issues.allowance.actual}` : 'null'}</p>
                {/* {price.issues.balance && (
                  <p className="text-red-600">
                    Balance Issue: Have {formatUnits(
                      BigInt(price.issues.balance.actual),
                      isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
                    )} {isSellWMON ? 'WMON' : 'USDC'}, 
                    need {formatUnits(
                      BigInt(price.issues.balance.expected),
                      isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
                    )} {isSellWMON ? 'WMON' : 'USDC'}
                  </p>
                )} */}
                <button 
                  onClick={async () => {
                    if (swapService && sellAmount) {
                      const newPrice = await swapService.getPrice(
                        sellAmount,
                        isSellWMON ? WMON_TOKEN_ADDRESS : USDC_TESTNET_ADDRESS,
                        isSellWMON ? USDC_TESTNET_ADDRESS : WMON_TOKEN_ADDRESS,
                        isSellWMON ? TOKENS.WMON.decimals : TOKENS.USDC.decimals
                      );
                      setPrice(newPrice);
                      console.log('Manual refresh - new price:', newPrice);
                    }
                  }}
                  className="mt-1 text-blue-600 underline hover:text-blue-800"
                >
                  Refresh Quote
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Single Action Button */}
          <div className="space-y-3">
            <button
              onClick={handleSwap}
              disabled={!canSwap() || isSwapping}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isSwapping ? 'Swapping...' : isLoading ? 'Loading...' : 'Swap Tokens'}
            </button>
            {needsApproval() && (
              <p className="text-xs text-gray-500 text-center">
                🚀 Will attempt EIP-5792 one-click approve + swap (fallback to 2-step if unsupported)
              </p>
            )}
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                Transaction successful! 
                <a 
                  href={`https://testnet.monadscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:text-green-900"
                >
                  View on MonadScan
                </a>
              </p>
            </div>
          )}

          {/* Wallet Connection */}
          <div className="pt-4 border-t border-gray-200">
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  );
}
