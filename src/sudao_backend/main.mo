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
    public shared(msg) func whoAmI() : async Text {
        return Principal.toText(msg.caller);
    };

    // --- USER MANAGEMENT ---
    // UserService state management with stable recovery
    private stable var usersEntries : [(Principal, Types.UserProfile)] = [];
    private var userService = UserService.UserService(?Map.fromIter<Principal, Types.UserProfile>(usersEntries.vals(), phash));

    // Public user management functions (adapted for frontend expectations)
    public shared(msg) func register() : async Text {
        let result = userService.registerUser(msg.caller);
        switch (result) {
            case (#Success(message)) message;
            case (#AlreadyRegistered(message)) message;
            case (#Error(message)) message;
        }
    };

    public shared(msg) func getMyProfile() : async [Types.UserProfile] {
        let result = userService.getUserProfile(msg.caller);
        switch (result) {
            case (#Found(profile)) [profile];
            case (#NotFound(_)) [];
        }
    };

    public query func getSystemInfo() : async Types.SystemInfo {
        return userService.getSystemInfo();
    };

    // --- MEMBER MANAGEMENT ---
    // For now, registered users are automatically members
    // In the future, this could be expanded with roles, permissions, etc.
    
    // Stable storage for proposals
    private stable var proposalsEntries : [(Text, ProposalManager.Proposal)] = [];

    // System lifecycle hooks for stable variables
    system func preupgrade() {
        proposalsEntries := Map.toArray(proposalState.proposals);
        usersEntries := Map.toArray(userService.getRegistry());
    };

    system func postupgrade() {
        proposalsEntries := [];
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

    // --- Public Interface for Proposals ---
    // These functions expose the functionality of the `proposalManager` module to the outside world.
    // This follows the Facade pattern, keeping the main actor clean and easy to read.

    public shared(msg) func createProposal(title : Text, description : Text, votingDurationSeconds : Nat) : async Result.Result<Text, ProposalManager.ProposalError> {
        return await ProposalManager.create(proposalState, msg.caller, isMember, title, description, votingDurationSeconds);
    };

    public shared(msg) func voteOnProposal(proposalId : Text, choice : ProposalManager.Vote) : async Result.Result<Bool, ProposalManager.ProposalError> {
        return await ProposalManager.vote(proposalState, msg.caller, isMember, proposalId, choice);
    };

    public shared(_msg) func endProposal(proposalId : Text) : async Result.Result<ProposalManager.ProposalStatus, ProposalManager.ProposalError> {
        return ProposalManager.end(proposalState, proposalId);
    };

    public query func getProposal(proposalId : Text) : async ?ProposalManager.Proposal {
        return ProposalManager.get(proposalState, proposalId);
    };

    public query func listProposals() : async [ProposalManager.Proposal] {
        return ProposalManager.list(proposalState);
    }
};
