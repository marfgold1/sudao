import Principal "mo:base/Principal";
import Map "mo:map/Map";
import { phash; thash } "mo:map/Map";
import ProposalManager "Proposal";
import UserService "service/UserService";
import PaymentService "service/PaymentService";
import Types "Types";
import Result "mo:base/Result";
import Middleware "../common/Middleware";
import CommonTypes "../common/Types";

// This is the main actor for an individual DAO created by the platform.
// It acts as a facade, orchestrating different modules like proposals, treasury, and membership.
// The DAOEntry is passed as an argument at canister install time.
persistent actor class DAO(initDAO : CommonTypes.DAOEntry, ledgerCanisterId_ : Principal) = this {
  // ------ DAO MANAGEMENT ------
  // DAO Information - initialized during canister creation
  private stable var daoInfo : ?Types.DAOInfo = ?{
    name = initDAO.name;
    description = initDAO.description;
    tags = initDAO.tags;
    creator = initDAO.creator;
    createdAt = initDAO.createdAt;
  };

  private stable var controllers : ?[Principal] = null;

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

  // --- USER MANAGEMENT ---
  // UserService state management with automatic persistence
  private stable var usersEntries : [(Principal, Types.UserProfile)] = [];
  private var userService = UserService.UserService(?Map.fromIter<Principal, Types.UserProfile>(usersEntries.vals(), phash));

  // --- TREASURY MANAGEMENT ---
  // PaymentService state management with automatic persistence
  private stable var treasuryData : ?{
    balance : PaymentService.TreasuryBalance;
    transactions : [(Text, PaymentService.TransactionRecord)];
    nextId : Nat;
  } = null;
  private var paymentService = PaymentService.PaymentService();

  // Public user management functions (adapted for frontend expectations)
  public shared (msg) func register() : async Text {
    let result = userService.registerUser(msg.caller);

    // Sync user changes to stable storage
    syncUsersToStable();

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

  // --- MEMBER MANAGEMENT ---
  // For now, registered users are automatically members
  // In the future, this could be expanded with roles, permissions, etc.

  // Stable storage for proposals with automatic persistence
  private stable var proposalsEntries : [(Text, ProposalManager.Proposal)] = [];
  private stable var migratedToNewProposalFormat : Bool = false;

  // One-time initialization of services with stable data
  private let _ = do {
    // Initialize payment service with stable data if available
    switch (treasuryData) {
      case (?data) {
        paymentService.stableSet(data);
      };
      case null {};
    };

    // Clear old proposal data if this is first run with new format
    if (not migratedToNewProposalFormat) {
      proposalsEntries := [];
      migratedToNewProposalFormat := true;
    };
  };

  // Proposal state management with automatic persistence
  // The proposalsEntries stable array is the source of truth
  private var proposalState : ProposalManager.ProposalState = {
    var proposals = Map.fromIter<Text, ProposalManager.Proposal>(proposalsEntries.vals(), thash);
  };

  // Sync functions to maintain consistency between Maps and stable arrays
  private func syncProposalsToStable() {
    proposalsEntries := Map.toArray(proposalState.proposals);
  };

  private func syncUsersToStable() {
    usersEntries := Map.toArray(userService.getRegistry());
  };

  private func syncTreasuryToStable() {
    treasuryData := ?paymentService.stableGet();
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
    let result = await ProposalManager.createDraft(
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

    // Sync proposal changes to stable storage
    syncProposalsToStable();
    return result;
  };

  // Publish a draft proposal to make it active
  public shared (msg) func publishProposal(proposalId : Text) : async Result.Result<Bool, ProposalManager.ProposalError> {
    let result = await ProposalManager.publishProposal(proposalState, msg.caller, proposalId);

    // Sync proposal changes to stable storage
    syncProposalsToStable();
    return result;
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
    } = actor (Principal.toText(ledgerCanisterId));

    let tokenBalance = await ledgerActor.icrc1_balance_of(voterAccount);

    let result = await ProposalManager.vote(proposalState, msg.caller, isMember, proposalId, choice, tokenBalance);

    // Sync proposal changes to stable storage
    syncProposalsToStable();
    return result;
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
    let result = await ProposalManager.addComment(proposalState, msg.caller, isMember, proposalId, content);

    // Sync proposal changes to stable storage
    syncProposalsToStable();
    return result;
  };

  // Add reaction to a comment
  public shared (msg) func addReaction(proposalId : Text, commentId : Text, reactionType : ProposalManager.ReactionType) : async Result.Result<Bool, ProposalManager.ProposalError> {
    let result = await ProposalManager.addReaction(proposalState, msg.caller, isMember, proposalId, commentId, reactionType);

    // Sync proposal changes to stable storage
    syncProposalsToStable();
    return result;
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

  // --- LEGACY FUNCTIONS (for backward compatibility) ---
  // These maintain compatibility with existing frontend code

  public shared (msg) func createProposal(title : Text, description : Text, votingDurationSeconds : Nat) : async Result.Result<Text, ProposalManager.ProposalError> {
    // Create a governance proposal with default parameters
    let totalEligible = await getTotalEligibleVoters();
    let result = await ProposalManager.createDraft(
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

    // Sync proposal changes to stable storage
    syncProposalsToStable();
    return result;
  };

  public shared (_msg) func endProposal(proposalId : Text) : async Result.Result<ProposalManager.ProposalStatus, ProposalManager.ProposalError> {
    return ProposalManager.finalizeProposal(proposalState, proposalId);
  };
};
