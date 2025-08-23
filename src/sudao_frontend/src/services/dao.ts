import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { 
  idlFactory as daoIdlFactory
} from "declarations/sudao_backend";
import type { _SERVICE as DAOService } from "declarations/sudao_backend/sudao_backend.did";

export interface DAOInfo {
  name: string;
  description: string;
  tags: string[];
  creator: string;
  createdAt: bigint;
}

export interface UserProfile {
  principal: string;
  firstRegistered: bigint;
}

export interface ProposalArgs {
  title: string;
  description: string;
  votingDurationSeconds: number;
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
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: bigint;
  reactions: Reaction[];
}

export interface Reaction {
  reactionType: 'Like' | 'Dislike' | 'Heart' | 'Laugh';
  author: string;
}

export type VoteChoice = { Yes: null } | { No: null };

export const getDAOActor = async (canisterId: string, agent?: HttpAgent): Promise<ActorSubclass<DAOService>> => {
  console.log('[DAO] Creating DAO actor with canisterId:', canisterId);
  console.log('[DAO] Agent provided:', !!agent);
  
  let httpAgent = agent;
  
  if (!httpAgent) {
    console.log('[DAO] No agent provided, creating new HttpAgent');
    httpAgent = new HttpAgent();
    if (process.env.DFX_NETWORK !== "ic") {
      console.log('[DAO] Fetching root key for local development');
      await httpAgent.fetchRootKey();
    }
  }
  
  const actor = Actor.createActor<DAOService>(daoIdlFactory, {
    agent: httpAgent,
    canisterId,
  });
  
  console.log('[DAO] Actor created successfully for canister:', canisterId);
  return actor;
};

export const getDAOInfo = async (canisterId: string): Promise<DAOInfo | null> => {
  console.log('[DAO] getDAOInfo called for canister:', canisterId, '(unauthenticated)');
  
  try {
    const actor = await getDAOActor(canisterId); // Always use unauthenticated agent
    console.log('[DAO] Calling getDAOInfo on canister:', canisterId);
    
    const result = await actor.getDAOInfo();
    console.log('[DAO] getDAOInfo result:', result);
  
    if (!result || result.length === 0) {
      console.log('[DAO] getDAOInfo: No result returned');
      return null;
    }
    
    const info = result[0];
    const mappedInfo = {
      name: info.name,
      description: info.description,
      tags: info.tags,
      creator: info.creator.toString(),
      createdAt: info.createdAt,
    };
    
    console.log('[DAO] getDAOInfo mapped result:', mappedInfo);
    return mappedInfo;
  } catch (error) {
    console.error('[DAO] getDAOInfo error:', error);
    throw error;
  }
};

export const registerUser = async (canisterId: string, agent?: HttpAgent): Promise<string> => {
  console.log('[DAO] registerUser called for canister:', canisterId);
  
  if (!agent) {
    throw new Error('Authentication required for registration');
  }
  
  try {
    const actor = await getDAOActor(canisterId, agent);
    console.log('[DAO] Calling register on canister:', canisterId);
    
    const result = await actor.register();
    console.log('[DAO] register result:', result);
    return result;
  } catch (error) {
    console.error('[DAO] registerUser error:', error);
    throw error;
  }
};

export const getUserProfile = async (canisterId: string, agent?: HttpAgent): Promise<UserProfile | null> => {
  console.log('[DAO] getUserProfile called for canister:', canisterId);
  
  try {
    const actor = await getDAOActor(canisterId, agent);
    console.log('[DAO] Calling getMyProfile on canister:', canisterId);
    
    const result = await actor.getMyProfile();
    console.log('[DAO] getMyProfile result:', result);
  
    if (!result || result.length === 0) {
      console.log('[DAO] getUserProfile: No profile found');
      return null;
    }
    
    const profile = result[0];
    const mappedProfile = {
      principal: profile.principal.toString(),
      firstRegistered: profile.firstRegistered,
    };
    
    console.log('[DAO] getUserProfile mapped result:', mappedProfile);
    return mappedProfile;
  } catch (error) {
    console.error('[DAO] getUserProfile error:', error);
    
    // If signer error and we have an authenticated agent, try without agent
    if (error instanceof Error && error.message.includes('signer') && agent) {
      console.log('[DAO] Retrying getUserProfile without authenticated agent');
      try {
        return await getUserProfile(canisterId); // Retry without agent
      } catch (retryError) {
        console.error('[DAO] Retry also failed:', retryError);
      }
    }
    
    throw error;
  }
};

