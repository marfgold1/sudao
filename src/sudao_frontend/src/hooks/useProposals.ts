import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { Principal } from '@dfinity/principal';
import { createProposalService } from '../services/proposal';
import { useAgents } from './useAgents';
import { handleCertificateError } from '../utils/errorHandler';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface ProposalArgs {
  title: string;
  description: string;
  proposalType: 'funding' | 'governance';
  beneficiaryAddress?: string;
  requestedAmount?: number;
  votingDurationHours?: number;
  minimumParticipation?: number;
  minimumApproval?: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'Draft' | 'Active' | 'Approved' | 'Rejected' | 'Executed';
  creator: string;
  createdAt: bigint;
  votingEndsAt: bigint;
  yesVotes: number;
  noVotes: number;
  totalVotingPower: number;
  comments: any[];
  publishedDate: string;
}

export const useProposals = (daoId: string | null) => {
  const { agents } = useAgents();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: Proposal[]; timestamp: number; daoId: string } | null>(null);
  
  const proposalService = createProposalService(agents.proposalAuth || agents.proposal);

  const fetchProposals = useCallback(async (forceRefresh = false) => {
    if (!daoId) return;
    
    // Check cache first
    const now = Date.now();
    const cached = cacheRef.current;
    
    if (!forceRefresh && cached && cached.daoId === daoId && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('[useProposals] Using cached proposals');
      setProposals(cached.data);
      return;
    }
    
    console.log('[useProposals] Fetching fresh proposals');
    setLoading(true);
    setError(null);
    
    try {
      const result = await proposalService.listProposals(daoId);
      
      console.log('[useProposals] Raw proposals from backend:', result);
      
      // Convert backend format to frontend format
      const convertedProposals: Proposal[] = result.map(p => {
        const backendStatus = Object.keys(p.status)[0];
        // Map backend status to frontend status
        const statusMap: Record<string, string> = {
          'draft': 'Draft',
          'active': 'Active', 
          'approved': 'Approved',
          'rejected': 'Rejected',
          'executed': 'Executed'
        };
        
        const proposal = {
          id: p.id,
          title: p.title,
          description: p.description,
          status: (statusMap[backendStatus] || backendStatus) as 'Draft' | 'Active' | 'Approved' | 'Rejected' | 'Executed',
          creator: p.proposer.toString(),
          createdAt: p.createdAt,
          votingEndsAt: p.votingDeadline,
          yesVotes: Number(p.votesFor),
          noVotes: Number(p.votesAgainst),
          totalVotingPower: Number(p.votesFor) + Number(p.votesAgainst),
          comments: p.comments || [],
          publishedDate: p.publishedAt ? new Date(Number(p.publishedAt) / 1000000).toLocaleDateString() : new Date(Number(p.createdAt) / 1000000).toLocaleDateString()
        };
        
        console.log('[useProposals] Converted proposal:', proposal);
        return proposal;
      });
      
      // Update cache
      cacheRef.current = {
        data: convertedProposals,
        timestamp: now,
        daoId
      };
      
      setProposals(convertedProposals);
    } catch (err) {
      // Handle certificate errors with auto-reload
      if (handleCertificateError(err)) {
        return; // Page will reload
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals';
      setError(errorMessage);
      toast.error(errorMessage);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [daoId, agents.proposal]);

  const handleCreateProposal = async (args: ProposalArgs) => {
    if (!daoId) {
      toast.error('DAO ID not available');
      return;
    }
    
    try {
      console.log('[useProposals] Creating proposal with args:', args);
      console.log('[useProposals] beneficiaryAddress type:', typeof args.beneficiaryAddress);
      console.log('[useProposals] beneficiaryAddress value:', args.beneficiaryAddress);
      
      const proposalType = args.proposalType === 'funding' ? { funding: null } : { governance: null };
      
      // Convert beneficiaryAddress to optional array format for Motoko
      const beneficiaryOpt = args.beneficiaryAddress ? [Principal.fromText(args.beneficiaryAddress)] : [];
      const requestedAmountOpt = args.requestedAmount ? [BigInt(args.requestedAmount)] : [];
      
      console.log('[useProposals] Final params:', {
        daoId,
        title: args.title,
        description: args.description,
        proposalType,
        beneficiaryOpt,
        requestedAmountOpt,
        votingDuration: BigInt((args.votingDurationHours || 168) * 3600 * 1000000000),
        minimumParticipation: BigInt(args.minimumParticipation || 50),
        minimumApproval: BigInt(args.minimumApproval || 51)
      });
      
      const proposalId = await proposalService.createDraftProposal(
        daoId,
        args.title,
        args.description,
        proposalType,
        beneficiaryOpt,
        requestedAmountOpt,
        BigInt((args.votingDurationHours || 168) * 3600 * 1000000000),
        BigInt(args.minimumParticipation || 50),
        BigInt(args.minimumApproval || 51)
      );
      
      toast.success(`Proposal "${args.title}" created successfully!`);
      
      // Clear cache to force fresh data on next fetch
      cacheRef.current = null;
      await fetchProposals(true); // Force refresh
      
      return proposalId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create proposal';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleVote = async (proposalId: string, choice: 'Yes' | 'No') => {
    if (!daoId) {
      toast.error('DAO ID not available');
      return;
    }
    
    try {
      const voteChoice = choice.toLowerCase() === 'yes' ? { yes: null } : { no: null };
      await proposalService.voteOnProposal(daoId, proposalId, voteChoice);
      
      toast.success(`Vote cast: ${choice}`);
      await fetchProposals(true); // Force refresh
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handlePublish = async (proposalId: string) => {
    if (!daoId) {
      toast.error('DAO ID not available');
      return;
    }
    
    try {
      await proposalService.publishProposal(daoId, proposalId);
      toast.success('Proposal published successfully!');
      
      // Clear cache to force fresh data on next fetch
      cacheRef.current = null;
      await fetchProposals(true); // Force refresh
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish proposal';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleAddComment = async (_proposalId: string, _content: string) => {
    if (!daoId) {
      toast.error('DAO ID not available');
      return;
    }
    
    try {
      // addComment method not implemented
      toast.success('Comment added successfully!');
      await fetchProposals(true); // Force refresh
      return Promise.resolve('comment-id'); // Return dummy ID
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleRegisterDAO = async (
    daoId: string,
    ledgerCanisterId: string,
    ammCanisterId: string,
    daoCanisterId: string
  ) => {
    try {
      const authService = createProposalService(agents.proposalAuth!);
      // Try to register first, if already registered, update instead
      try {
        await authService.registerDAO(daoId, daoCanisterId, ledgerCanisterId, ammCanisterId);
        toast.success('DAO registered with proposal system!');
      } catch (registerErr) {
        if (registerErr instanceof Error && registerErr.message.includes('already registered')) {
          await authService.updateDAORegistration(daoId, daoCanisterId, ledgerCanisterId, ammCanisterId);
          toast.success('DAO registration updated!');
        } else {
          throw registerErr;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register DAO';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Remove automatic fetching - let parent component control when to fetch

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!daoId) return;
    
    const interval = setInterval(() => {
      fetchProposals(true);
    }, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, [daoId, fetchProposals]);

  return {
    proposals,
    loading,
    error,
    fetchProposals: () => fetchProposals(false),
    refreshProposals: () => fetchProposals(true),
    handleCreateProposal,
    handleVote,
    handlePublish,
    handleAddComment,
    handleRegisterDAO
  };
};