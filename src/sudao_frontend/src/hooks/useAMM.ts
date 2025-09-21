import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import type { _SERVICE as AMM } from "declarations/sudao_amm/sudao_amm.did";
import { useAgents } from "@/hooks/useAgents";
import {
  PrincipalOpt,
  PrincipalReq,
  OptRespPromise,
  MakeOpt,
  Resp,
} from "@/utils/converter";

export const useAMM = () => {
  const [tokenInfo, setTokenInfo] = useState<Resp<
    AMM["get_token_info"]
  > | null>(null);
  const [liquidityInfo, setLiquidityInfo] = useState<Resp<
    AMM["get_liquidity_info"]
  > | null>(null);
  const [reserves, setReserves] = useState<Resp<AMM["get_reserves"]> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { agents } = useAgents();

  const daoAmm = agents.daoAmm;
  const checkDaoAmm = useCallback(() => {
    if (!daoAmm) {
      setError("AMM actor not found. Make sure you have set amm canister id.");
      return false;
    }
    return true;
  }, [daoAmm]);

  const fetchAMMData = useCallback(async () => {
    if (!checkDaoAmm()) return;
    setLoading(true);
    setError(null);

    try {
      const [tokens, liquidity, reserves] = await Promise.all([
        daoAmm!.get_token_info(),
        daoAmm!.get_liquidity_info(PrincipalOpt()),
        daoAmm!.get_reserves(),
      ]);
      setTokenInfo(tokens);
      setLiquidityInfo(liquidity);
      setReserves(reserves);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch AMM data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [daoAmm, checkDaoAmm]);

  const handleGetQuote = useCallback(
    async (
      tokenInId: string,
      amountIn: bigint
    ): OptRespPromise<AMM["get_swap_quote"]> => {
      if (!checkDaoAmm()) return null;
      try {
        return await daoAmm!.get_swap_quote(PrincipalReq(tokenInId), amountIn);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get quote";
        toast.error(errorMessage);
      }
    },
    [daoAmm, checkDaoAmm]
  );

  const handleSwap = useCallback(
    async (
      tokenInId: string,
      amountIn: bigint,
      minAmountOut: bigint
    ): OptRespPromise<AMM["swap"]> => {
      if (!checkDaoAmm()) return null;
      try {
        const result = await daoAmm!.swap({
          token_in_id: PrincipalReq(tokenInId),
          amount_in: amountIn,
          min_amount_out: minAmountOut,
        });
        toast.success(`Swap successful! Received ${result} tokens`);
        await fetchAMMData(); // Refresh data
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Swap failed";
        toast.error(errorMessage);
      }
    },
    [daoAmm, checkDaoAmm, fetchAMMData]
  );

  const handleAddLiquidity = useCallback(
    async (
      amount0: bigint,
      amount1: bigint
    ): OptRespPromise<AMM["add_liquidity"]> => {
      if (!checkDaoAmm()) return null;
      try {
        const result = await daoAmm!.add_liquidity({
          amount0_desired: amount0,
          amount1_desired: amount1,
          amount0_min: MakeOpt(),
          amount1_min: MakeOpt(),
        });
        toast.success(`Liquidity added! Received ${result} LP tokens`);
        await fetchAMMData(); // Refresh data
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Add liquidity failed";
        toast.error(errorMessage);
      }
    },
    [daoAmm, checkDaoAmm, fetchAMMData]
  );

  const getHistory = useCallback(async () => {
    if (!checkDaoAmm()) return null;
    try {
      return await daoAmm!.get_transaction_history();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get history";
      toast.error(errorMessage);
    }
  }, [daoAmm, checkDaoAmm]);

  // Remove automatic fetching - let parent component control when to fetch AMM data

  return {
    tokenInfo,
    liquidityInfo,
    reserves,
    loading,
    error,
    handleGetQuote,
    handleSwap,
    handleAddLiquidity,
    getHistory,
    refetch: fetchAMMData,
    fetchAMMData, // Expose for manual fetching
  };
};