export const createProposal = async (canisterId: string, args: ProposalArgs, agent?: HttpAgent): Promise<string> => {
  const actor = await getDAOActor(canisterId, agent);
  const result = await actor.createProposal(args.title, args.description, BigInt(args.votingDurationSeconds));
  
  if ('ok' in result) {
    return result.ok;
  } else {
    throw new Error(`Failed to create proposal: ${JSON.stringify(result.err)}`);
  }
};

export const listProposals = async (canisterId: string, agent?: HttpAgent): Promise<Proposal[]> => {
  console.log('[DAO] listProposals called for canister:', canisterId);
  
  try {
    const actor = await getDAOActor(canisterId, agent);
    console.log('[DAO] Calling listProposals on canister:', canisterId);
    
    const proposals = await actor.listProposals();
    console.log('[DAO] listProposals result:', proposals);
  
    const mappedProposals = proposals.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: Object.keys(p.status)[0] as 'Draft' | 'Active' | 'Approved' | 'Rejected' | 'Executed',
      creator: p.creator.toString(),
      createdAt: p.createdAt,
      votingEndsAt: p.votingEndsAt,
      yesVotes: Number(p.yesVotes),
      noVotes: Number(p.noVotes),
      totalVotingPower: Number(p.totalVotingPower),
      comments: p.comments.map(c => ({
        id: c.id,
        author: c.author.toString(),
        content: c.content,
        createdAt: c.createdAt,
        reactions: c.reactions.map(r => ({
          reactionType: Object.keys(r.reactionType)[0] as 'Like' | 'Dislike' | 'Heart' | 'Laugh',
          author: r.author.toString()
        }))
      }))
    }));
    
    console.log('[DAO] listProposals mapped result:', mappedProposals);
    return mappedProposals;
  } catch (error) {
    console.error('[DAO] listProposals error:', error);
    
    // If signer error and we have an authenticated agent, try without agent
    if (error instanceof Error && error.message.includes('signer') && agent) {
      console.log('[DAO] Retrying listProposals without authenticated agent');
      try {
        return await listProposals(canisterId); // Retry without agent
      } catch (retryError) {
        console.error('[DAO] Retry also failed:', retryError);
      }
    }
    
    throw error;
  }
};

export const voteOnProposal = async (canisterId: string, proposalId: string, choice: 'Yes' | 'No', agent?: HttpAgent): Promise<void> => {
  const actor = await getDAOActor(canisterId, agent);
  const voteChoice = choice === 'Yes' ? { Yes: null } : { No: null };
  const result = await actor.voteOnProposal(proposalId, voteChoice);
  
  if ('err' in result) {
    throw new Error(`Failed to vote: ${JSON.stringify(result.err)}`);
  }
};

export const publishProposal = async (canisterId: string, proposalId: string, agent?: HttpAgent): Promise<void> => {
  const actor = await getDAOActor(canisterId, agent);
  const result = await actor.publishProposal(proposalId);
  
  if ('err' in result) {
    throw new Error(`Failed to publish proposal: ${JSON.stringify(result.err)}`);
  }
};

export const addComment = async (canisterId: string, proposalId: string, content: string, agent?: HttpAgent): Promise<string> => {
  const actor = await getDAOActor(canisterId, agent);
  const result = await actor.addComment(proposalId, content);
  
  if ('ok' in result) {
    return result.ok;
  } else {
    throw new Error(`Failed to add comment: ${JSON.stringify(result.err)}`);
  }
};

export const getTreasuryBalance = async (canisterId: string, agent?: HttpAgent) => {
  const actor = await getDAOActor(canisterId, agent);
  return await actor.getTreasuryBalance();
};

export const getTransactionHistory = async (canisterId: string, agent?: HttpAgent) => {
  const actor = await getDAOActor(canisterId, agent);
  return await actor.getTransactionHistory();
};

export const getProposalStats = async (canisterId: string, agent?: HttpAgent) => {
  const actor = await getDAOActor(canisterId, agent);
  return await actor.getProposalStats();
};