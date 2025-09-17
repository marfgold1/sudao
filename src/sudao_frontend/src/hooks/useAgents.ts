import { useContext } from "react";
import { AgentsContext } from "@/contexts/agents/context";
import { CanistersContext } from "@/contexts/canisters/context";

interface AgentsHook {
    agents: NonNullable<React.ContextType<typeof AgentsContext>>['agents'];
    setCanisterIds: NonNullable<React.ContextType<typeof CanistersContext>>['setCanisterIds'];
    canisterIds: NonNullable<React.ContextType<typeof CanistersContext>>['canisterIds'];
};

export const useAgents = (): AgentsHook => {
  const agentsContext = useContext(AgentsContext);
  const canistersContext = useContext(CanistersContext);

  if (!agentsContext) {
    throw new Error('AgentsContext not found');
  }

  if (!canistersContext) {
    throw new Error('CanistersContext not found');
  }

  return {
    agents: agentsContext.agents,
    setCanisterIds: canistersContext.setCanisterIds,
    canisterIds: canistersContext.canisterIds,
  }
};