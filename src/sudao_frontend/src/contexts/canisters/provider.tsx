import { useState } from "react";
import { CanistersContext, CanisterIds } from "@/contexts/canisters/context";
import { canisterId as icpLedgerCanId } from "declarations/icp_ledger_canister";
import { canisterId as proposalCanId } from "declarations/sudao_proposal";

export const CanistersProvider = ({ children }: { children: React.ReactNode }) => {
    const [canisterIds, setCanisterIds] = useState<CanisterIds>({
      daoBe: null,
      daoLedger: null,
      daoAmm: null,
      icpLedger: icpLedgerCanId,
      proposal: proposalCanId,
    });
  
    return (
      <CanistersContext.Provider value={{ canisterIds, setCanisterIds }}>
        {children}
      </CanistersContext.Provider>
    );
  };
  