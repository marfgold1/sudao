import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import {
  idlFactory as icpIdlFactory,
  canisterId as icpCanisterId,
} from "declarations/icp_ledger_canister";
import {
  idlFactory as ammIdlFactory,
  canisterId as ammCanisterId,
} from "declarations/sudao_amm";
import type { _SERVICE as ICPLedgerService } from "declarations/icp_ledger_canister/icp_ledger_canister.did";
import type { _SERVICE as AMMService } from "declarations/sudao_amm/sudao_amm.did";
import { checkUserBalances, type UserBalances } from "./balance";

export interface ContributionRequest {
  amount: number;
  contributorName: string;
  daoCanisterId: string;
}

export interface ContributionResult {
  success: boolean;
  transactionId?: string;
  governanceTokensReceived?: number;
  balancesAfterSwap?: UserBalances;
  error?: string;
}

const createICPActor = async (agent: HttpAgent): Promise<ActorSubclass<ICPLedgerService>> => {
  return Actor.createActor<ICPLedgerService>(icpIdlFactory, {
    agent,
    canisterId: icpCanisterId,
  });
};

const createAMMActor = async (agent: HttpAgent): Promise<ActorSubclass<AMMService>> => {
  return Actor.createActor<AMMService>(ammIdlFactory, {
    agent,
    canisterId: ammCanisterId,
  });
};

export const makeContribution = async (
  request: ContributionRequest,
  agent: HttpAgent,
  userPrincipal: string
): Promise<ContributionResult> => {
  console.log('[CONTRIBUTION] Starting contribution process:', request);
  
  try {
    // Fetch root key for local development
    if (process.env.DFX_NETWORK !== "ic") {
      await agent.fetchRootKey();
    }

    const icpActor = await createICPActor(agent);
    const ammActor = await createAMMActor(agent);

    // Step 1: Approve AMM to spend ICP
    console.log('[CONTRIBUTION] Step 1: Approving AMM to spend ICP');
    const approveArgs = {
      from_subaccount: [] as [],
      spender: {
        owner: Principal.fromText(ammCanisterId),
        subaccount: [] as [],
      },
      fee: [BigInt(10000)] as [bigint],
      memo: [] as [],
      amount: BigInt(request.amount),
      created_at_time: [BigInt(Date.now() * 1000000)] as [bigint],
      expected_allowance: [0n] as [bigint],
      expires_at: [BigInt((Date.now() + 10000000000000) * 1000000)] as [bigint],
    };

    const approveResult = await icpActor.icrc2_approve(approveArgs);
    console.log('[CONTRIBUTION] Approve result:', approveResult);

    if ('Err' in approveResult) {
      throw new Error(`Approval failed: ${JSON.stringify(approveResult.Err)}`);
    }

    // Step 2: Get swap quote
    console.log('[CONTRIBUTION] Step 2: Getting swap quote');
    const quoteResult = await ammActor.get_swap_quote(
      Principal.fromText(icpCanisterId),
      BigInt(request.amount)
    );

    if (!('ok' in quoteResult)) {
      throw new Error(`Quote failed: ${JSON.stringify(quoteResult.err)}`);
    }

    const governanceTokensExpected = Number(quoteResult.ok);
    console.log('[CONTRIBUTION] Expected governance tokens:', governanceTokensExpected);

    // Step 3: Execute swap (ICP -> Governance tokens)
    console.log('[CONTRIBUTION] Step 3: Executing swap');
    const minAmountOut = Math.floor(governanceTokensExpected * 0.99); // 1% slippage
    const swapArgs = {
      token_in_id: Principal.fromText(icpCanisterId),
      amount_in: BigInt(request.amount),
      min_amount_out: BigInt(minAmountOut),
    };

    const swapResult = await ammActor.swap(swapArgs);
    console.log('[CONTRIBUTION] Swap result:', swapResult);

    if (!('ok' in swapResult)) {
      throw new Error(`Swap failed: ${JSON.stringify(swapResult.err)}`);
    }

    const actualGovernanceTokens = Number(swapResult.ok);

    // Step 4: Check updated balances after swap
    console.log('[CONTRIBUTION] Step 4: Checking balances after swap');
    let balancesAfterSwap: UserBalances | undefined;
    try {
      // Small delay to ensure balance updates are reflected
      await new Promise(resolve => setTimeout(resolve, 1000));
      balancesAfterSwap = await checkUserBalances(agent, userPrincipal);
      console.log('[CONTRIBUTION] Balances after swap:', balancesAfterSwap);
    } catch (balanceError) {
      console.warn('[CONTRIBUTION] Failed to check balances after swap:', balanceError);
    }

    return {
      success: true,
      transactionId: approveResult.Ok?.toString(),
      governanceTokensReceived: actualGovernanceTokens,
      balancesAfterSwap,
    };

  } catch (error) {
    console.error('[CONTRIBUTION] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Standalone function to check balances after any swap operation
export const getBalancesAfterSwap = async (
  agent: HttpAgent,
  userPrincipal: string
): Promise<UserBalances> => {
  return await checkUserBalances(agent, userPrincipal);
};

export const checkUserBalance = async (
  agent: HttpAgent,
  userPrincipal: string
): Promise<{ icp: number; governance?: number; error?: string }> => {
  try {
    const balances = await checkUserBalances(agent, userPrincipal);
    return { 
      icp: balances.icp, 
      governance: balances.governance 
    };
  } catch (error) {
    return {
      icp: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};