import { useState } from 'react';
import { toast } from 'react-toastify';
import { createProposalService } from '../services/proposal';
import { useAgents } from './useAgents';

export const useDAORegistration = () => {
  const { agents } = useAgents();
  const [registering, setRegistering] = useState(false);
  
  const proposalService = createProposalService(agents.proposal);

  const registerDAO = async (
    daoId: string,
    ledgerCanisterId: string,
    ammCanisterId: string,
    daoCanisterId: string
  ): Promise<boolean> => {
    setRegistering(true);
    
    try {
      const success = await proposalService.registerDAO(
        daoId,
        daoCanisterId,
        ledgerCanisterId,
        ammCanisterId
      );
      
      if (success) {
        toast.success('DAO successfully registered with proposal system!');
      } else {
        toast.error('Failed to register DAO with proposal system');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register DAO';
      toast.error(errorMessage);
      return false;
    } finally {
      setRegistering(false);
    }
  };

  return {
    registerDAO,
    registering
  };
};