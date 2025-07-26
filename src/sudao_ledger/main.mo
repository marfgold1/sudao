import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";

/**
 * Simple ICRC-1 Compliant Ledger Canister
 * Handles token balances and transfers for a DAO
 */
actor Ledger {

  // ICRC-1 Standard Types
  public type Account = {
    owner : Principal;
    subaccount : ?[Nat8];
  };

  public type TransferArgs = {
    from_subaccount : ?[Nat8];
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?[Nat8];
    created_at_time : ?Nat64;
  };

  public type TransferError = {
    #BadFee : { expected_fee : Nat };
    #InsufficientFunds : { balance : Nat };
    #GenericError : { error_code : Nat; message : Text };
  };

  public type TransferResult = {
    #Ok : Nat; // Transaction index
    #Err : TransferError;
  };

  // State variables
  private stable var tokenName : Text = "";
  private stable var tokenSymbol : Text = "";
  private stable var tokenDecimals : Nat8 = 8;
  private stable var totalSupply : Nat = 0;
  private stable var transferFee : Nat = 0;
  private stable var minting_account : ?Account = null;
  private stable var governance_canister : ?Principal = null;
  private stable var swap_canister : ?Principal = null;
  
  // Simple balance storage using stable arrays
  private stable var balanceEntries : [(Principal, Nat)] = [];
  private var balances = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);

  // Transaction counter
  private stable var nextTransactionIndex : Nat = 0;

  // System hooks for stable variables
  system func preupgrade() {
    balanceEntries := Iter.toArray(balances.entries());
  };

  system func postupgrade() {
    balances := HashMap.fromIter<Principal, Nat>(balanceEntries.vals(), balanceEntries.size(), Principal.equal, Principal.hash);
    balanceEntries := [];
  };

  /**
     * Initialize the ledger
     */
  public shared (msg) func initializeLedger(
    name : Text,
    symbol : Text,
    decimals : Nat8,
    minter_supply : Nat,
    fee : Nat,
    minter : Account,
    governance : Principal,
    governance_supply: Nat,
    swap: Principal,
    swap_supply: Nat
  ) : async Result.Result<(), Text> {
    if (tokenName != "") {
      return #err("Ledger already initialized");
    };

    tokenName := name;
    tokenSymbol := symbol;
    tokenDecimals := decimals;
    transferFee := fee;
    minting_account := ?minter;
    governance_canister := ?governance;
    swap_canister := ?swap;

    // Mint initial supply to the minting account
    if (initial_supply > 0) {
      balances.put(minter.owner, initial_supply);
      totalSupply := initial_supply;
    };

    if (governance_supply > 0) {
      balances.put(governance, governance_supply);
      totalSupply += governance_supply;
    };

    if (swap_supply > 0) {
      balances.put(swap, swap_supply);
      totalSupply += swap_supply;
    };

    #ok();
  };

  // ICRC-1 Standard Methods

  public query func icrc1_name() : async Text {
    tokenName;
  };

  public query func icrc1_symbol() : async Text {
    tokenSymbol;
  };

  public query func icrc1_decimals() : async Nat8 {
    tokenDecimals;
  };

  public query func icrc1_fee() : async Nat {
    transferFee;
  };

  public query func icrc1_total_supply() : async Nat {
    totalSupply;
  };

  public query func icrc1_minting_account() : async ?Account {
    minting_account;
  };

  public query func icrc1_balance_of(account : Account) : async Nat {
    switch (balances.get(account.owner)) {
      case (?balance) balance;
      case null 0;
    };
  };

  public shared (msg) func icrc1_transfer(args : TransferArgs) : async TransferResult {
    let from_account = msg.caller;

    // Get current balances
    let from_balance = switch (balances.get(from_account)) {
      case (?balance) balance;
      case null 0;
    };

    let to_balance = switch (balances.get(args.to.owner)) {
      case (?balance) balance;
      case null 0;
    };

    let fee = switch (args.fee) {
      case (?f) f;
      case null transferFee;
    };

    let total_amount = args.amount + fee;

    // Check sufficient balance
    if (from_balance < total_amount) {
      return #Err(#InsufficientFunds({ balance = from_balance }));
    };

    // Execute transfer
    let new_from_balance = from_balance - total_amount;
    let new_to_balance = to_balance + args.amount;

    balances.put(from_account, new_from_balance);
    balances.put(args.to.owner, new_to_balance);

    let txIndex = nextTransactionIndex;
    nextTransactionIndex += 1;

    Debug.print("Transfer completed: " # Nat.toText(args.amount) # " tokens");

    #Ok(txIndex);
  };

  /**
     * Mint new tokens (only callable by minting account)
     */
  public shared (msg) func mint(to : Account, amount : Nat) : async Result.Result<Nat, Text> {
    // Check authorization
    switch (minting_account) {
      case (?minter) {
        if (minter.owner != msg.caller) {
          return #err("Only minting account can mint tokens");
        };
      };
      case null {
        return #err("No minting account set");
      };
    };

    if (amount == 0) {
      return #err("Cannot mint zero tokens");
    };

    // Update balances
    let current_balance = switch (balances.get(to.owner)) {
      case (?balance) balance;
      case null 0;
    };

    balances.put(to.owner, current_balance + amount);
    totalSupply += amount;

    let txIndex = nextTransactionIndex;
    nextTransactionIndex += 1;

    Debug.print("Minted " # Nat.toText(amount) # " tokens");

    #ok(txIndex);
  };

  /**
     * Get account balance (convenience method)
     */
  public query func getBalance(owner : Principal) : async Nat {
    switch (balances.get(owner)) {
      case (?balance) balance;
      case null 0;
    };
  };

  /**
     * Get ledger info
     */
  public query func getLedgerInfo() : async {
    name : Text;
    symbol : Text;
    decimals : Nat8;
    totalSupply : Nat;
    fee : Nat;
  } {
    {
      name = tokenName;
      symbol = tokenSymbol;
      decimals = tokenDecimals;
      totalSupply = totalSupply;
      fee = transferFee;
    };
  };

  /**
     * Get all balances (for debugging)
     */
  public query func getAllBalances() : async [(Principal, Nat)] {
    Iter.toArray(balances.entries());
  };
};
