import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { thash } "mo:map/Map";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import ProposalTypes "Types";
import UUIDUtils "UUIDUtils";

persistent actor ProposalCanister = {
    
    // DAO registrations
    private stable var daoRegistrations : [(Text, ProposalTypes.DAORegistration)] = [];
    private var daoRegistry = Map.fromIter<Text, ProposalTypes.DAORegistration>(daoRegistrations.vals(), thash);
    
    // Proposals by DAO ID
    private stable var proposalsByDAOEntries : [(Text, [(Text, ProposalTypes.Proposal)])] = [];
    private var proposalsByDAO : Map.Map<Text, Map.Map<Text, ProposalTypes.Proposal>> = Map.fromIter<Text, Map.Map<Text, ProposalTypes.Proposal>>(
        Array.map<(Text, [(Text, ProposalTypes.Proposal)]), (Text, Map.Map<Text, ProposalTypes.Proposal>)>(
            proposalsByDAOEntries,
            func((daoId, proposals)) = (daoId, Map.fromIter<Text, ProposalTypes.Proposal>(proposals.vals(), thash))
        ).vals(),
        thash
    );

    // ICRC1 Ledger interface
    public type ICRC1Ledger = actor {
        icrc1_balance_of : shared query ({ owner : Principal; subaccount : ?[Nat8] }) -> async Nat;
        icrc1_total_supply : shared query () -> async Nat;
    };

    // Helper to get DAO registration
    private func getDAORegistration(daoId : Text) : ?ProposalTypes.DAORegistration {
        Map.get(daoRegistry, thash, daoId)
    };

    // Helper to get or create proposal map for a DAO
    private func getDAOProposals(daoId : Text) : Map.Map<Text, ProposalTypes.Proposal> {
        switch (Map.get(proposalsByDAO, thash, daoId)) {
            case (?proposals) proposals;
            case null {
                let newMap = Map.new<Text, ProposalTypes.Proposal>();
                Map.set(proposalsByDAO, thash, daoId, newMap);
                newMap
            };
        }
    };

    // Calculate circulating supply and eligible voters
    private func calculateTokenMetrics(registration : ProposalTypes.DAORegistration) : async { circulatingSupply : Nat; eligibleVoters : Nat } {
        let ledger : ICRC1Ledger = actor(Principal.toText(registration.ledgerCanisterId));
        
        let totalSupply = await ledger.icrc1_total_supply();
        let daoBalance = await ledger.icrc1_balance_of({ owner = registration.daoCanisterId; subaccount = null });
        let ammBalance = await ledger.icrc1_balance_of({ owner = registration.ammCanisterId; subaccount = null });
        
        let circulatingSupply = totalSupply - daoBalance - ammBalance;
        
        // For now, assume 1 eligible voter per token unit (can be enhanced to count actual holders)
        let eligibleVoters = if (circulatingSupply > 0) circulatingSupply else 1;
        
        { circulatingSupply = circulatingSupply; eligibleVoters = eligibleVoters }
    };

    // Get voter's token balance at snapshot time
    private func getVoterWeight(voterPrincipal : Principal, registration : ProposalTypes.DAORegistration) : async Nat {
        let ledger : ICRC1Ledger = actor(Principal.toText(registration.ledgerCanisterId));
        await ledger.icrc1_balance_of({ owner = voterPrincipal; subaccount = null })
    };

    // Register a DAO with the proposal system
    public shared (msg) func registerDAO(
        daoId : Text,
        ledgerCanisterId : Principal,
        ammCanisterId : Principal,
        daoCanisterId : Principal
    ) : async Result.Result<Bool, Text> {
        // Check if already registered
        switch (Map.get(daoRegistry, thash, daoId)) {
            case (?_) return #err("DAO already registered");
            case null {};
        };

        let registration : ProposalTypes.DAORegistration = {
            daoId = daoId;
            ledgerCanisterId = ledgerCanisterId;
            ammCanisterId = ammCanisterId;
            daoCanisterId = daoCanisterId;
            registeredAt = Time.now();
        };

        Map.set(daoRegistry, thash, daoId, registration);
        #ok(true)
    };

    // Create a draft proposal
    public shared (msg) func createDraftProposal(
        daoId : Text,
        title : Text,
        description : Text,
        proposalType : ProposalTypes.ProposalType,
        beneficiaryAddress : ?Principal,
        requestedAmount : ?Nat,
        votingDurationSeconds : Nat,
        minimumParticipation : Nat,
        minimumApproval : Nat,
    ) : async Result.Result<Text, ProposalTypes.ProposalError> {
        
        // Check if DAO is registered
        switch (getDAORegistration(daoId)) {
            case null return #err(#daoNotRegistered);
            case (?_) {};
        };
        
        let proposalId = await UUIDUtils.generateUUIDv4();
        let now = Time.now();
        
        let newProposal : ProposalTypes.Proposal = {
            id = proposalId;
            daoId = daoId;
            proposer = msg.caller;
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
            publishSnapshot = null;
            votesFor = 0;
            votesAgainst = 0;
            weightedVotesFor = 0;
            weightedVotesAgainst = 0;
            totalEligibleVoters = 0;
            voters = [];
            comments = [];
        };

        let daoProposals = getDAOProposals(daoId);
        Map.set(daoProposals, thash, proposalId, newProposal);
        return #ok(proposalId);
    };

    // Publish a draft proposal
    public shared (msg) func publishProposal(daoId : Text, proposalId : Text) : async Result.Result<Bool, ProposalTypes.ProposalError> {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        let registration = switch (getDAORegistration(daoId)) {
            case null return #err(#daoNotRegistered);
            case (?reg) reg;
        };

        let daoProposals = getDAOProposals(daoId);
        switch (Map.get(daoProposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (not Principal.equal(proposal.proposer, msg.caller)) {
                    return #err(#unauthorized);
                };
                if (proposal.status != #draft) {
                    return #err(#proposalNotActive);
                };

                // Take token snapshot
                let snapshot = await calculateTokenMetrics(registration);

                let updatedProposal = {
                    proposal with
                    publishedAt = ?Time.now();
                    status = #active;
                    publishSnapshot = ?snapshot;
                    totalEligibleVoters = snapshot.eligibleVoters;
                };

                Map.set(daoProposals, thash, proposalId, updatedProposal);
                return #ok(true);
            };
        };
    };

    // Vote on a proposal
    public shared (msg) func voteOnProposal(
        daoId : Text,
        proposalId : Text,
        choice : ProposalTypes.Vote
    ) : async Result.Result<Bool, ProposalTypes.ProposalError> {
        
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        let registration = switch (getDAORegistration(daoId)) {
            case null return #err(#daoNotRegistered);
            case (?reg) reg;
        };

        let daoProposals = getDAOProposals(daoId);
        switch (Map.get(daoProposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (proposal.status != #active) { return #err(#proposalNotActive); };
                if (Time.now() > proposal.votingDeadline) {
                    return #err(#votingPeriodOver);
                };
                if (hasVoted(proposal.voters, msg.caller)) { return #err(#alreadyVoted); };

                // Get voter's token balance (snapshot from publish time)
                let voterWeight = await getVoterWeight(msg.caller, registration);
                
                // Only allow voting if user has tokens
                if (voterWeight == 0) {
                    return #err(#unauthorized);
                };

                // Update vote counts
                let (newVotesFor, newVotesAgainst, newWeightedVotesFor, newWeightedVotesAgainst) = switch (choice) {
                    case (#yes) { 
                        (proposal.votesFor + 1, proposal.votesAgainst, 
                         proposal.weightedVotesFor + voterWeight, proposal.weightedVotesAgainst) 
                    };
                    case (#no) { 
                        (proposal.votesFor, proposal.votesAgainst + 1, 
                         proposal.weightedVotesFor, proposal.weightedVotesAgainst + voterWeight) 
                    };
                };

                let updatedProposal = {
                    proposal with
                    votesFor = newVotesFor;
                    votesAgainst = newVotesAgainst;
                    weightedVotesFor = newWeightedVotesFor;
                    weightedVotesAgainst = newWeightedVotesAgainst;
                    voters = addVote(proposal.voters, msg.caller, choice, voterWeight);
                };

                Map.set(daoProposals, thash, proposalId, updatedProposal);
                return #ok(true);
            };
        };
    };

    // Finalize a proposal
    public func finalizeProposal(daoId : Text, proposalId : Text) : async Result.Result<ProposalTypes.ProposalStatus, ProposalTypes.ProposalError> {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        let daoProposals = getDAOProposals(daoId);
        switch (Map.get(daoProposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (proposal.status != #active) { return #err(#proposalNotActive); };
                if (Time.now() <= proposal.votingDeadline) { return #err(#votingStillActive); };

                let totalVotes = proposal.votesFor + proposal.votesAgainst;
                let participationRate = if (proposal.totalEligibleVoters == 0) 100 else calculateParticipationRate(totalVotes, proposal.totalEligibleVoters);
                let approvalRate = calculateApprovalRate(proposal.weightedVotesFor, proposal.weightedVotesFor + proposal.weightedVotesAgainst);

                let finalStatus = if (participationRate < proposal.minimumParticipation) {
                    #rejected
                } else if (approvalRate >= proposal.minimumApproval) {
                    #approved
                } else {
                    #rejected
                };

                let updatedProposal = { proposal with status = finalStatus };
                Map.set(daoProposals, thash, proposalId, updatedProposal);
                return #ok(finalStatus);
            };
        };
    };

    // Execute a proposal
    public shared (msg) func executeProposal(daoId : Text, proposalId : Text) : async Result.Result<Bool, ProposalTypes.ProposalError> {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        let daoProposals = getDAOProposals(daoId);
        switch (Map.get(daoProposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                if (proposal.status != #approved) { return #err(#proposalNotActive); };

                let updatedProposal = { proposal with status = #executed };
                Map.set(daoProposals, thash, proposalId, updatedProposal);
                return #ok(true);
            };
        };
    };

    // Add comment to proposal
    public shared (msg) func addComment(
        daoId : Text,
        proposalId : Text,
        content : Text
    ) : async Result.Result<Text, ProposalTypes.ProposalError> {
        
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return #err(#invalidUUID);
        };

        let daoProposals = getDAOProposals(daoId);
        switch (Map.get(daoProposals, thash, proposalId)) {
            case (null) { return #err(#proposalNotFound); };
            case (?proposal) {
                let commentId = await UUIDUtils.generateUUIDv4();
                let newComment : ProposalTypes.Comment = {
                    id = commentId;
                    author = msg.caller;
                    content = content;
                    createdAt = Time.now();
                    reactions = [];
                    reactors = [];
                };

                let updatedProposal = {
                    proposal with
                    comments = Array.append(proposal.comments, [newComment]);
                };

                Map.set(daoProposals, thash, proposalId, updatedProposal);
                return #ok(commentId);
            };
        };
    };

    // Get proposal by ID
    public query func getProposal(daoId : Text, proposalId : Text) : async ?ProposalTypes.Proposal {
        if (not UUIDUtils.isValidUUID(proposalId)) {
            return null;
        };
        let daoProposals = getDAOProposals(daoId);
        return Map.get(daoProposals, thash, proposalId);
    };

    // List all proposals for a DAO
    public query func listProposals(daoId : Text) : async [ProposalTypes.Proposal] {
        let daoProposals = getDAOProposals(daoId);
        Map.vals(daoProposals) |> Iter.toArray(_)
    };

    // List proposals by status for a DAO
    public query func listProposalsByStatus(
        daoId : Text,
        status : ?ProposalTypes.ProposalStatus
    ) : async [ProposalTypes.Proposal] {
        let daoProposals = getDAOProposals(daoId);
        let allProposals = Map.vals(daoProposals) |> Iter.toArray(_);
        
        let statusFiltered = switch (status) {
            case (null) allProposals;
            case (?s) Array.filter<ProposalTypes.Proposal>(allProposals, func(p) = p.status == s);
        };
        
        // Sort by creation time (latest first)
        Array.sort<ProposalTypes.Proposal>(statusFiltered, func(a, b) {
            if (a.createdAt > b.createdAt) #less
            else if (a.createdAt < b.createdAt) #greater
            else #equal
        })
    };

    // Get proposal count for a DAO
    public query func getProposalCount(daoId : Text) : async Nat {
        let daoProposals = getDAOProposals(daoId);
        Map.size(daoProposals)
    };

    // Get DAO registration info
    public query func getDAOInfo(daoId : Text) : async ?ProposalTypes.DAORegistration {
        getDAORegistration(daoId)
    };

    // Check if DAO is registered
    public query func isDAORegistered(daoId : Text) : async Bool {
        switch (getDAORegistration(daoId)) {
            case (?_) true;
            case null false;
        }
    };

    // Debug method to list all registered DAOs
    public query func listAllDAOs() : async [ProposalTypes.DAORegistration] {
        Map.vals(daoRegistry) |> Iter.toArray(_)
    };

    // Helper functions
    private func hasVoted(voters : [ProposalTypes.VoteRecord], principal : Principal) : Bool {
        switch (Array.find<ProposalTypes.VoteRecord>(voters, func(v) = Principal.equal(v.voter, principal))) {
            case (?_) true;
            case null false;
        }
    };

    private func addVote(voters : [ProposalTypes.VoteRecord], principal : Principal, vote : ProposalTypes.Vote, weight : Nat) : [ProposalTypes.VoteRecord] {
        let voteRecord : ProposalTypes.VoteRecord = {
            voter = principal;
            choice = vote;
            weight = weight;
        };
        Array.append(voters, [voteRecord])
    };

    private func calculateParticipationRate(totalVotes : Nat, totalEligible : Nat) : Nat {
        if (totalEligible == 0) return 0;
        (totalVotes * 100) / totalEligible
    };

    private func calculateApprovalRate(votesFor : Nat, totalVotes : Nat) : Nat {
        if (totalVotes == 0) return 0;
        (votesFor * 100) / totalVotes
    };
};