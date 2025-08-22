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

export interface ContributionRequest {
  amount: number;
  contributorName: string;
  daoCanisterId: string;
}

export interface ContributionResult {
  success: boolean;
  transactionId?: string;
  governanceTokensReceived?: number;
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

    return {
      success: true,
      transactionId: approveResult.Ok?.toString(),
      governanceTokensReceived: actualGovernanceTokens,
    };

  } catch (error) {
    console.error('[CONTRIBUTION] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

export const checkUserBalance = async (
  agent: HttpAgent,
  userPrincipal: string
): Promise<{ icp: number; error?: string }> => {
  try {
    if (process.env.DFX_NETWORK !== "ic") {
      await agent.fetchRootKey();
    }

    const icpActor = await createICPActor(agent);
    const balance = await icpActor.icrc1_balance_of({
      owner: Principal.fromText(userPrincipal),
      subaccount: [] as [],
    });

    return { icp: Number(balance) };
  } catch (error) {
    return {
      icp: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};