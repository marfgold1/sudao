// src/sudao_backend/ProposalExtensions.mo
// Additional utilities for enhanced proposal functionality
import Time "mo:base/Time";
import Map "mo:map/Map";
import { thash } "mo:map/Map";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import ProposalManager "Proposal";

module {
    /**
     * Auto-finalize all expired active proposals.
     */
    public func autoFinalizeExpiredProposals(state : ProposalManager.ProposalState) : [Text] {
        let allProposals = Map.vals(state.proposals) |> Iter.toArray(_);
        let now = Time.now();
        let finalizedIds = Map.new<Text, Bool>();
        
        for (proposal in allProposals.vals()) {
            if (proposal.status == #active and now > proposal.votingDeadline) {
                switch (ProposalManager.finalizeProposal(state, proposal.id)) {
                    case (#ok(_)) {
                        Map.set(finalizedIds, thash, proposal.id, true);
                    };
                    case (#err(_)) {};
                };
            };
        };
        
        Map.keys(finalizedIds) |> Iter.toArray(_)
    };

    /**
     * Get voting statistics for a proposal.
     */
    public func getVotingStats(state : ProposalManager.ProposalState, proposalId : Text) : ?{
        totalVoters : Nat;
        votesFor : Nat;
        votesAgainst : Nat;
        weightedVotesFor : Nat;
        weightedVotesAgainst : Nat;
        participationRate : Nat;
        approvalRate : Nat;
        weightedApprovalRate : Nat;
    } {
        switch (ProposalManager.get(state, proposalId)) {
            case (?proposal) {
                let totalVotes = proposal.votesFor + proposal.votesAgainst;
                let totalWeightedVotes = proposal.weightedVotesFor + proposal.weightedVotesAgainst;
                
                let participationRate = if (proposal.totalEligibleVoters == 0) 0 
                    else (totalVotes * 100) / proposal.totalEligibleVoters;
                let approvalRate = if (totalVotes == 0) 0 
                    else (proposal.votesFor * 100) / totalVotes;
                let weightedApprovalRate = if (totalWeightedVotes == 0) 0 
                    else (proposal.weightedVotesFor * 100) / totalWeightedVotes;
                
                ?{
                    totalVoters = totalVotes;
                    votesFor = proposal.votesFor;
                    votesAgainst = proposal.votesAgainst;
                    weightedVotesFor = proposal.weightedVotesFor;
                    weightedVotesAgainst = proposal.weightedVotesAgainst;
                    participationRate = participationRate;
                    approvalRate = approvalRate;
                    weightedApprovalRate = weightedApprovalRate;
                }
            };
            case null null;
        };
    };

    /**
     * Get proposals that need attention (expired but not finalized).
     */
    public func getProposalsNeedingAttention(state : ProposalManager.ProposalState) : [ProposalManager.Proposal] {
        let allProposals = Map.vals(state.proposals) |> Iter.toArray(_);
        let now = Time.now();
        
        Array.filter<ProposalManager.Proposal>(allProposals, func(proposal) {
            proposal.status == #active and now > proposal.votingDeadline
        })
    };

    /**
     * Get active proposals sorted by deadline (closest first).
     */
    public func getActiveProposalsByDeadline(state : ProposalManager.ProposalState) : [ProposalManager.Proposal] {
        let allProposals = Map.vals(state.proposals) |> Iter.toArray(_);
        let activeProposals = Array.filter<ProposalManager.Proposal>(allProposals, func(p) = p.status == #active);
        
        Array.sort<ProposalManager.Proposal>(activeProposals, func(a, b) {
            if (a.votingDeadline < b.votingDeadline) #less
            else if (a.votingDeadline > b.votingDeadline) #greater
            else #equal
        })
    };
};