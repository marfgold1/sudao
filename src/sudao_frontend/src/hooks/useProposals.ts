import { useState, useEffect } from 'react';
import { useAgent } from '@nfid/identitykit/react';
import { toast } from 'react-toastify';
import { 
  listProposals, 
  createProposal, 
  voteOnProposal, 
  publishProposal, 
  addComment,
  type Proposal, 
  type ProposalArgs 
} from '../services/dao';
import { mockProposals } from '../mocks';

export const useProposals = (canisterId: string | null) => {
  const agent = useAgent();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = async () => {
    if (!canisterId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await listProposals(canisterId, agent || undefined);
      setProposals(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch proposals';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback to mock data
      const mockProposalsConverted: Proposal[] = mockProposals.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status as 'Draft' | 'Active' | 'Approved' | 'Rejected' | 'Executed',
        creator: 'mock-creator',
        createdAt: BigInt(Date.now() * 1000000),
        votingEndsAt: BigInt((Date.now() + 7 * 24 * 60 * 60 * 1000) * 1000000),
        yesVotes: Math.floor(p.votes * 0.6),
        noVotes: Math.floor(p.votes * 0.4),
        totalVotingPower: p.votes,
        comments: []
      }));
      setProposals(mockProposalsConverted);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (args: ProposalArgs) => {
    if (!canisterId) {
      toast.error('DAO not ready');
      return;
    }
    
    try {
      const proposalId = await createProposal(canisterId, args, agent || undefined);
      toast.success(`Proposal "${args.title}" created successfully!`);
      await fetchProposals(); // Refresh list
      return proposalId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create proposal';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleVote = async (proposalId: string, choice: 'Yes' | 'No') => {
    if (!canisterId) {
      toast.error('DAO not ready');
      return;
    }
    
    try {
      await voteOnProposal(canisterId, proposalId, choice, agent || undefined);
      toast.success(`Vote cast: ${choice}`);
      await fetchProposals(); // Refresh to show updated vote counts
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handlePublish = async (proposalId: string) => {
    if (!canisterId) {
      toast.error('DAO not ready');
      return;
    }
    
    try {
      await publishProposal(canisterId, proposalId, agent || undefined);
      toast.success('Proposal published successfully!');
      await fetchProposals(); // Refresh to show updated status
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish proposal';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleAddComment = async (proposalId: string, content: string) => {
    if (!canisterId) {
      toast.error('DAO not ready');
      return;
    }
    
    try {
      const commentId = await addComment(canisterId, proposalId, content, agent || undefined);
      toast.success('Comment added successfully!');
      await fetchProposals(); // Refresh to show new comment
      return commentId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [canisterId, agent]);

  return {
    proposals,
    loading,
    error,
    fetchProposals,
    handleCreateProposal,
    handleVote,
    handlePublish,
    handleAddComment
  };
};