import { useState, useEffect } from 'react';
import { createProposalService } from '../services/proposal';
import { useAgents } from './useAgents';

export const useDAORegistrationStatus = (daoId: string | null) => {
  const { agents } = useAgents();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const proposalService = createProposalService(agents.proposal);

  const checkRegistration = async () => {
    if (!daoId) return;
    
    setLoading(true);
    try {
      const registered = await proposalService.isDAORegistered(daoId);
      setIsRegistered(registered);
    } catch (err) {
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkRegistration();
  }, [daoId, agents.proposal]);

  return {
    isRegistered,
    loading,
    checkRegistration
  };
};