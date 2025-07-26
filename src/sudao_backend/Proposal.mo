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
    
    public type ProposalStatus = {
        #draft;       // Draft proposal, not yet published
        #active;      // Active proposal, open for voting
        #approved;    // Proposal was approved
        #rejected;    // Proposal was rejected
        #executed;    // Approved proposal has been executed
    };

    public type ProposalType = {
        #funding;     // Proposal requesting funds
        #governance;  // Governance/policy proposal (not funding related)
    };

    public type Vote = {
        #yes;
        #no;
    };

    public type VoteRecord = {
        voter : Principal;
        choice : Vote;
        weight : Nat; // Token balance at time of voting
    };

    public type ReactionType = {
        #like;
        #fire;
        #heart;
        #thumbsUp;
        #clap;
    };

    public type Comment = {
        id : Text; // UUID
        author : Principal;
        content : Text;
        createdAt : Time.Time;
        reactions : [(ReactionType, Nat)]; // Array of (reactionType, count)
        reactors : [(ReactionType, [Principal])]; // Who reacted with what
    };

    public type ProposalError = {
        #proposalNotFound;
        #alreadyVoted;
        #votingPeriodOver;
        #votingJustEnded;
        #votingStillActive;
        #unauthorized;
        #invalidUUID;
        #proposalNotActive;
        #insufficientParticipation;
        #commentNotFound;
        #alreadyReacted;
    };

    public type Proposal = {
        id : Text; // UUID v4
        proposer : Principal;
        title : Text;
        description : Text;
        proposalType : ProposalType;
        beneficiaryAddress : ?Principal; // Optional, only for funding proposals
        requestedAmount : ?Nat; // Optional, only for funding proposals (in e8s or tokens)
        createdAt : Time.Time;
        publishedAt : ?Time.Time; // When moved from draft to active
        votingDeadline : Time.Time;
        status : ProposalStatus;
        
        // Voting parameters
        minimumParticipation : Nat; // Percentage (0-100)
        minimumApproval : Nat; // Percentage (0-100)
        
        // Voting results
        votesFor : Nat;
        votesAgainst : Nat;
        weightedVotesFor : Nat; // Weighted votes (token-based)
        weightedVotesAgainst : Nat; // Weighted votes (token-based)
        totalEligibleVoters : Nat; // For participation calculation
        voters : [VoteRecord]; // Updated to include weight
        
        // Comments
        comments : [Comment];
    };

    // --- State Types ---
    public type ProposalState = {
        var proposals : Map.Map<Text, Proposal>;
    };

    // --- Helper Functions ---
    public func emptyState() : ProposalState {
        {
            var proposals = Map.new<Text, Proposal>();
        }
    };

    // Helper function to check if principal already voted
    private func hasVoted(voters : [VoteRecord], principal : Principal) : Bool {
        switch (Array.find<VoteRecord>(voters, func(v) = Principal.equal(v.voter, principal))) {
            case (?_) true;
            case null false;
        }
    };

    // Helper function to add vote with weight
    private func addVote(voters : [VoteRecord], principal : Principal, vote : Vote, weight : Nat) : [VoteRecord] {
        let voteRecord : VoteRecord = {
            voter = principal;
            choice = vote;
            weight = weight;
        };
        Array.append(voters, [voteRecord])
    };

    // Helper function to calculate participation rate
    private func calculateParticipationRate(totalVotes : Nat, totalEligible : Nat) : Nat {
        if (totalEligible == 0) return 0;
        (totalVotes * 100) / totalEligible
    };

    // Helper function to calculate approval rate
    private func calculateApprovalRate(votesFor : Nat, totalVotes : Nat) : Nat {
        if (totalVotes == 0) return 0;
        (votesFor * 100) / totalVotes
    };

    /**
     * Creates a new proposal as draft.
     */
    public func createDraft(
        state : ProposalState,
        caller : Principal,
        isMember : (Principal) -> async Bool,
        title : Text,
        description : Text,
        proposalType : ProposalType,
        beneficiaryAddress : ?Principal,
        requestedAmount : ?Nat,
        votingDurationSeconds : Nat,
        minimumParticipation : Nat,
        minimumApproval : Nat,
        totalEligibleVoters : Nat
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
            proposalType = proposalType;
            beneficiaryAddress = beneficiaryAddress;
            requestedAmount = requestedAmount;
            createdAt = now;
            publishedAt = null;
            votingDeadline = now + (votingDurationSeconds * 1_000_000_000);
            status = #draft;
            minimumParticipation = minimumParticipation;
            minimumApproval = minimumApproval;
            votesFor = 0;
            votesAgainst = 0;
            weightedVotesFor = 0;
            weightedVotesAgainst = 0;
            totalEligibleVoters = totalEligibleVoters;
            voters = [];
            comments = [];
        };

        Map.set(state.proposals, thash, proposalId, newProposal);
        return #ok(proposalId);
    };

    /**
     * Publishes a draft proposal, making it active for voting.
     */
    public func publishProposal(
        state : ProposalState,
        caller : Principal,
        proposalId : Text
    ) : async Result.Result<Bool, ProposalError> {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        switch (Map.get(state.proposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (not Principal.equal(proposal.proposer, caller)) {
                    return #err(#unauthorized);
                };
                if (proposal.status != #draft) {
                    return #err(#proposalNotActive);
                };

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    beneficiaryAddress = proposal.beneficiaryAddress;
                    requestedAmount = proposal.requestedAmount;
                    createdAt = proposal.createdAt;
                    publishedAt = ?Time.now();
                    votingDeadline = proposal.votingDeadline;
                    status = #active;
                    minimumParticipation = proposal.minimumParticipation;
                    minimumApproval = proposal.minimumApproval;
                    votesFor = proposal.votesFor;
                    votesAgainst = proposal.votesAgainst;
                    weightedVotesFor = proposal.weightedVotesFor;
                    weightedVotesAgainst = proposal.weightedVotesAgainst;
                    totalEligibleVoters = proposal.totalEligibleVoters;
                    voters = proposal.voters;
                    comments = proposal.comments;
                };

                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(true);
            };
        };
    };

    /**
     * Casts a vote on an active proposal with token-based weighting.
     */
    public func vote(
        state : ProposalState,
        caller : Principal,
        isMember : (Principal) -> async Bool,
        proposalId : Text,
        choice : Vote,
        tokenBalance : Nat
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
                if (proposal.status != #active) { return #err(#proposalNotActive); };
                if (Time.now() > proposal.votingDeadline) {
                    return #err(#votingPeriodOver);
                };
                if (hasVoted(proposal.voters, caller)) { return #err(#alreadyVoted); };

                // Calculate weighted votes based on token balance
                let (newVotesFor, newVotesAgainst, newWeightedVotesFor, newWeightedVotesAgainst) = switch (choice) {
                    case (#yes) { 
                        (proposal.votesFor + 1, proposal.votesAgainst, 
                         proposal.weightedVotesFor + tokenBalance, proposal.weightedVotesAgainst) 
                    };
                    case (#no) { 
                        (proposal.votesFor, proposal.votesAgainst + 1, 
                         proposal.weightedVotesFor, proposal.weightedVotesAgainst + tokenBalance) 
                    };
                };

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    beneficiaryAddress = proposal.beneficiaryAddress;
                    requestedAmount = proposal.requestedAmount;
                    createdAt = proposal.createdAt;
                    publishedAt = proposal.publishedAt;
                    votingDeadline = proposal.votingDeadline;
                    status = proposal.status;
                    minimumParticipation = proposal.minimumParticipation;
                    minimumApproval = proposal.minimumApproval;
                    votesFor = newVotesFor;
                    votesAgainst = newVotesAgainst;
                    weightedVotesFor = newWeightedVotesFor;
                    weightedVotesAgainst = newWeightedVotesAgainst;
                    totalEligibleVoters = proposal.totalEligibleVoters;
                    voters = addVote(proposal.voters, caller, choice, tokenBalance);
                    comments = proposal.comments;
                };

                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(true);
            };
        };
    };

    /**
     * Ends a proposal's voting period and determines the result.
     */
    public func finalizeProposal(state : ProposalState, proposalId : Text) : Result.Result<ProposalStatus, ProposalError> {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        switch (Map.get(state.proposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (proposal.status != #active) { return #err(#proposalNotActive); };
                if (Time.now() <= proposal.votingDeadline) { return #err(#votingStillActive); };

                let totalVotes = proposal.votesFor + proposal.votesAgainst;
                let participationRate = calculateParticipationRate(totalVotes, proposal.totalEligibleVoters);
                let approvalRate = calculateApprovalRate(proposal.votesFor, totalVotes);

                let finalStatus = if (participationRate < proposal.minimumParticipation) {
                    #rejected // Insufficient participation
                } else if (approvalRate >= proposal.minimumApproval) {
                    #approved
                } else {
                    #rejected
                };

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    beneficiaryAddress = proposal.beneficiaryAddress;
                    requestedAmount = proposal.requestedAmount;
                    createdAt = proposal.createdAt;
                    publishedAt = proposal.publishedAt;
                    votingDeadline = proposal.votingDeadline;
                    status = finalStatus;
                    minimumParticipation = proposal.minimumParticipation;
                    minimumApproval = proposal.minimumApproval;
                    votesFor = proposal.votesFor;
                    votesAgainst = proposal.votesAgainst;
                    weightedVotesFor = proposal.weightedVotesFor;
                    weightedVotesAgainst = proposal.weightedVotesAgainst;
                    totalEligibleVoters = proposal.totalEligibleVoters;
                    voters = proposal.voters;
                    comments = proposal.comments;
                };

                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(finalStatus);
            };
        };
    };

    /**
     * Marks an approved proposal as executed.
     */
    public func executeProposal(
        state : ProposalState,
        caller : Principal,
        proposalId : Text
    ) : Result.Result<Bool, ProposalError> {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        switch (Map.get(state.proposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (proposal.status != #approved) { return #err(#proposalNotActive); };

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    beneficiaryAddress = proposal.beneficiaryAddress;
                    requestedAmount = proposal.requestedAmount;
                    createdAt = proposal.createdAt;
                    publishedAt = proposal.publishedAt;
                    votingDeadline = proposal.votingDeadline;
                    status = #executed;
                    minimumParticipation = proposal.minimumParticipation;
                    minimumApproval = proposal.minimumApproval;
                    votesFor = proposal.votesFor;
                    votesAgainst = proposal.votesAgainst;
                    weightedVotesFor = proposal.weightedVotesFor;
                    weightedVotesAgainst = proposal.weightedVotesAgainst;
                    totalEligibleVoters = proposal.totalEligibleVoters;
                    voters = proposal.voters;
                    comments = proposal.comments;
                };

                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(true);
            };
        };
    };

    /**
     * Adds a comment to a proposal.
     */
    public func addComment(
        state : ProposalState,
        caller : Principal,
        isMember : (Principal) -> async Bool,
        proposalId : Text,
        content : Text
    ) : async Result.Result<Text, ProposalError> {
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
                let commentId = await UUIDUtils.generateUUIDv4();
                let newComment : Comment = {
                    id = commentId;
                    author = caller;
                    content = content;
                    createdAt = Time.now();
                    reactions = [];
                    reactors = [];
                };

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    beneficiaryAddress = proposal.beneficiaryAddress;
                    requestedAmount = proposal.requestedAmount;
                    createdAt = proposal.createdAt;
                    publishedAt = proposal.publishedAt;
                    votingDeadline = proposal.votingDeadline;
                    status = proposal.status;
                    minimumParticipation = proposal.minimumParticipation;
                    minimumApproval = proposal.minimumApproval;
                    votesFor = proposal.votesFor;
                    votesAgainst = proposal.votesAgainst;
                    weightedVotesFor = proposal.weightedVotesFor;
                    weightedVotesAgainst = proposal.weightedVotesAgainst;
                    totalEligibleVoters = proposal.totalEligibleVoters;
                    voters = proposal.voters;
                    comments = Array.append(proposal.comments, [newComment]);
                };

                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(commentId);
            };
        };
    };

    /**
     * Adds a reaction to a comment.
     */
    public func addReaction(
        state : ProposalState,
        caller : Principal,
        isMember : (Principal) -> async Bool,
        proposalId : Text,
        commentId : Text,
        reactionType : ReactionType
    ) : async Result.Result<Bool, ProposalError> {
        let memberCheck = await isMember(caller);
        if (not memberCheck) {
            return #err(#unauthorized);
        };

        if (not UUIDUtils.isValidUUID(proposalId) or not UUIDUtils.isValidUUID(commentId)) {
            return #err(#invalidUUID);
        };

        switch (Map.get(state.proposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                // Find and update the comment
                let updatedComments = Array.map<Comment, Comment>(proposal.comments, func(comment) {
                    if (comment.id == commentId) {
                        // Check if user already reacted with this type
                        let existingReactors = Array.find<(ReactionType, [Principal])>(comment.reactors, func((rType, _)) = rType == reactionType);
                        let userAlreadyReacted = switch (existingReactors) {
                            case (?(_, principals)) Array.find<Principal>(principals, func(p) = Principal.equal(p, caller)) != null;
                            case null false;
                        };

                        if (userAlreadyReacted) {
                            return comment; // No change if already reacted
                        };

                        // Update reactions count
                        let updatedReactions = Array.map<(ReactionType, Nat), (ReactionType, Nat)>(comment.reactions, func((rType, count)) {
                            if (rType == reactionType) {
                                (rType, count + 1)
                            } else {
                                (rType, count)
                            }
                        });

                        // Add reaction if it doesn't exist
                        let finalReactions = if (Array.find<(ReactionType, Nat)>(updatedReactions, func((rType, _)) = rType == reactionType) == null) {
                            Array.append(updatedReactions, [(reactionType, 1)])
                        } else {
                            updatedReactions
                        };

                        // Update reactors
                        let updatedReactors = Array.map<(ReactionType, [Principal]), (ReactionType, [Principal])>(comment.reactors, func((rType, principals)) {
                            if (rType == reactionType) {
                                (rType, Array.append(principals, [caller]))
                            } else {
                                (rType, principals)
                            }
                        });

                        // Add reactor type if it doesn't exist
                        let finalReactors = if (Array.find<(ReactionType, [Principal])>(updatedReactors, func((rType, _)) = rType == reactionType) == null) {
                            Array.append(updatedReactors, [(reactionType, [caller])])
                        } else {
                            updatedReactors
                        };

                        {
                            id = comment.id;
                            author = comment.author;
                            content = comment.content;
                            createdAt = comment.createdAt;
                            reactions = finalReactions;
                            reactors = finalReactors;
                        }
                    } else {
                        comment
                    }
                });

                let updatedProposal = {
                    id = proposal.id;
                    proposer = proposal.proposer;
                    title = proposal.title;
                    description = proposal.description;
                    proposalType = proposal.proposalType;
                    beneficiaryAddress = proposal.beneficiaryAddress;
                    requestedAmount = proposal.requestedAmount;
                    createdAt = proposal.createdAt;
                    publishedAt = proposal.publishedAt;
                    votingDeadline = proposal.votingDeadline;
                    status = proposal.status;
                    minimumParticipation = proposal.minimumParticipation;
                    minimumApproval = proposal.minimumApproval;
                    votesFor = proposal.votesFor;
                    votesAgainst = proposal.votesAgainst;
                    weightedVotesFor = proposal.weightedVotesFor;
                    weightedVotesAgainst = proposal.weightedVotesAgainst;
                    totalEligibleVoters = proposal.totalEligibleVoters;
                    voters = proposal.voters;
                    comments = updatedComments;
                };

                Map.set(state.proposals, thash, proposalId, updatedProposal);
                return #ok(true);
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

    /**
     * Retrieves proposals filtered by status, sorted by latest.
     */
    public func listByStatus(state : ProposalState, status : ?ProposalStatus) : [Proposal] {
        let allProposals = Map.vals(state.proposals) |> Iter.toArray(_);
        let filteredProposals = switch (status) {
            case (null) allProposals;
            case (?s) Array.filter<Proposal>(allProposals, func(p) = p.status == s);
        };
        
        // Sort by creation time (latest first)
        Array.sort<Proposal>(filteredProposals, func(a, b) {
            if (a.createdAt > b.createdAt) #less
            else if (a.createdAt < b.createdAt) #greater
            else #equal
        })
    };

    /**
     * Gets total proposal count.
     */
    public func getTotalCount(state : ProposalState) : Nat {
        return Map.size(state.proposals);
    };

    /**
     * Gets proposal count by status.
     */
    public func getCountByStatus(state : ProposalState, status : ProposalStatus) : Nat {
        let allProposals = Map.vals(state.proposals) |> Iter.toArray(_);
        Array.filter<Proposal>(allProposals, func(p) = p.status == status).size()
    };
}; 