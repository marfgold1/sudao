import { useState, useEffect } from 'react';
import { useAgent } from '@nfid/identitykit/react';
import { toast } from 'react-toastify';
import { 
  getSwapQuote, 
  executeSwap, 
  addLiquidity, 
  getLiquidityInfo, 
  getTokenInfo, 
  getReserves,
  type SwapQuote, 
  type LiquidityInfo, 
  type TokenInfo 
} from '../services/amm';

export const useAMM = () => {
  const agent = useAgent();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [liquidityInfo, setLiquidityInfo] = useState<LiquidityInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAMMData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tokens, liquidity] = await Promise.all([
        getTokenInfo(agent || undefined),
        getLiquidityInfo(undefined, agent || undefined)
      ]);
      
      setTokenInfo(tokens);
      setLiquidityInfo(liquidity);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch AMM data';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback data
      setTokenInfo({
        token0: 'ryjl3-tyaaa-aaaaa-aaaba-cai', // ICP
        token1: 'u6s2n-gx777-77774-qaaba-cai', // Governance
        feeRate: 3,
        isInitialized: true,
        swapCount: 42
      });
      setLiquidityInfo({
        reserve0: 100000,
        reserve1: 500000,
        totalSupply: 223606,
        userBalance: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetQuote = async (tokenInId: string, amountIn: number): Promise<SwapQuote | null> => {
    try {
      return await getSwapQuote(tokenInId, amountIn, agent || undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get quote';
      toast.error(errorMessage);
      return null;
    }
  };

  const handleSwap = async (tokenInId: string, amountIn: number, minAmountOut: number): Promise<number | null> => {
    try {
      const result = await executeSwap(tokenInId, amountIn, minAmountOut, agent || undefined);
      toast.success(`Swap successful! Received ${result} tokens`);
      await fetchAMMData(); // Refresh data
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      toast.error(errorMessage);
      return null;
    }
  };

  const handleAddLiquidity = async (amount0: number, amount1: number): Promise<number | null> => {
    try {
      const result = await addLiquidity(amount0, amount1, agent || undefined);
      toast.success(`Liquidity added! Received ${result} LP tokens`);
      await fetchAMMData(); // Refresh data
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Add liquidity failed';
      toast.error(errorMessage);
      return null;
    }
  };

  useEffect(() => {
    fetchAMMData();
  }, [agent]);

  return {
    tokenInfo,
    liquidityInfo,
    loading,
    error,
    handleGetQuote,
    handleSwap,
    handleAddLiquidity,
    refetch: fetchAMMData
  };
};