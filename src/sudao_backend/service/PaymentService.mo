import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Cycles "mo:base/ExperimentalCycles";
import Map "mo:map/Map";
import { phash; thash } "mo:map/Map";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";

module {
  public type PaymentError = {
    #insufficientFunds;
    #transferFailed : Text;
    #unauthorized;
    #invalidAmount;
    #recipientNotFound;
  };

  public type TransactionRecord = {
    id : Text;
    from : Principal;
    to : Principal;
    amount : Nat;
    timestamp : Time.Time;
    transactionType : TransactionType;
    status : TransactionStatus;
  };

  public type TransactionType = {
    #deposit;
    #withdrawal;
    #proposalPayout;
    #swapDeposit;
    #refund;
  };

  public type TransactionStatus = {
    #pending;
    #completed;
    #failed : Text;
  };

  public type TreasuryBalance = {
    icp : Nat; // in e8s (1 ICP = 100_000_000 e8s)
    reserved : Nat; // funds reserved for pending proposals
    available : Nat; // available for new proposals
  };

  public class PaymentService() {
    private var treasuryBalance : TreasuryBalance = {
      icp = 0;
      reserved = 0;
      available = 0;
    };

    private var transactions = Map.new<Text, TransactionRecord>();
    private var nextTransactionId : Nat = 1;

    /**
         * Get current treasury balance
         */
    public func getTreasuryBalance() : TreasuryBalance {
      treasuryBalance;
    };

    /**
         * Deposit ICP from swap canister (after successful fundraising)
         * This is called by the governance canister when swap completes
         */
    public func depositFromSwap(amount : Nat, swapCanister : Principal) : async Result.Result<Text, PaymentError> {
      if (amount == 0) {
        return #err(#invalidAmount);
      };

      // In a full implementation, this would involve actual ICP transfer
      // For now, we simulate the deposit
      let transactionId = generateTransactionId();

      let transaction : TransactionRecord = {
        id = transactionId;
        from = swapCanister;
        to = Principal.fromText("2vxsx-fae"); // Placeholder - this would be the governance canister
        amount = amount;
        timestamp = Time.now();
        transactionType = #swapDeposit;
        status = #completed;
      };

      Map.set(transactions, thash, transactionId, transaction);

      // Update treasury balance
      treasuryBalance := {
        icp = treasuryBalance.icp + amount;
        reserved = treasuryBalance.reserved;
        available = treasuryBalance.available + amount;
      };

      Debug.print("Treasury deposit completed: " # Nat.toText(amount) # " e8s");
      #ok(transactionId);
    };

    /**
         * Reserve funds for an approved proposal
         */
    public func reserveFunds(amount : Nat, proposalId : Text) : Result.Result<(), PaymentError> {
      if (amount > treasuryBalance.available) {
        return #err(#insufficientFunds);
      };

      treasuryBalance := {
        icp = treasuryBalance.icp;
        reserved = treasuryBalance.reserved + amount;
        available = treasuryBalance.available - amount;
      };

      Debug.print("Reserved " # Nat.toText(amount) # " e8s for proposal " # proposalId);
      #ok();
    };

    /**
         * Execute payment for an approved proposal
         */
    public func executeProposalPayment(
      recipient : Principal,
      amount : Nat,
      proposalId : Text,
    ) : async Result.Result<Text, PaymentError> {
      if (amount > treasuryBalance.reserved) {
        return #err(#insufficientFunds);
      };

      let transactionId = generateTransactionId();

      // In a real implementation, this would make an actual ICP transfer
      // For now, we simulate the payment
      let transaction : TransactionRecord = {
        id = transactionId;
        from = Principal.fromText("2vxsx-fae"); // Placeholder - this would be the governance canister
        to = recipient;
        amount = amount;
        timestamp = Time.now();
        transactionType = #proposalPayout;
        status = #completed;
      };

      Map.set(transactions, thash, transactionId, transaction);

      // Update treasury balance
      treasuryBalance := {
        icp = treasuryBalance.icp - amount;
        reserved = treasuryBalance.reserved - amount;
        available = treasuryBalance.available;
      };

      Debug.print("Proposal payment executed: " # Nat.toText(amount) # " e8s to " # Principal.toText(recipient));
      #ok(transactionId);
    };

    /**
         * Release reserved funds (if proposal is rejected or cancelled)
         */
    public func releaseReservedFunds(amount : Nat, proposalId : Text) : Result.Result<(), PaymentError> {
      if (amount > treasuryBalance.reserved) {
        return #err(#insufficientFunds);
      };

      treasuryBalance := {
        icp = treasuryBalance.icp;
        reserved = treasuryBalance.reserved - amount;
        available = treasuryBalance.available + amount;
      };

      Debug.print("Released " # Nat.toText(amount) # " e8s from proposal " # proposalId);
      #ok();
    };

    /**
         * Get transaction history
         */
    public func getTransactionHistory() : [TransactionRecord] {
      Map.vals(transactions) |> Iter.toArray(_);
    };

    /**
         * Get specific transaction
         */
    public func getTransaction(transactionId : Text) : ?TransactionRecord {
      Map.get(transactions, thash, transactionId);
    };

    /**
         * Check if there are sufficient funds for a proposal
         */
    public func hasSufficientFunds(amount : Nat) : Bool {
      amount <= treasuryBalance.available;
    };

    // Private helper functions
    private func generateTransactionId() : Text {
      let id = "tx_" # Nat.toText(nextTransactionId);
      nextTransactionId += 1;
      id;
    };

    /**
         * For stable variable handling
         */
    public func stableGet() : {
      balance : TreasuryBalance;
      transactions : [(Text, TransactionRecord)];
      nextId : Nat;
    } {
      {
        balance = treasuryBalance;
        transactions = Map.toArray(transactions);
        nextId = nextTransactionId;
      };
    };

    public func stableSet(
      data : {
        balance : TreasuryBalance;
        transactions : [(Text, TransactionRecord)];
        nextId : Nat;
      }
    ) {
      treasuryBalance := data.balance;
      transactions := Map.fromIter(data.transactions.vals(), thash);
      nextTransactionId := data.nextId;
    };
  };
};
