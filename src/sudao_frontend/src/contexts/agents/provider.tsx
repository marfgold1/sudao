import { useContext, useMemo } from "react";
import { useAgent } from "@nfid/identitykit/react";
import { CanistersContext } from "@/contexts/canisters/context";
import { createActor as createExplorerDaoActor, canisterId as explorerDaoId } from "declarations/sudao_be_explorer";
import { createActor as createDaoBeActor } from "declarations/sudao_backend";
import { createActor as createDaoLedgerActor } from "declarations/sudao_ledger";
import { createActor as createDaoAmmActor } from "declarations/sudao_amm";
import { createActor as createICPActor, canisterId as icpLedgerId } from "declarations/icp_ledger_canister";
import { AgentsContext } from "@/contexts/agents/context";

export const AgentsProvider = ({ children }: { children: React.ReactNode }) => {
    const canisterContext = useContext(CanistersContext);
    const agent = useAgent();
  
    const explorerDao = useMemo(() => {
      return createExplorerDaoActor(explorerDaoId, { agent });
    }, [agent]);
  
    const daoBe = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoBe;
      return canId ? createDaoBeActor(canId, { agent }) : null;
    }, [canisterContext?.canisterIds?.daoBe, agent]);
  
    const daoLedger = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoLedger;
      return canId ? createDaoLedgerActor(canId, { agent }) : null;
    }, [canisterContext?.canisterIds?.daoLedger, agent]);
  
    const daoAmm = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoAmm;
      return canId ? createDaoAmmActor(canId, { agent }) : null;
    }, [canisterContext?.canisterIds?.daoAmm, agent]);

    const icpLedger = useMemo(() => {
      return createICPActor(icpLedgerId, { agent });
    }, [agent]);
  
    return (
      <AgentsContext.Provider value={{ 
        agents: {
          explorerDao,
          daoBe,
          daoLedger,
          daoAmm,
          icpLedger,
        }
       }}>
        {children}
      </AgentsContext.Provider>
    );
  };