import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:map/Map";

module {
    
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
        weight : Nat; // Token balance at time of proposal publish
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
        #daoNotRegistered;
    };

    public type DAORegistration = {
        daoId : Text;
        ledgerCanisterId : Principal;
        ammCanisterId : Principal;
        daoCanisterId : Principal;
        registeredAt : Time.Time;
    };

    public type Proposal = {
        id : Text; // UUID v4
        daoId : Text; // Reference to the DAO ID that owns this proposal
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
        
        // Token snapshot at publish time
        publishSnapshot : ?{
            circulatingSupply : Nat;
            eligibleVoters : Nat;
        };
        
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

    // State Types
    public type ProposalState = {
        var proposals : Map.Map<Text, Proposal>;
    };
};