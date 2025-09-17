import { createContext } from "react";
import type { _SERVICE as ExplorerDao } from "declarations/sudao_be_explorer/sudao_be_explorer.did";
import type { _SERVICE as DaoBe } from "declarations/sudao_backend/sudao_backend.did";
import type { _SERVICE as DaoLedger } from "declarations/sudao_ledger/sudao_ledger.did";
import type { _SERVICE as DaoAmm } from "declarations/sudao_amm/sudao_amm.did";
import type { _SERVICE as ICPLedger } from "declarations/icp_ledger_canister/icp_ledger_canister.did";

type Agents = {
  daoBe: DaoBe | null;
  daoLedger: DaoLedger | null;
  daoAmm: DaoAmm | null;
  explorerDao: ExplorerDao;
  icpLedger: ICPLedger;
};

type AgentsContextType = {
  agents: Agents;
};
export const AgentsContext = createContext<AgentsContextType | undefined>(undefined);
