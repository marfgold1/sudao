// src/sudao_backend/Proposal.mo
import Time "mo:base/Time";
import Map "mo:map/Map";
import { phash; thash } "mo:map/Map";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import UUIDUtils "UUIDUtils";

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
        #votingJustEnded;   // Voting just ended, state already updated
        #votingStillActive; // The action cannot be performed while voting is active.
        #unauthorized;      // The caller is not authorized to perform this action (e.g., not a member).
        #invalidUUID;       // The provided UUID is invalid.
    };

    public type Proposal = {
        id : Text; // UUID v4
        proposer : Principal;
        title : Text;
        description : Text;
        createdAt : Time.Time;
        votingEndTime : Time.Time;
        status : ProposalStatus;
        votesFor : Nat;
        votesAgainst : Nat;
        voters : [(Principal, Vote)]; // Changed from Map to Array for serializability
    };

    // --- State Types ---
    public type ProposalState = {
        var proposals : Map.Map<Text, Proposal>; // UUID -> Proposal
    };

    // --- Helper Functions ---
    public func emptyState() : ProposalState {
        {
            var proposals = Map.new<Text, Proposal>();
        }
    };

    // Helper function to check if principal already voted
    private func hasVoted(voters : [(Principal, Vote)], principal : Principal) : Bool {
        switch (Array.find<(Principal, Vote)>(voters, func((p, _)) = Principal.equal(p, principal))) {
            case (?_) true;
            case null false;
        }
    };

    // Helper function to add vote
    private func addVote(voters : [(Principal, Vote)], principal : Principal, vote : Vote) : [(Principal, Vote)] {
        Array.append(voters, [(principal, vote)])
    };

    /**
     * Creates a new proposal with UUID v4 ID.
     * Mutates state directly, returns only the proposal ID.
     */
    public func create(
        state : ProposalState,
        caller : Principal, 
        isMember : (Principal) -> async Bool, 
        title : Text, 
        description : Text, 
        votingDurationSeconds : Nat
    ) : async Result.Result<Text, ProposalError> {
        let memberCheck = await isMember(caller);
        if (not memberCheck) {
            return #err(#unauthorized);
        };

        let proposalId = await UUIDUtils.generateUUIDv4();
        let now = Time.now();
        let newProposal : Proposal = {
            id = proposalId;
            proposer = caller;
            title = title;
            description = description;
            createdAt = now;
            votingEndTime = now + (votingDurationSeconds * 1_000_000_000); // nanoseconds
            status = #active;
            votesFor = 0;
            votesAgainst = 0;
            voters = [];
        };

        Map.set(state.proposals, thash, proposalId, newProposal);
        return #ok(proposalId);
    };

    /**
     * Casts a vote on an active proposal.
     * Mutates state directly.
     */
    public func vote(
        state : ProposalState,
        caller : Principal, 
        isMember : (Principal) -> async Bool, 
        proposalId : Text, 
        choice : Vote
    ) : async Result.Result<Bool, ProposalError> {
        let memberCheck = await isMember(caller);
        if (not memberCheck) {
            return #err(#unauthorized);
        };

        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        switch (Map.get(state.proposals, thash, proposalId)) {
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
                    Map.set(state.proposals, thash, proposalId, endedProposal);
                    return #err(#votingJustEnded);
                };
                if (hasVoted(proposal.voters, caller)) { return #err(#alreadyVoted); };

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
                    voters = addVote(proposal.voters, caller, choice);
                };

                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(true);
            };
        };
    };

    /**
     * Ends a proposal's voting period if the time has expired.
     * Mutates state directly.
     */
    public func end(state : ProposalState, proposalId : Text) : Result.Result<ProposalStatus, ProposalError> {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        switch (Map.get(state.proposals, thash, proposalId)) {
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
                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(finalStatus);
            };
        };
    };

    /**
     * Retrieves a proposal by its UUID.
     */
    public func get(state : ProposalState, proposalId : Text) : ?Proposal {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return null;
        };
        return Map.get(state.proposals, thash, proposalId);
    };

    /**
     * Retrieves all proposals.
     */
    public func list(state : ProposalState) : [Proposal] {
        return Map.vals(state.proposals) |> Iter.toArray(_);
    };
}; 