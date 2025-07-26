import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import Error "mo:base/Error";

actor AMM {

  // ICRC-1/ICRC-2 Types
  type Account = {
    owner : Principal;
    subaccount : ?[Nat8];
  };

  type TransferArgs = {
    from_subaccount : ?[Nat8];
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?[Nat8];
    created_at_time : ?Nat64;
  };

  type TransferFromArgs = {
    spender_subaccount : ?[Nat8];
    from : Account;
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?[Nat8];
    created_at_time : ?Nat64;
  };

  type TransferResult = {
    #Ok : Nat;
    #Err : {
      #BadFee : { expected_fee : Nat };
      #BadBurn : { min_burn_amount : Nat };
      #InsufficientFunds : { balance : Nat };
      #TooOld;
      #CreatedInFuture : { ledger_time : Nat64 };
      #Duplicate : { duplicate_of : Nat };
      #TemporarilyUnavailable;
      #GenericError : { error_code : Nat; message : Text };
    };
  };

  // AMM Types
  public type SwapArgs = {
    token_in_id : Principal;
    amount_in : Nat;
    min_amount_out : Nat;
  };

  public type AddLiquidityArgs = {
    amount0_desired : Nat;
    amount1_desired : Nat;
    amount0_min : ?Nat;
    amount1_min : ?Nat;
  };

  public type RemoveLiquidityArgs = {
    lp_tokens_to_burn : Nat;
    amount0_min : ?Nat;
    amount1_min : ?Nat;
  };

  public type AMMError = {
    #InsufficientReserve;
    #InsufficientLiquidity;
    #InsufficientInputAmount;
    #InvalidToken;
    #SlippageExceeded;
    #Unauthorized;
    #TransferFailed : Text;
  };

  public type LiquidityInfo = {
    reserve0 : Nat;
    reserve1 : Nat;
    total_supply : Nat;
    user_balance : Nat;
  };

  // State
  private stable var token0_ledger_id : ?Principal = null;
  private stable var token1_ledger_id : ?Principal = null;
  private stable var reserve0 : Nat = 0;
  private stable var reserve1 : Nat = 0;
  private stable var total_lp_supply : Nat = 0;
  private stable var owner : ?Principal = null;
  private stable var fee_rate : Nat = 3;
  private stable var is_initialized : Bool = false;

  private stable var lp_balances_entries : [(Principal, Nat)] = [];
  private var lp_balances = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);

  private let MINIMUM_LIQUIDITY : Nat = 1000;
  private let FEE_DENOMINATOR : Nat = 1000;

  // Upgrade hooks
  system func preupgrade() {
    lp_balances_entries := Iter.toArray(lp_balances.entries());
  };

  system func postupgrade() {
    lp_balances := HashMap.fromIter<Principal, Nat>(lp_balances_entries.vals(), lp_balances_entries.size(), Principal.equal, Principal.hash);
    lp_balances_entries := [];
  };

  // Initialize AMM
  public shared (msg) func initialize(
    _token0_ledger_id : Principal,
    _token1_ledger_id : Principal,
    _owner : Principal,
  ) : async Result.Result<(), Text> {
    if (is_initialized) {
      return #err("AMM already initialized");
    };

    if (_token0_ledger_id == _token1_ledger_id) {
      return #err("Tokens must be different");
    };

    token0_ledger_id := ?_token0_ledger_id;
    token1_ledger_id := ?_token1_ledger_id;
    owner := ?_owner;
    is_initialized := true;

    Debug.print("AMM initialized");
    #ok();
  };

  // Add liquidity
  public shared (msg) func add_liquidity(args : AddLiquidityArgs) : async Result.Result<Nat, AMMError> {
    if (not is_initialized) {
      return #err(#Unauthorized);
    };

    let (?token0_id) = token0_ledger_id else {
      return #err(#InvalidToken);
    };
    let (?token1_id) = token1_ledger_id else {
      return #err(#InvalidToken);
    };

    let caller = msg.caller;
    let amount0_desired = args.amount0_desired;
    let amount1_desired = args.amount1_desired;

    if (amount0_desired == 0 or amount1_desired == 0) {
      return #err(#InsufficientInputAmount);
    };

    // Calculate optimal amounts
    let (amount0_optimal, amount1_optimal) = if (reserve0 == 0 and reserve1 == 0) {
      (amount0_desired, amount1_desired);
    } else {
      let amount1_optimal_calc = (amount0_desired * reserve1) / reserve0;
      if (amount1_optimal_calc <= amount1_desired) {
        let amount1_min = switch (args.amount1_min) {
          case (?min) min;
          case null 0;
        };
        if (amount1_optimal_calc < amount1_min) {
          return #err(#SlippageExceeded);
        };
        (amount0_desired, amount1_optimal_calc);
      } else {
        let amount0_optimal_calc = (amount1_desired * reserve0) / reserve1;
        let amount0_min = switch (args.amount0_min) {
          case (?min) min;
          case null 0;
        };
        if (amount0_optimal_calc < amount0_min) {
          return #err(#SlippageExceeded);
        };
        (amount0_optimal_calc, amount1_desired);
      };
    };

    // Transfer tokens
    try {
      await transfer_from_user(token0_id, caller, amount0_optimal);
      await transfer_from_user(token1_id, caller, amount1_optimal);
    } catch (error) {
      return #err(#TransferFailed(Error.message(error)));
    };

    // Calculate LP tokens
    let liquidity = if (total_lp_supply == 0) {
      let initial_liquidity = Int.abs(Float.toInt(Float.sqrt(Float.fromInt(amount0_optimal * amount1_optimal))));
      if (initial_liquidity < MINIMUM_LIQUIDITY) {
        return #err(#InsufficientLiquidity);
      };
      initial_liquidity - MINIMUM_LIQUIDITY;
    } else {
      let liquidity0 = (amount0_optimal * total_lp_supply) / reserve0;
      let liquidity1 = (amount1_optimal * total_lp_supply) / reserve1;
      Nat.min(liquidity0, liquidity1);
    };

    if (liquidity == 0) {
      return #err(#InsufficientLiquidity);
    };

    // Update state
    reserve0 += amount0_optimal;
    reserve1 += amount1_optimal;
    total_lp_supply += liquidity;

    let current_balance = switch (lp_balances.get(caller)) {
      case (?balance) balance;
      case null 0;
    };
    lp_balances.put(caller, current_balance + liquidity);

    Debug.print("Added liquidity: " # Nat.toText(liquidity) # " LP tokens");
    #ok(liquidity);
  };

  // Swap tokens
  public shared (msg) func swap(args : SwapArgs) : async Result.Result<Nat, AMMError> {
    if (not is_initialized) {
      return #err(#Unauthorized);
    };

    let (?token0_id) = token0_ledger_id else {
      return #err(#InvalidToken);
    };
    let (?token1_id) = token1_ledger_id else {
      return #err(#InvalidToken);
    };

    let caller = msg.caller;
    let token_in_id = args.token_in_id;
    let amount_in = args.amount_in;
    let min_amount_out = args.min_amount_out;

    if (amount_in == 0) {
      return #err(#InsufficientInputAmount);
    };

    if (token_in_id != token0_id and token_in_id != token1_id) {
      return #err(#InvalidToken);
    };

    // Determine reserves and output token
    let (reserve_in, reserve_out, token_out_id) = if (token_in_id == token0_id) {
      (reserve0, reserve1, token1_id);
    } else { (reserve1, reserve0, token0_id) };

    if (reserve_in == 0 or reserve_out == 0) {
      return #err(#InsufficientReserve);
    };

    // Calculate output with fee
    let amount_in_with_fee = amount_in * (FEE_DENOMINATOR - fee_rate);
    let numerator = amount_in_with_fee * reserve_out;
    let denominator = (reserve_in * FEE_DENOMINATOR) + amount_in_with_fee;
    let amount_out = numerator / denominator;

    if (amount_out < min_amount_out) {
      return #err(#SlippageExceeded);
    };

    if (amount_out >= reserve_out) {
      return #err(#InsufficientReserve);
    };

    // Execute transfers
    try {
      await transfer_from_user(token_in_id, caller, amount_in);
    } catch (error) {
      return #err(#TransferFailed("Input failed: " # Error.message(error)));
    };

    // Update reserves
    if (token_in_id == token0_id) {
      reserve0 += amount_in;
      reserve1 -= amount_out;
    } else {
      reserve1 += amount_in;
      reserve0 -= amount_out;
    };

    try {
      await transfer_to_user(token_out_id, caller, amount_out);
    } catch (error) {
      // Revert reserves
      if (token_in_id == token0_id) {
        reserve0 -= amount_in;
        reserve1 += amount_out;
      } else {
        reserve1 -= amount_in;
        reserve0 += amount_out;
      };
      return #err(#TransferFailed("Output failed: " # Error.message(error)));
    };

    Debug.print("Swap completed: " # Nat.toText(amount_out) # " tokens");
    #ok(amount_out);
  };

  // Query functions
  public query func get_reserves() : async (Nat, Nat) { (reserve0, reserve1) };

  public query func get_swap_quote(token_in_id : Principal, amount_in : Nat) : async Result.Result<Nat, AMMError> {
    if (not is_initialized) {
      return #err(#Unauthorized);
    };

    let (?token0_id) = token0_ledger_id else {
      return #err(#InvalidToken);
    };
    let (?token1_id) = token1_ledger_id else {
      return #err(#InvalidToken);
    };

    if (amount_in == 0) {
      return #err(#InsufficientInputAmount);
    };

    if (token_in_id != token0_id and token_in_id != token1_id) {
      return #err(#InvalidToken);
    };

    let (reserve_in, reserve_out) = if (token_in_id == token0_id) {
      (reserve0, reserve1);
    } else { (reserve1, reserve0) };

    if (reserve_in == 0 or reserve_out == 0) {
      return #err(#InsufficientReserve);
    };

    let amount_in_with_fee = amount_in * (FEE_DENOMINATOR - fee_rate);
    let numerator = amount_in_with_fee * reserve_out;
    let denominator = (reserve_in * FEE_DENOMINATOR) + amount_in_with_fee;
    let amount_out = numerator / denominator;

    #ok(amount_out);
  };

  public query func get_liquidity_info(user : ?Principal) : async LiquidityInfo {
    let user_balance = switch (user) {
      case (?u) {
        switch (lp_balances.get(u)) {
          case (?balance) balance;
          case null 0;
        };
      };
      case null 0;
    };

    {
      reserve0 = reserve0;
      reserve1 = reserve1;
      total_supply = total_lp_supply;
      user_balance = user_balance;
    };
  };

  public query func get_token_info() : async {
    token0 : ?Principal;
    token1 : ?Principal;
    fee_rate : Nat;
    is_initialized : Bool;
  } {
    {
      token0 = token0_ledger_id;
      token1 = token1_ledger_id;
      fee_rate = fee_rate;
      is_initialized = is_initialized;
    };
  };

  // Private helpers
  private func transfer_from_user(token_id : Principal, from : Principal, amount : Nat) : async () {
    let ledger : actor {
      icrc2_transfer_from : (TransferFromArgs) -> async TransferResult;
    } = actor (Principal.toText(token_id));

    let args : TransferFromArgs = {
      spender_subaccount = null;
      from = { owner = from; subaccount = null };
      to = { owner = Principal.fromActor(AMM); subaccount = null };
      amount = amount;
      fee = null;
      memo = null;
      created_at_time = null;
    };

    let result = await ledger.icrc2_transfer_from(args);
    switch (result) {
      case (#Ok(_)) {};
      case (#Err(_)) {
        throw Error.reject("Transfer from user failed");
      };
    };
  };

  private func transfer_to_user(token_id : Principal, to : Principal, amount : Nat) : async () {
    let ledger : actor {
      icrc1_transfer : (TransferArgs) -> async TransferResult;
    } = actor (Principal.toText(token_id));

    let args : TransferArgs = {
      from_subaccount = null;
      to = { owner = to; subaccount = null };
      amount = amount;
      fee = null;
      memo = null;
      created_at_time = null;
    };

    let result = await ledger.icrc1_transfer(args);
    switch (result) {
      case (#Ok(_)) {};
      case (#Err(_)) {
        throw Error.reject("Transfer to user failed");
      };
    };
  };

  // Admin functions
  public shared (msg) func set_fee_rate(new_fee_rate : Nat) : async Result.Result<(), Text> {
    let (?current_owner) = owner else {
      return #err("No owner set");
    };

    if (msg.caller != current_owner) {
      return #err("Unauthorized");
    };

    if (new_fee_rate > 50) {
      return #err("Fee rate too high");
    };

    fee_rate := new_fee_rate;
    #ok();
  };
};
