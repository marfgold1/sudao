import { Actor, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { _SERVICE as _SERVICE_ICP_LEDGER } from "declarations/icp_ledger_canister/icp_ledger_canister.did";
import type { _SERVICE as _SERVICE_GOVERNANCE_LEDGER } from "declarations/icrc1_ledger_canister/icrc1_ledger_canister.did";
import {
  idlFactory as idlFactoryICP,
  canisterId as icpCanisterId,
} from "declarations/icp_ledger_canister/index";
import {
  idlFactory as idlFactoryGovernanceLedger,
  canisterId as canisterIdGovernanceLedger,
} from "declarations/sudao_ledger/index";

export interface UserBalances {
  icp: number;
  governance: number;
}

export async function checkUserBalances(
  authenticatedAgent: any,
  userPrincipal: string
): Promise<UserBalances> {
  if (!authenticatedAgent || !userPrincipal) {
    throw new Error("Authenticated agent and user principal required");
  }

  // Create actors
  const actorICP = Actor.createActor<_SERVICE_ICP_LEDGER>(idlFactoryICP, {
    agent: authenticatedAgent,
    canisterId: icpCanisterId,
  });

  const actorGovernanceLedger = Actor.createActor<_SERVICE_GOVERNANCE_LEDGER>(
    idlFactoryGovernanceLedger,
    {
      agent: authenticatedAgent,
      canisterId: canisterIdGovernanceLedger,
    }
  );

  // Fetch balances
  const [icpBalance, governanceBalance] = await Promise.all([
    actorICP.icrc1_balance_of({
      owner: Principal.fromText(userPrincipal),
      subaccount: [] as [],
    }),
    actorGovernanceLedger.icrc1_balance_of({
      owner: Principal.fromText(userPrincipal),
      subaccount: [] as [],
    }),
  ]);

  return {
    icp: Number(icpBalance),
    governance: Number(governanceBalance),
  };
}