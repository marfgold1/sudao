import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { idlFactory as daoIdlFactory } from "declarations/sudao_backend";
import type { _SERVICE as DAOService } from "declarations/sudao_backend/sudao_backend.did";

export interface TreasuryBalance {
  icp: number;
  governance: number;
}

export interface TransactionRecord {
  id: string;
  amount: number;
  transactionType: "Deposit" | "Withdrawal" | "ProposalExecution";
  from: string;
  to: string;
  timestamp: bigint;
  description: string;
}

const getDAOActor = async (
  canisterId: string,
  agent?: HttpAgent
): Promise<ActorSubclass<DAOService>> => {
  let httpAgent = agent;
  
  if (!httpAgent) {
    httpAgent = new HttpAgent();
    if (process.env.DFX_NETWORK !== "ic") {
      await httpAgent.fetchRootKey();
    }
  }

  return Actor.createActor<DAOService>(daoIdlFactory, {
    agent: httpAgent,
    canisterId,
  });
};

export const getTreasuryBalance = async (
  canisterId: string,
  agent?: HttpAgent
): Promise<TreasuryBalance> => {
  const actor = await getDAOActor(canisterId, agent);
  const balance = await actor.getTreasuryBalance();

  return {
    icp: Number(balance.icp),
    governance: Number(balance.governance),
  };
};

export const getTransactionHistory = async (
  canisterId: string,
  agent?: HttpAgent
): Promise<TransactionRecord[]> => {
  const actor = await getDAOActor(canisterId, agent);
  const history = await actor.getTransactionHistory();

  return history.map((tx) => ({
    id: tx.id,
    amount: Number(tx.amount),
    transactionType: Object.keys(tx.transactionType)[0] as
      | "Deposit"
      | "Withdrawal"
      | "ProposalExecution",
    from: tx.from.toString(),
    to: tx.to.toString(),
    timestamp: tx.timestamp,
    description: tx.description,
  }));
};

export const depositFromSwap = async (
  canisterId: string,
  amount: number,
  swapCanister: string,
  agent?: HttpAgent
): Promise<string> => {
  const actor = await getDAOActor(canisterId, agent);
  const result = await actor.depositFromSwap(
    BigInt(amount),
    Principal.fromText(swapCanister)
  );

  if ("ok" in result) {
    return result.ok;
  } else {
    throw new Error(`Deposit failed: ${result.err}`);
  }
};
