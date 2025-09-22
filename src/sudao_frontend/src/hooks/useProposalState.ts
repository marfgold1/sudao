import { useState, useEffect } from 'react';
import { useAgents } from './useAgents';
import { handleCertificateError } from '../utils/errorHandler';

export interface ProposalState {
  isRegistered: boolean;
  totalProposals: number;
  activeProposals: number;
  draftProposals: number;
  approvedProposals: number;
  rejectedProposals: number;
  executedProposals: number;
}

export const useProposalState = (daoId: string | null) => {
  const { agents } = useAgents();
  const [proposalState, setProposalState] = useState<ProposalState | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProposalState = async (forceRefresh = false) => {
    if (!daoId || !agents.proposal) return;
    
    setLoading(true);
    try {
      const state = await agents.proposal.getDAOProposalState(daoId);
      setProposalState({
        isRegistered: state.isRegistered,
        totalProposals: Number(state.totalProposals),
        activeProposals: Number(state.activeProposals),
        draftProposals: Number(state.draftProposals),
        approvedProposals: Number(state.approvedProposals),
        rejectedProposals: Number(state.rejectedProposals),
        executedProposals: Number(state.executedProposals),
      });
    } catch (error) {
      console.error('Failed to fetch proposal state:', error);
      setProposalState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposalState();
  }, [daoId, agents.proposal]);

  return {
    proposalState,
    loading,
    refetch: fetchProposalState,
    refreshProposalState: () => fetchProposalState(true),
  };
};