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
  
    // Read-only operations use anonymous agent
    const explorerDao = useMemo(() => {
      return createExplorerDaoActor(explorerDaoId, { agent: anonymousAgent });
    }, [anonymousAgent]);
  
    const daoBe = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoBe;
      return canId ? createDaoBeActor(canId, { agent: anonymousAgent }) : null;
    }, [canisterContext?.canisterIds?.daoBe, anonymousAgent]);
  
    const proposal = useMemo(() => {
      return createProposalActor(proposalId, { agent: anonymousAgent });
    }, [anonymousAgent]);

    const daoAmm = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoAmm;
      return canId ? createDaoAmmActor(canId, { agent: anonymousAgent }) : null;
    }, [canisterContext?.canisterIds?.daoAmm, anonymousAgent]);

    // Write operations need authenticated agent
    const daoLedger = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoLedger;
      return canId ? createDaoLedgerActor(canId, { agent }) : null;
    }, [canisterContext?.canisterIds?.daoLedger, agent]);
  
    const daoAmmAuth = useMemo(() => {
      const canId = canisterContext?.canisterIds?.daoAmm;
      return canId ? createDaoAmmActor(canId, { agent }) : null;
    }, [canisterContext?.canisterIds?.daoAmm, agent]);

    const icpLedger = useMemo(() => {
      return createICPActor(icpLedgerId, { agent });
    }, [agent]);

    const proposalAuth = useMemo(() => {
      return createProposalActor(proposalId, { agent });
    }, [agent]);
  
    return (
      <AgentsContext.Provider value={{ 
        agents: {
          explorerDao,
          daoBe,
          daoLedger,
          daoAmm,
          daoAmmAuth,
          icpLedger,
          proposal,
          proposalAuth,
        }
       }}>
        {children}
      </AgentsContext.Provider>
    );
  };