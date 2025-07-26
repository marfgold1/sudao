import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { phash; thash } "mo:map/Map";
import ProposalManager "Proposal";
import UserService "service/UserService";
import PaymentService "service/PaymentService";
import TokenSwapService "service/TokenSwapService";
import Types "Types";
import Result "mo:base/Result";
import Float "mo:base/Float";
import Middleware "../common/Middleware";
import CommonTypes "../common/Types";

// This is the main actor for an individual DAO created by the platform.
// It acts as a facade, orchestrating different modules like proposals, treasury, and membership.
// The DAOEntry is passed as an argument at canister install time.
shared ({ caller }) actor class DAO(initDAO : CommonTypes.DAOEntry) = this {

    // ------ DAO MANAGEMENT ------
    // DAO Information - initialiszed during canister creation
    private stable var daoInfo : ?Types.DAOInfo = ?{
        name = initDAO.name;
        description = initDAO.description;
        tags = initDAO.tags;
        creator = initDAO.creator;
        createdAt = initDAO.createdAt;
    };

    private stable var controllers : ?[Principal] = null;
    
    // Ledger canister ID for token-based voting
    private let ledgerCanisterId : Principal = Principal.fromText("ulvla-h7777-77774-qaacq-cai"); // Default, will be updated

    private func getControllers() : async [Principal] {
        switch (controllers) {
            case (?controllers) controllers;
            case null await Middleware.getControllers(Principal.fromActor(this));
        };
    };

    private func isController(caller : Principal) : async Bool {
        await Middleware.isController(caller, await getControllers());
    };

    // Get DAO information
    public query func getDAOInfo() : async ?Types.DAOInfo {
        return daoInfo;
    };

    public query func greet(name : Text) : async Text {
        switch (daoInfo) {
            case (?info) {
                return "Hello, " # name # "! Welcome to " # info.name # " DAO.";
            };
            case (null) {
                return "Hello, " # name # "!";
            };
        };
    };

    // Check if the caller is the creator of the DAO
    private func _isCreator(caller : Principal) : async Bool {
        switch (daoInfo) {
            case (?info) info.creator == caller;
            case null false;
        };
    };

    // Debug function to check caller identity
    public shared (msg) func whoAmI() : async Text {
        return Principal.toText(msg.caller);
    };

    // --- USER MANAGEMENT ---
    // UserService state management with stable recovery
    private stable var usersEntries : [(Principal, Types.UserProfile)] = [];
    private var userService = UserService.UserService(?Map.fromIter<Principal, Types.UserProfile>(usersEntries.vals(), phash));

    // --- TREASURY MANAGEMENT ---
    // PaymentService state management with stable recovery
    private stable var treasuryData : ?{
        balance : PaymentService.TreasuryBalance;
        transactions : [(Text, PaymentService.TransactionRecord)];
        nextId : Nat;
    } = null;
    private var paymentService = PaymentService.PaymentService();

    // --- TOKEN SWAP MANAGEMENT ---
    // TokenSwapService state management with stable recovery
    private stable var tokenSwapData : ?{
        pool : TokenSwapService.LiquidityPool;
        swaps : [(Text, TokenSwapService.SwapRecord)];
        nextId : Nat;
        fee : Float;
    } = null;
    private var tokenSwapService = TokenSwapService.TokenSwapService();

    // Public user management functions (adapted for frontend expectations)
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
        let baseInfo = userService.getSystemInfo();
        return {
            totalUsers = baseInfo.totalUsers;
            systemStartTime = baseInfo.systemStartTime;
            daoInfo = daoInfo;
        };
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
        treasuryData := ?paymentService.stableGet();
        tokenSwapData := ?tokenSwapService.stableGet();
    };

    system func postupgrade() {
        // Clear old proposal data if this is first run with new format
        if (not migratedToNewProposalFormat) {
            proposalsEntries := [];
            migratedToNewProposalFormat := true;
        };
        usersEntries := [];

        // Restore treasury data
        switch (treasuryData) {
            case (?data) {
                paymentService.stableSet(data);
                treasuryData := null;
            };
            case null {};
        };

        // Restore token swap data
        switch (tokenSwapData) {
            case (?data) {
                tokenSwapService.stableSet(data);
                tokenSwapData := null;
            };
            case null {};
        };
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

    // Vote on an active proposal with token-based weighting
    public shared (msg) func voteOnProposal(proposalId : Text, choice : ProposalManager.Vote) : async Result.Result<Bool, ProposalManager.ProposalError> {
        // Get voter's token balance for weighted voting
        let voterAccount = {
            owner = msg.caller;
            subaccount = null;
        };
        
        // Get balance from ledger canister
        let ledgerActor : actor {
            icrc1_balance_of : shared query (account : { owner : Principal; subaccount : ?[Nat8] }) -> async Nat;
        } = actor(Principal.toText(ledgerCanisterId));
        
        let tokenBalance = await ledgerActor.icrc1_balance_of(voterAccount);
        
        return await ProposalManager.vote(proposalState, msg.caller, isMember, proposalId, choice, tokenBalance);
    };

    // Finalize a proposal (determine result based on voting period end)
    public shared (_msg) func finalizeProposal(proposalId : Text) : async Result.Result<ProposalManager.ProposalStatus, ProposalManager.ProposalError> {
        return ProposalManager.finalizeProposal(proposalState, proposalId);
    };

    // Execute an approved proposal
    public shared (msg) func executeProposal(proposalId : Text) : async Result.Result<Bool, ProposalManager.ProposalError> {
        // Check if caller has permission to execute proposals
        if (not (await isMember(msg.caller))) {
            return #err(#unauthorized);
        };

        // Get proposal details
        switch (ProposalManager.get(proposalState, proposalId)) {
            case (?proposal) {
                if (proposal.status != #approved) {
                    return #err(#proposalNotActive);
                };

                // Handle funding proposals
                if (proposal.proposalType == #funding) {
                    switch (proposal.beneficiaryAddress, proposal.requestedAmount) {
                        case (?beneficiary, ?amount) {
                            // Check if treasury has sufficient funds
                            if (not paymentService.hasSufficientFunds(amount)) {
                                return #err(#proposalNotActive); // Insufficient funds
                            };

                            // Execute the payment
                            switch (await paymentService.executeProposalPayment(beneficiary, amount, proposalId)) {
                                case (#ok(_transactionId)) {
                                    // Mark proposal as executed
                                    return ProposalManager.executeProposal(proposalState, msg.caller, proposalId);
                                };
                                case (#err(_paymentError)) {
                                    return #err(#proposalNotActive); // Payment failed
                                };
                            };
                        };
                        case _ {
                            return #err(#proposalNotActive); // Invalid funding proposal
                        };
                    };
                } else {
                    // For governance proposals, just mark as executed
                    return ProposalManager.executeProposal(proposalState, msg.caller, proposalId);
                };
            };
            case null {
                return #err(#proposalNotFound);
            };
        };
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

    // --- TREASURY MANAGEMENT ---

    /**
     * Get treasury balance
     */
    public query func getTreasuryBalance() : async PaymentService.TreasuryBalance {
        paymentService.getTreasuryBalance();
    };

    /**
     * Deposit funds from swap canister (called after successful fundraising)
     */
    public shared (_msg) func depositFromSwap(amount : Nat, swapCanister : Principal) : async Result.Result<Text, Text> {
        switch (await paymentService.depositFromSwap(amount, swapCanister)) {
            case (#ok(transactionId)) #ok(transactionId);
            case (#err(_error)) #err("Deposit failed"); // Convert error type
        };
    };

    /**
     * Get transaction history
     */
    public query func getTransactionHistory() : async [PaymentService.TransactionRecord] {
        paymentService.getTransactionHistory();
    };

    /**
     * Reserve funds for an approved proposal (internal use)
     */
    private func _reserveProposalFunds(proposalId : Text, amount : Nat) : Result.Result<(), Text> {
        switch (paymentService.reserveFunds(amount, proposalId)) {
            case (#ok()) #ok();
            case (#err(_error)) #err("Failed to reserve funds");
        };
    };

    // --- TOKEN SWAP MANAGEMENT ---

    /**
     * Initialize the token swap liquidity pool (admin only)
     */
    public shared (msg) func initializeTokenSwap(
        initialTokens : Nat,
        initialIcp : Nat,
    ) : async Result.Result<(), Text> {
        if (not (await isMember(msg.caller))) {
            return #err("Only members can initialize token swap");
        };

        switch (tokenSwapService.initializeLiquidity(initialTokens, initialIcp)) {
            case (#ok()) #ok();
            case (#err(error)) #err("Failed to initialize swap: " # debug_show (error));
        };
    };

    /**
     * Get quote for swapping governance tokens to ICP
     */
    public query func getTokenToIcpQuote(tokenAmount : Nat) : async Result.Result<TokenSwapService.SwapQuote, Text> {
        switch (tokenSwapService.getTokenToIcpQuote(tokenAmount)) {
            case (#ok(quote)) #ok(quote);
            case (#err(error)) #err("Quote failed: " # debug_show (error));
        };
    };

    /**
     * Get quote for swapping ICP to governance tokens
     */
    public query func getIcpToTokenQuote(icpAmount : Nat) : async Result.Result<TokenSwapService.SwapQuote, Text> {
        switch (tokenSwapService.getIcpToTokenQuote(icpAmount)) {
            case (#ok(quote)) #ok(quote);
            case (#err(error)) #err("Quote failed: " # debug_show (error));
        };
    };

    /**
     * Swap governance tokens for ICP
     */
    public shared (msg) func swapTokensForIcp(
        tokenAmount : Nat,
        minIcpOut : Nat,
    ) : async Result.Result<TokenSwapService.SwapRecord, Text> {
        if (not (await isMember(msg.caller))) {
            return #err("Only members can swap tokens");
        };

        switch (await tokenSwapService.executeTokenToIcpSwap(msg.caller, tokenAmount, minIcpOut)) {
            case (#ok(swapRecord)) #ok(swapRecord);
            case (#err(error)) #err("Swap failed: " # debug_show (error));
        };
    };

    /**
     * Swap ICP for governance tokens
     */
    public shared (msg) func swapIcpForTokens(
        icpAmount : Nat,
        minTokensOut : Nat,
    ) : async Result.Result<TokenSwapService.SwapRecord, Text> {
        if (not (await isMember(msg.caller))) {
            return #err("Only members can swap tokens");
        };

        switch (await tokenSwapService.executeIcpToTokenSwap(msg.caller, icpAmount, minTokensOut)) {
            case (#ok(swapRecord)) #ok(swapRecord);
            case (#err(error)) #err("Swap failed: " # debug_show (error));
        };
    };

    /**
     * Add liquidity to the token swap pool
     */
    public shared (msg) func addSwapLiquidity(
        tokenAmount : Nat,
        icpAmount : Nat,
    ) : async Result.Result<Nat, Text> {
        if (not (await isMember(msg.caller))) {
            return #err("Only members can add liquidity");
        };

        switch (tokenSwapService.addLiquidity(tokenAmount, icpAmount, msg.caller)) {
            case (#ok(shares)) #ok(shares);
            case (#err(error)) #err("Add liquidity failed: " # debug_show (error));
        };
    };

    /**
     * Get current liquidity pool state
     */
    public query func getSwapLiquidityPool() : async TokenSwapService.LiquidityPool {
        tokenSwapService.getLiquidityPool();
    };

    /**
     * Get exchange rates
     */
    public query func getSwapExchangeRates() : async {
        tokenToIcpRate : Float;
        icpToTokenRate : Float;
        totalLiquidity : Nat;
    } {
        tokenSwapService.getExchangeRates();
    };

    /**
     * Get user's swap history
     */
    public query func getMySwapHistory() : async [TokenSwapService.SwapRecord] {
        // This would need the caller context, but query functions don't have msg
        // For now, return empty array - in practice, would use a different approach
        [];
    };

    /**
     * Get user's swap history (with explicit user parameter)
     */
    public shared (msg) func getUserSwapHistory(user : ?Principal) : async [TokenSwapService.SwapRecord] {
        let targetUser = switch (user) {
            case (?u) u;
            case null msg.caller;
        };
        tokenSwapService.getUserSwapHistory(targetUser);
    };

    /**
     * Enable/disable token swapping (admin only)
     */
    public shared (msg) func setSwapEnabled(enabled : Bool) : async Result.Result<(), Text> {
        if (not (await isController(msg.caller))) {
            return #err("Only controllers can enable/disable swapping");
        };

        tokenSwapService.setSwapEnabled(enabled);
        #ok();
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
