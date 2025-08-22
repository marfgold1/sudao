import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  idlFactory as ammIdlFactory,
  canisterId as ammCanisterId,
} from "declarations/sudao_amm";
import type { _SERVICE as AMMService } from "declarations/sudao_amm/sudao_amm.did";

export interface SwapQuote {
  amountOut: number;
  priceImpact: number;
  fee: number;
}

export interface LiquidityInfo {
  reserve0: number;
  reserve1: number;
  totalSupply: number;
  userBalance: number;
}

export interface TokenInfo {
  token0: string | null;
  token1: string | null;
  feeRate: number;
  isInitialized: boolean;
  swapCount: number;
}

const getAMMActor = async (agent?: HttpAgent): Promise<ActorSubclass<AMMService>> => {
  let httpAgent = agent;
  
  if (!httpAgent) {
    httpAgent = new HttpAgent();
    if (process.env.DFX_NETWORK !== "ic") {
      await httpAgent.fetchRootKey();
    }
  }

  return Actor.createActor<AMMService>(ammIdlFactory, {
    agent: httpAgent,
    canisterId: ammCanisterId,
  });
};

export const getSwapQuote = async (
  tokenInId: string,
  amountIn: number,
  agent?: HttpAgent
): Promise<SwapQuote> => {
  const actor = await getAMMActor(agent);
  const result = await actor.get_swap_quote(
    Principal.fromText(tokenInId),
    BigInt(amountIn)
  );

  if ("ok" in result) {
    const amountOut = Number(result.ok);
    const priceImpact = ((amountIn - amountOut) / amountIn) * 100;
    const fee = amountIn * 0.003; // 0.3% fee

    return {
      amountOut,
      priceImpact,
      fee,
    };
  } else {
    throw new Error(`Quote failed: ${JSON.stringify(result.err)}`);
  }
};

export const executeSwap = async (
  tokenInId: string,
  amountIn: number,
  minAmountOut: number,
  agent?: HttpAgent
): Promise<number> => {
  const actor = await getAMMActor(agent);
  const result = await actor.swap({
    token_in_id: Principal.fromText(tokenInId),
    amount_in: BigInt(amountIn),
    min_amount_out: BigInt(minAmountOut),
  });

  if ("ok" in result) {
    return Number(result.ok);
  } else {
    throw new Error(`Swap failed: ${JSON.stringify(result.err)}`);
  }
};

export const addLiquidity = async (
  amount0: number,
  amount1: number,
  agent?: HttpAgent
): Promise<number> => {
  const actor = await getAMMActor(agent);
  const result = await actor.add_liquidity({
    amount0_desired: BigInt(amount0),
    amount1_desired: BigInt(amount1),
    amount0_min: [],
    amount1_min: [],
  });

  if ("ok" in result) {
    return Number(result.ok);
  } else {
    throw new Error(`Add liquidity failed: ${JSON.stringify(result.err)}`);
  }
};

export const getLiquidityInfo = async (
  user?: string,
  agent?: HttpAgent
): Promise<LiquidityInfo> => {
  const actor = await getAMMActor(agent);
  const userPrincipal = user ? [Principal.fromText(user)] : [];
  const info = await actor.get_liquidity_info(userPrincipal);

  return {
    reserve0: Number(info.reserve0),
    reserve1: Number(info.reserve1),
    totalSupply: Number(info.total_supply),
    userBalance: Number(info.user_balance),
  };
};

export const getTokenInfo = async (agent?: HttpAgent): Promise<TokenInfo> => {
  const actor = await getAMMActor(agent);
  const info = await actor.get_token_info();

  return {
    token0: info.token0?.[0]?.toString() || null,
    token1: info.token1?.[0]?.toString() || null,
    feeRate: Number(info.fee_rate),
    isInitialized: info.is_initialized,
    swapCount: Number(info.swap_count),
  };
};

export const getReserves = async (agent?: HttpAgent): Promise<[number, number]> => {
  const actor = await getAMMActor(agent);
  const reserves = await actor.get_reserves();
  return [Number(reserves[0]), Number(reserves[1])];
};
