import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { phash; thash } "mo:map/Map";
import Time "mo:base/Time";
import ProposalManager "Proposal";
import UserService "UserService";
import Types "Types";
import Result "mo:base/Result";

// This is the main actor for an individual DAO created by the platform.
// It acts as a facade, orchestrating different modules like proposals, treasury, and membership.
actor {

    public query func greet(name : Text) : async Text {
        return "Hello, " # name # "!";
    };

    // Debug function to check caller identity
    public shared (msg) func whoAmI() : async Text {
        return Principal.toText(msg.caller);
    };

    // --- USER MANAGEMENT ---
    // UserService state management with stable recovery
    private stable var usersEntries : [(Principal, Types.UserProfile)] = [];
    private var userService = UserService.UserService(?Map.fromIter<Principal, Types.UserProfile>(usersEntries.vals(), phash));

    // Public user management functions
    public shared (msg) func register() : async Text {
        
        let result = userService.registerUser(msg.caller);
        switch (result) {
            case (#Success(message)) message;
            case (#AlreadyRegistered(message)) message;
            case (#Error(message)) message;
        };
    };

    public shared (msg) func getMyProfile() : async [Types.UserProfile] {
        let result = userService.getUserProfile(msg.caller);
        switch (result) {
            case (#Found(profile)) [profile];
            case (#NotFound(_)) [];
        };
    };

    public query func getSystemInfo() : async Types.SystemInfo {
        return userService.getSystemInfo();
    };

    // --- MEMBER MANAGEMENT ---
    // For now, registered users are automatically members
    // In the future, this could be expanded with roles, permissions, etc.

    // Stable storage for proposals with migration handling
    private stable var proposalsEntries : [(Text, ProposalManager.Proposal)] = [];
    private stable var migratedToNewProposalFormat : Bool = false;

    // System lifecycle hooks for stable variables
    system func preupgrade() {
        proposalsEntries := Map.toArray(proposalState.proposals);
        usersEntries := Map.toArray(userService.getRegistry());
    };

    system func postupgrade() {
        // Clear old proposal data if this is first run with new format
        if (not migratedToNewProposalFormat) {
            proposalsEntries := [];
            migratedToNewProposalFormat := true;
        };
        usersEntries := [];
    };

    // Proposal state management with stable recovery
    private var proposalState : ProposalManager.ProposalState = {
        var proposals = Map.fromIter<Text, ProposalManager.Proposal>(proposalsEntries.vals(), thash);
    };

    /**
     * Check if a principal is a member of the DAO.
     * For now, we'll consider registered users as members.
     */
    private func isMember(p : Principal) : async Bool {
        // For simplicity, any registered user is a member
        return userService.userExists(p);
    };

    // Get total eligible voters (for participation calculation)
    private func getTotalEligibleVoters() : async Nat {
        return userService.getUserCount();
    };

    // --- Public Interface for Proposals ---

    // Create a draft proposal
    public shared (msg) func createDraftProposal(
        title : Text,
        description : Text,
        proposalType : ProposalManager.ProposalType,
        beneficiaryAddress : ?Principal,
        requestedAmount : ?Nat,
        votingDurationSeconds : Nat,
        minimumParticipation : Nat,
        minimumApproval : Nat,
    ) : async Result.Result<Text, ProposalManager.ProposalError> {
        let totalEligible = await getTotalEligibleVoters();
        return await ProposalManager.createDraft(
            proposalState,
            msg.caller,
            isMember,
            title,
            description,
            proposalType,
            beneficiaryAddress,
            requestedAmount,
            votingDurationSeconds,
            minimumParticipation,
            minimumApproval,
            totalEligible,
        );
    };

    // Publish a draft proposal to make it active
    public shared (msg) func publishProposal(proposalId : Text) : async Result.Result<Bool, ProposalManager.ProposalError> {
        return await ProposalManager.publishProposal(proposalState, msg.caller, proposalId);
    };

    // Vote on an active proposal
    public shared (msg) func voteOnProposal(proposalId : Text, choice : ProposalManager.Vote) : async Result.Result<Bool, ProposalManager.ProposalError> {
        return await ProposalManager.vote(proposalState, msg.caller, isMember, proposalId, choice);
    };

    // Finalize a proposal (determine result based on voting period end)
    public shared (_msg) func finalizeProposal(proposalId : Text) : async Result.Result<ProposalManager.ProposalStatus, ProposalManager.ProposalError> {
        return ProposalManager.finalizeProposal(proposalState, proposalId);
    };

    // Execute an approved proposal
    public shared (msg) func executeProposal(proposalId : Text) : async Result.Result<Bool, ProposalManager.ProposalError> {
        return ProposalManager.executeProposal(proposalState, msg.caller, proposalId);
    };

    // Add comment to a proposal
    public shared (msg) func addComment(proposalId : Text, content : Text) : async Result.Result<Text, ProposalManager.ProposalError> {
        return await ProposalManager.addComment(proposalState, msg.caller, isMember, proposalId, content);
    };

    // Add reaction to a comment
    public shared (msg) func addReaction(proposalId : Text, commentId : Text, reactionType : ProposalManager.ReactionType) : async Result.Result<Bool, ProposalManager.ProposalError> {
        return await ProposalManager.addReaction(proposalState, msg.caller, isMember, proposalId, commentId, reactionType);
    };

    // Get a single proposal
    public query func getProposal(proposalId : Text) : async ?ProposalManager.Proposal {
        return ProposalManager.get(proposalState, proposalId);
    };

    // List all proposals (sorted by latest)
    public query func listProposals() : async [ProposalManager.Proposal] {
        return ProposalManager.listByStatus(proposalState, null);
    };

    // List proposals by status (sorted by latest)
    public query func listProposalsByStatus(status : ?ProposalManager.ProposalStatus) : async [ProposalManager.Proposal] {
        return ProposalManager.listByStatus(proposalState, status);
    };

    // Get proposal statistics
    public query func getProposalStats() : async {
        total : Nat;
        draft : Nat;
        active : Nat;
        approved : Nat;
        rejected : Nat;
        executed : Nat;
    } {
        {
            total = ProposalManager.getTotalCount(proposalState);
            draft = ProposalManager.getCountByStatus(proposalState, #draft);
            active = ProposalManager.getCountByStatus(proposalState, #active);
            approved = ProposalManager.getCountByStatus(proposalState, #approved);
            rejected = ProposalManager.getCountByStatus(proposalState, #rejected);
            executed = ProposalManager.getCountByStatus(proposalState, #executed);
        };
    };

    // --- LEGACY FUNCTIONS (for backward compatibility) ---
    // These maintain compatibility with existing frontend code

    public shared (msg) func createProposal(title : Text, description : Text, votingDurationSeconds : Nat) : async Result.Result<Text, ProposalManager.ProposalError> {
        // Create a governance proposal with default parameters
        let totalEligible = await getTotalEligibleVoters();
        return await ProposalManager.createDraft(
            proposalState,
            msg.caller,
            isMember,
            title,
            description,
            #governance,
            null,
            null,
            votingDurationSeconds,
            50,
            51,
            totalEligible // 50% participation, 51% approval
        );
    };

    public shared (_msg) func endProposal(proposalId : Text) : async Result.Result<ProposalManager.ProposalStatus, ProposalManager.ProposalError> {
        return ProposalManager.finalizeProposal(proposalState, proposalId);
    };
};
