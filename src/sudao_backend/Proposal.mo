// src/sudao_backend/Proposal.mo
import Time "mo:base/Time";
import Trie "mo:base/Trie"; 
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import TrieUtils "TrieUtils";

// This module encapsulates all logic and state related to proposals.
// It is designed as a module to be used by a parent canister (e.g., the main DAO canister).
module {

    // --- Types ---
    // These types define the data structures for the proposal system.

    public type ProposalStatus = {
        #active;      // The proposal is currently open for voting.
        #passed;      // The proposal was approved.
        #failed;      // The proposal was rejected.
        #executed;    // The passed proposal's action has been carried out.
    };

    public type Vote = {
        #yes;
        #no;
    };

    public type ProposalError = {
        #proposalNotFound;  // The specified proposal ID does not exist.
        #alreadyVoted;      // The voter has already cast a vote on this proposal.
        #votingPeriodOver;  // The voting period for this proposal has ended.
        #votingStillActive; // The action cannot be performed while voting is active.
        #unauthorized;      // The caller is not authorized to perform this action (e.g., not a member).
    };

    public type Proposal = {
        id : Nat;
        proposer : Principal;
        title : Text;
        description : Text;
        createdAt : Time.Time;
        votingEndTime : Time.Time;
        status : ProposalStatus;
        votesFor : Nat;
        votesAgainst : Nat;
        voters : Trie.Trie<Principal, Vote>;
    };

    // --- State Types ---
    public type ProposalState = {
        proposals : Trie.Trie<Nat, Proposal>;
        nextProposalId : Nat;
    };

    // --- Helper Functions ---
    public func emptyState() : ProposalState {
        {
            proposals = Trie.empty<Nat, Proposal>();
            nextProposalId = 0;
        }
    };

    /**
     * Creates a new proposal.
     */
    public func create(
        state : ProposalState,
        caller : Principal, 
        isMember : (Principal) -> async Bool, 
        title : Text, 
        description : Text, 
        votingDurationSeconds : Nat
    ) : async Result.Result<(ProposalState, Nat), ProposalError> {
        let memberCheck = await isMember(caller);
        if (not memberCheck) {
            return #err(#unauthorized);
        };

        let now = Time.now();
        let newProposal : Proposal = {
            id = state.nextProposalId;
            proposer = caller;
            title = title;
            description = description;
            createdAt = now;
            votingEndTime = now + (votingDurationSeconds * 1_000_000_000); // nanoseconds
            status = #active;
            votesFor = 0;
            votesAgainst = 0;
            voters = Trie.empty<Principal, Vote>();
        };

        let newProposals = TrieUtils.putNat(state.proposals, newProposal.id, newProposal);
        let newState = {
            proposals = newProposals;
            nextProposalId = state.nextProposalId + 1;
        };

        return #ok((newState, newProposal.id));
    };

    /**
     * Casts a vote on an active proposal.
     */
    public func vote(
        state : ProposalState,
        caller : Principal, 
        isMember : (Principal) -> async Bool, 
        proposalId : Nat, 
        choice : Vote
    ) : async Result.Result<ProposalState, ProposalError> {
        let memberCheck = await isMember(caller);
        if (not memberCheck) {
            return #err(#unauthorized);
        };

        switch (TrieUtils.getNat(state.proposals, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (proposal.status != #active) { return #err(#votingPeriodOver); };
                if (Time.now() > proposal.votingEndTime) {
                    // Automatically end the proposal if time is up
                    let finalStatus = if (proposal.votesFor > proposal.votesAgainst) #passed else #failed;
                    let endedProposal = {
                        id = proposal.id;
                        proposer = proposal.proposer;
                        title = proposal.title;
                        description = proposal.description;
                        createdAt = proposal.createdAt;
                        votingEndTime = proposal.votingEndTime;
                        status = finalStatus;
                        votesFor = proposal.votesFor;
                        votesAgainst = proposal.votesAgainst;
                        voters = proposal.voters;
                    };
                    let newProposals = TrieUtils.putNat(state.proposals, proposalId, endedProposal);
                    let _newState = { proposals = newProposals; nextProposalId = state.nextProposalId; };
                    return #err(#votingPeriodOver);
                };
                if (TrieUtils.getPrincipal(proposal.voters, caller) != null) { return #err(#alreadyVoted); };

                let updatedVoters = TrieUtils.putPrincipal(proposal.voters, caller, choice);
                let (newVotesFor, newVotesAgainst) = switch (choice) {
                    case (#yes) { (proposal.votesFor + 1, proposal.votesAgainst) };
                    case (#no) { (proposal.votesFor, proposal.votesAgainst + 1) };
                };

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    createdAt = proposal.createdAt;
                    votingEndTime = proposal.votingEndTime;
                    status = proposal.status;
                    votesFor = newVotesFor;
                    votesAgainst = newVotesAgainst;
                    voters = updatedVoters;
                };

                let newProposals = TrieUtils.putNat(state.proposals, proposalId, updatedProposal);
                let newState = { proposals = newProposals; nextProposalId = state.nextProposalId; };
                return #ok(newState);
            };
        };
    };

    /**
     * Ends a proposal's voting period if the time has expired.
     */
    public func end(state : ProposalState, proposalId : Nat) : Result.Result<(ProposalState, ProposalStatus), ProposalError> {
        switch (TrieUtils.getNat(state.proposals, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (proposal.status != #active) { return #err(#votingPeriodOver); };
                if (Time.now() <= proposal.votingEndTime) { return #err(#votingStillActive); };

                let finalStatus = if (proposal.votesFor > proposal.votesAgainst) {
                    #passed
                } else {
                    #failed
                };

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    createdAt = proposal.createdAt;
                    votingEndTime = proposal.votingEndTime;
                    status = finalStatus;
                    votesFor = proposal.votesFor;
                    votesAgainst = proposal.votesAgainst;
                    voters = proposal.voters;
                };
                let newProposals = TrieUtils.putNat(state.proposals, proposalId, updatedProposal);
                let newState = { proposals = newProposals; nextProposalId = state.nextProposalId; };

                return #ok((newState, finalStatus));
            };
        };
    };

    /**
     * Retrieves a proposal by its ID.
     */
    public func get(state : ProposalState, proposalId : Nat) : ?Proposal {
        return TrieUtils.getNat(state.proposals, proposalId);
    };

    /**
     * Retrieves all proposals.
     */
    public func list(state : ProposalState) : [Proposal] {
        return Trie.toArray(state.proposals, func(_k: Nat, v: Proposal) : Proposal = v);
    };
}; 