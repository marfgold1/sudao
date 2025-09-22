import { createContext } from "react";
import type { _SERVICE as ExplorerDao } from "declarations/sudao_be_explorer/sudao_be_explorer.did";
import type { _SERVICE as DaoBe } from "declarations/sudao_backend/sudao_backend.did";
import type { _SERVICE as DaoLedger } from "declarations/sudao_ledger/sudao_ledger.did";
import type { _SERVICE as DaoAmm } from "declarations/sudao_amm/sudao_amm.did";
import type { _SERVICE as ICPLedger } from "declarations/icp_ledger_canister/icp_ledger_canister.did";
import type { _SERVICE as Proposal } from "declarations/sudao_proposal/sudao_proposal.did";

type Agents = {
  daoBe: DaoBe | null;
  daoLedger: DaoLedger | null;
  daoLedgerAuth: DaoLedger | null;
  daoAmm: DaoAmm | null;
  daoAmmAuth: DaoAmm | null;
  explorerDao: ExplorerDao;
  icpLedger: ICPLedger;
  icpLedgerAuth: ICPLedger;
  proposal: Proposal;
  proposalAuth: Proposal;
};

type AgentsContextType = {
  agents: Agents;
};
export const AgentsContext = createContext<AgentsContextType | undefined>(undefined);
