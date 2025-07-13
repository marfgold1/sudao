import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Time "mo:base/Time";
import ProposalManager "Proposal";
import TrieUtils "TrieUtils";
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

    // Function to add a member (for testing)
    public shared(_msg) func addMember(member : Principal) : async Bool {
        let newMember : Member = { joinedAt = Time.now() };
        members := Trie.put(members, TrieUtils.principalKey(member), Principal.equal, newMember).0;
        return true;
    };

    // Function to check if someone is a member (for testing)
    public shared(_msg) func checkMembership(p : Principal) : async Bool {
        return await isMember(p);
    };

    // Debug function to list all members
    public query func listMembers() : async [Text] {
        let membersArray = Trie.toArray<Principal, Member, Text>(members, func(k: Principal, v: Member) : Text = Principal.toText(k));
        return membersArray;
    };

    // Debug function to check trie operations
    public shared(_msg) func debugMembership(p : Principal) : async Text {
        let trieResult = TrieUtils.getPrincipal(members, p);
        let isAnon = Principal.isAnonymous(p);
        let memberExists = trieResult != null;
        
        let result = "Principal: " # Principal.toText(p) # 
                    ", Anonymous: " # debug_show(isAnon) # 
                    ", Member exists: " # debug_show(memberExists) # 
                    ", Final result: " # debug_show(not isAnon and memberExists);
        
        return result;
    };

    // --- DUMMY IMPLEMENTATION for Required Dependencies ---
    // The following state and functions are placeholders.
    // In a real implementation, they would be part of a separate, more complex Membership module.
    // The ProposalManager depends on a function `isMember` to authorize actions.

    // A simple record for member data. This would be more complex in a real DAO.
    type Member = {
        joinedAt : Time.Time;
        // e.g., votingPower, role, etc.
    };

    // A trie to store the members of the DAO. The Principal is the key.
    private var members : Trie.Trie<Principal, Member> = Trie.put(
        Trie.empty<Principal, Member>(),
        TrieUtils.principalKey(Principal.fromText("aaaaa-aa")),
        Principal.equal,
        { joinedAt = 0 }
    ).0;

    // Proposal state management
    private var proposalState : ProposalManager.ProposalState = ProposalManager.emptyState();

    /**
     * DUMMY function to check if a principal is a member of the DAO.
     * The `ProposalManager` class requires this function to be passed during its instantiation.
     * @param p The principal to check.
     * @returns A boolean indicating membership status.
     */
    // Configuration for allowing anonymous principals (for testing)
    private var ALLOW_ANONYMOUS_FOR_TESTING = true; // Set this based on your environment
    
    // Function to toggle testing mode (only for development)
    public shared(_msg) func setTestingMode(enabled : Bool) : async Bool {
        ALLOW_ANONYMOUS_FOR_TESTING := enabled;
        return ALLOW_ANONYMOUS_FOR_TESTING;
    };
    
    // Function to check current testing mode
    public query func getTestingMode() : async Bool {
        return ALLOW_ANONYMOUS_FOR_TESTING;
    };

    private func isMember(p : Principal) : async Bool {
        // For this dummy implementation, we just check if the principal exists in the `members` trie.
        let memberExists = TrieUtils.getPrincipal(members, p) != null;
        
        if (ALLOW_ANONYMOUS_FOR_TESTING) {
            // In testing mode, allow any principal that exists in members trie
            return memberExists;
        } else {
            // In production mode, deny anonymous principals
            return not Principal.isAnonymous(p) and memberExists;
        };
    };

    // --- Module Instantiation ---

    // No need to instantiate ProposalManager as it's now a module

    // --- Public Interface for Proposals ---
    // These functions expose the functionality of the `proposalManager` module to the outside world.
    // This follows the Facade pattern, keeping the main actor clean and easy to read.

    public shared(msg) func createProposal(title : Text, description : Text, votingDurationSeconds : Nat) : async Result.Result<Nat, ProposalManager.ProposalError> {
        switch (await ProposalManager.create(proposalState, msg.caller, isMember, title, description, votingDurationSeconds)) {
            case (#ok((newState, proposalId))) {
                proposalState := newState;
                return #ok(proposalId);
            };
            case (#err(error)) {
                return #err(error);
            };
        };
    };

    public shared(msg) func voteOnProposal(proposalId : Nat, choice : ProposalManager.Vote) : async Result.Result<Bool, ProposalManager.ProposalError> {
        switch (await ProposalManager.vote(proposalState, msg.caller, isMember, proposalId, choice)) {
            case (#ok(newState)) {
                proposalState := newState;
                return #ok(true);
            };
            case (#err(error)) {
                return #err(error);
            };
        };
    };

    public shared(_msg) func endProposal(proposalId : Nat) : async Result.Result<ProposalManager.ProposalStatus, ProposalManager.ProposalError> {
        switch (ProposalManager.end(proposalState, proposalId)) {
            case (#ok((newState, status))) {
                proposalState := newState;
                return #ok(status);
            };
            case (#err(error)) {
                return #err(error);
            };
        };
    };

    public query func getProposal(proposalId : Nat) : async ?ProposalManager.Proposal {
        return ProposalManager.get(proposalState, proposalId);
    };

    public query func listProposals() : async [ProposalManager.Proposal] {
        return ProposalManager.list(proposalState);
    }
};
