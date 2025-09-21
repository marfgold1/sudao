import { Principal } from '@dfinity/principal';
import { _SERVICE } from 'declarations/sudao_proposal/sudao_proposal.did';

class ProposalService {
  constructor(private actor: _SERVICE) {}

  async registerDAO(daoId: string, daoCanisterId: string, ledgerCanisterId: string, ammCanisterId: string) {
    const result = await this.actor.registerDAO(
      daoId,
      Principal.fromText(daoCanisterId),
      Principal.fromText(ledgerCanisterId),
      Principal.fromText(ammCanisterId)
    );
    return 'ok' in result ? result.ok : false;
  }

  async listProposals(daoId: string) {
    return this.actor.listProposals(daoId);
  }

  async getProposal(daoId: string, proposalId: string) {
    return this.actor.getProposal(daoId, proposalId);
  }

  async createDraftProposal(
    daoId: string,
    title: string,
    description: string,
    proposalType: any,
    beneficiaryAddress?: Principal,
    requestedAmount?: bigint,
    votingDuration: bigint = BigInt(7 * 24 * 60 * 60 * 1000000000),
    minimumParticipation: bigint = BigInt(10),
    minimumApproval: bigint = BigInt(51)
  ) {
    const result = await this.actor.createDraftProposal(
      daoId,
      title,
      description,
      proposalType,
      beneficiaryAddress,
      requestedAmount,
      votingDuration,
      minimumParticipation,
      minimumApproval
    );
    return 'ok' in result ? result.ok : null;
  }

  async publishProposal(daoId: string, proposalId: string) {
    const result = await this.actor.publishProposal(daoId, proposalId);
    return 'ok' in result ? result.ok : false;
  }

  async voteOnProposal(daoId: string, proposalId: string, vote: any) {
    const result = await this.actor.voteOnProposal(daoId, proposalId, vote);
    return 'ok' in result ? result.ok : false;
  }

  async getDAOInfo(daoId: string) {
    return this.actor.getDAOInfo(daoId);
  }

  async isDAORegistered(daoId: string) {
    return this.actor.isDAORegistered(daoId);
  }
}

export const createProposalService = (actor: _SERVICE) => new ProposalService(actor);

