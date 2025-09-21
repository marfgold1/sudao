import { useContext, useMemo } from "react";
import { useAgent } from "@nfid/identitykit/react";
import { HttpAgent } from "@dfinity/agent";
import { CanistersContext } from "@/contexts/canisters/context";
import { createActor as createExplorerDaoActor, canisterId as explorerDaoId } from "declarations/sudao_be_explorer";
import { createActor as createDaoBeActor } from "declarations/sudao_backend";
import { createActor as createDaoLedgerActor } from "declarations/sudao_ledger";
import { createActor as createDaoAmmActor } from "declarations/sudao_amm";
import { createActor as createICPActor, canisterId as icpLedgerId } from "declarations/icp_ledger_canister";
import { createActor as createProposalActor, canisterId as proposalId } from "declarations/sudao_proposal";
import { AgentsContext } from "@/contexts/agents/context";

export const AgentsProvider = ({ children }: { children: React.ReactNode }) => {
    const canisterContext = useContext(CanistersContext);
    const agent = useAgent();
    
    const anonymousAgent = useMemo(() => {
      return new HttpAgent({ host: process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app" });
    }, []);
  
    const explorerDao = useMemo(() => {
      return createExplorerDaoActor(explorerDaoId, { agent: anonymousAgent });
    }, [anonymousAgent]);
  
    const daoBe = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoBe;
      return canId ? createDaoBeActor(canId, { agent: anonymousAgent }) : null;
    }, [canisterContext?.canisterIds?.daoBe, anonymousAgent]);
  
    const daoLedger = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoLedger;
      return canId ? createDaoLedgerActor(canId, { agent: anonymousAgent }) : null;
    }, [canisterContext?.canisterIds?.daoLedger, anonymousAgent]);
  
    const daoAmm = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoAmm;
      return canId ? createDaoAmmActor(canId, { agent: anonymousAgent }) : null;
    }, [canisterContext?.canisterIds?.daoAmm, anonymousAgent]);

    const icpLedger = useMemo(() => {
      return createICPActor(icpLedgerId, { agent: anonymousAgent });
    }, [anonymousAgent]);

    const proposal = useMemo(() => {
      return createProposalActor(proposalId, { agent: anonymousAgent });
    }, [anonymousAgent]);
  
    return (
      <AgentsContext.Provider value={{ 
        agents: {
          explorerDao,
          daoBe,
          daoLedger,
          daoAmm,
          icpLedger,
          proposal,
        }
       }}>
        {children}
      </AgentsContext.Provider>
    );
  };