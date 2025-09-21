import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { phash; thash } "mo:map/Map";

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
persistent actor class DAO(initDAO : CommonTypes.DAOEntry, ledgerCanisterId_ : Principal) = this {
    // ------ DAO MANAGEMENT ------
    // DAO Information - initialiszed during canister creation
    private var daoInfo : ?Types.DAOInfo = ?{
        name = initDAO.name;
        description = initDAO.description;
        tags = initDAO.tags;
        creator = initDAO.creator;
        createdAt = initDAO.createdAt;
    };

    private var controllers : ?[Principal] = null;
    
    // Ledger canister ID for token-based voting
    private transient let ledgerCanisterId : Principal = ledgerCanisterId_;
    


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
    private var usersEntries : [(Principal, Types.UserProfile)] = [];
    private transient var userService = UserService.UserService(?Map.fromIter<Principal, Types.UserProfile>(usersEntries.vals(), phash));

    // --- TREASURY MANAGEMENT ---
    // PaymentService state management with stable recovery
    private var treasuryData : ?{
        balance : PaymentService.TreasuryBalance;
        transactions : [(Text, PaymentService.TransactionRecord)];
        nextId : Nat;
    } = null;
    private transient var paymentService = PaymentService.PaymentService();

    // --- TOKEN SWAP MANAGEMENT ---
    // TokenSwapService state management with stable recovery
    private var tokenSwapData : ?{
        pool : TokenSwapService.LiquidityPool;
        swaps : [(Text, TokenSwapService.SwapRecord)];
        nextId : Nat;
        fee : Float;
    } = null;
    private transient var tokenSwapService = TokenSwapService.TokenSwapService();

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



    // System lifecycle hooks for stable variables
    system func preupgrade() {
        usersEntries := Map.toArray(userService.getRegistry());
        treasuryData := ?paymentService.stableGet();
        tokenSwapData := ?tokenSwapService.stableGet();
    };

    system func postupgrade() {
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



    /**
     * Check if a principal is a member of the DAO.
     * For now, we'll consider registered users as members.
     */
    public func isMember(p : Principal) : async Bool {
        // For simplicity, any registered user is a member
        return userService.userExists(p);
    };

    // Get total eligible voters (for participation calculation)
    public func getTotalEligibleVoters() : async Nat {
        return userService.getUserCount();
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


};
