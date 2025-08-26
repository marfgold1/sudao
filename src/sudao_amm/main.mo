import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Error "mo:base/Error";
import Text "mo:base/Text";
import Nat64 "mo:base/Nat64";
import ICRC2 "mo:icrc2-types";
import Map "mo:map/Map";
import {phash; nhash} "mo:map/Map";
import Types "Types";
import Time "mo:base/Time";
import Iter "mo:base/Iter";

persistent actor class AMM(initArgs : Types.InitArgs) = this {
  // AMM Types
  public type SwapArgs = {
    token_in_id : Principal;
    amount_in : Nat;
    min_amount_out : Nat;
  };

  public type RemoveLiquidityArgs = {
    lp_tokens_to_burn : Nat;
    amount0_min : ?Nat;
    amount1_min : ?Nat;
  };

  public type LiquidityInfo = {
    reserve0 : Nat;
    reserve1 : Nat;
    total_supply : Nat;
    user_balance : Nat;
  };

  public type SwapInfo = {
    token_in_id : Principal;
    token_out_id : Principal;
    amount_in : Nat;
    amount_out : Nat;
    fee_paid : Nat;
    timestamp : Nat64;
  };

  public type TransactionRecord = {
    id : Nat;
    user : Principal;
    transaction_type : Text;
    token_in : Principal;
    token_out : ?Principal;
    amount_in : Nat;
    amount_out : Nat;
    timestamp : Nat64;
  };

  // State
  private var token0_ledger_id : Principal = initArgs.token0_ledger_id;
  private var token1_ledger_id : Principal = initArgs.token1_ledger_id;
  private var owner : Principal = initArgs.owner;
  private var reserve0 : Nat = 0;
  private var reserve1 : Nat = 0;
  private var total_lp_supply : Nat = 0;
  private var fee_rate : Nat = 3;
  private var swap_count : Nat = 0;
  private var transaction_id_counter : Nat = 0;

  private var lp_balances = Map.new<Principal, Nat>();
  private var transaction_history = Map.new<Nat, TransactionRecord>();

  private transient let MINIMUM_LIQUIDITY : Nat = 1000;
  private transient let FEE_DENOMINATOR : Nat = 1000;

  // Add liquidity
  public shared (msg) func add_liquidity(args : Types.AddLiquidityArgs) : async Types.CommonAMMResult {
    let caller = msg.caller;
    let amount0_desired = args.amount0_desired;
    let amount1_desired = args.amount1_desired;

    Debug.print("Adding liquidity: " # Nat.toText(amount0_desired) # " token0, " # Nat.toText(amount1_desired) # " token1");

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

    Debug.print("Optimal amounts: " # Nat.toText(amount0_optimal) # " token0, " # Nat.toText(amount1_optimal) # " token1");

    // Transfer tokens
    try {
      Debug.print("Transferring token0 from user");
      await transfer_from_user(token0_ledger_id, caller, amount0_optimal);
      Debug.print("Transferring token1 from user");
      await transfer_from_user(token1_ledger_id, caller, amount1_optimal);
    } catch (error) {
      Debug.print("Transfer failed: " # Error.message(error));
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

    let current_balance = switch (Map.get(lp_balances, phash, caller)) {
      case (?balance) balance;
      case null 0;
    };
    Map.set(lp_balances, phash, caller, current_balance + liquidity);

    // Record transaction
    let transaction_record : TransactionRecord = {
      id = transaction_id_counter;
      user = caller;
      transaction_type = "add_liquidity";
      token_in = token0_ledger_id;
      token_out = ?token1_ledger_id;
      amount_in = amount0_optimal;
      amount_out = amount1_optimal;
      timestamp = Nat64.fromNat(Int.abs(Time.now()));
    };
    
    Map.set(transaction_history, nhash, transaction_id_counter, transaction_record);
    transaction_id_counter += 1;

    Debug.print("Added liquidity: " # Nat.toText(liquidity) # " LP tokens. New reserves: " # Nat.toText(reserve0) # ", " # Nat.toText(reserve1));
    #ok(liquidity);
  };

  // Swap tokens
  public shared (msg) func swap(args : SwapArgs) : async Types.CommonAMMResult {
    let caller = msg.caller;
    let token_in_id = args.token_in_id;
    let amount_in = args.amount_in;
    let min_amount_out = args.min_amount_out;

    Debug.print("Swap initiated by " # Principal.toText(caller) # ": " # Nat.toText(amount_in) # " tokens from " # Principal.toText(token_in_id));

    if (amount_in == 0) {
      return #err(#InsufficientInputAmount);
    };

    if (token_in_id != token0_ledger_id and token_in_id != token1_ledger_id) {
      return #err(#InvalidToken);
    };

    // Determine reserves and output token
    let (reserve_in, reserve_out, token_out_id) = if (token_in_id == token0_ledger_id) {
      (reserve0, reserve1, token1_ledger_id);
    } else { (reserve1, reserve0, token0_ledger_id) };

    Debug.print("Reserves: in=" # Nat.toText(reserve_in) # ", out=" # Nat.toText(reserve_out));

    if (reserve_in == 0 or reserve_out == 0) {
      return #err(#InsufficientReserve);
    };

    // Calculate output with fee
    let amount_in_with_fee = amount_in * (FEE_DENOMINATOR - fee_rate) / FEE_DENOMINATOR;
    let numerator = amount_in_with_fee * reserve_out;
    let denominator = (reserve_in * FEE_DENOMINATOR) + amount_in_with_fee;
    let amount_out = numerator / denominator;
    let fee_paid = amount_in - amount_in_with_fee;

    Debug.print("Calculated output: " # Nat.toText(amount_out) # " (fee: " # Nat.toText(fee_paid) # ")");

    if (amount_out < min_amount_out) {
      Debug.print("Slippage exceeded: expected " # Nat.toText(min_amount_out) # ", got " # Nat.toText(amount_out));
      return #err(#SlippageExceeded);
    };

    if (amount_out >= reserve_out) {
      return #err(#InsufficientReserve);
    };

    // Execute transfers
    try {
      Debug.print("Pulling " # Nat.toText(amount_in) # " tokens from user");
      await transfer_from_user(token_in_id, caller, amount_in);
      Debug.print("Successfully pulled tokens from user");
    } catch (error) {
      Debug.print("Failed to pull tokens from user: " # Error.message(error));
      return #err(#TransferFailed("Input failed: " # Error.message(error)));
    };

    // Update reserves
    if (token_in_id == token0_ledger_id) {
      reserve0 += amount_in;
      reserve1 -= amount_out;
    } else {
      reserve1 += amount_in;
      reserve0 -= amount_out;
    };

    Debug.print("Updated reserves: " # Nat.toText(reserve0) # ", " # Nat.toText(reserve1));

    try {
      Debug.print("Pushing " # Nat.toText(amount_out) # " tokens to user");
      await transfer_to_user(token_out_id, caller, amount_out);
      Debug.print("Successfully pushed tokens to user");
    } catch (error) {
      Debug.print("Failed to push tokens to user: " # Error.message(error));
      // Revert reserves
      if (token_in_id == token0_ledger_id) {
        reserve0 -= amount_in;
        reserve1 += amount_out;
      } else {
        reserve1 -= amount_in;
        reserve0 += amount_out;
      };
      return #err(#TransferFailed("Output failed: " # Error.message(error)));
    };

    // Record transaction
    let transaction_record : TransactionRecord = {
      id = transaction_id_counter;
      user = caller;
      transaction_type = "swap";
      token_in = token_in_id;
      token_out = ?token_out_id;
      amount_in = amount_in;
      amount_out = amount_out;
      timestamp = Nat64.fromNat(Int.abs(Time.now()));
    };
    Map.set(transaction_history, nhash, transaction_id_counter, transaction_record);
    transaction_id_counter += 1;

    swap_count += 1;
    Debug.print("Swap completed successfully: " # Nat.toText(amount_out) # " tokens. Total swaps: " # Nat.toText(swap_count));
    #ok(amount_out);
  };

  // Query functions
  public query func get_reserves() : async (Nat, Nat) { (reserve0, reserve1) };

  public query func get_swap_quote(token_in_id : Principal, amount_in : Nat) : async Types.CommonAMMResult {
    if (amount_in == 0) {
      return #err(#InsufficientInputAmount);
    };

    if (token_in_id != token0_ledger_id and token_in_id != token1_ledger_id) {
      return #err(#InvalidToken);
    };

    let (reserve_in, reserve_out) = if (token_in_id == token0_ledger_id) {
      (reserve0, reserve1);
    } else { (reserve1, reserve0) };

    if (reserve_in == 0 or reserve_out == 0) {
      return #err(#InsufficientReserve);
    };

    Debug.print("Quote calculation - amount_in: " # Nat.toText(amount_in) # ", reserve_in: " # Nat.toText(reserve_in) # ", reserve_out: " # Nat.toText(reserve_out));
    Debug.print("Quote calculation - fee_rate: " # Nat.toText(fee_rate) # ", FEE_DENOMINATOR: " # Nat.toText(FEE_DENOMINATOR));

    let amount_in_with_fee = amount_in * (FEE_DENOMINATOR - fee_rate) / FEE_DENOMINATOR;
    Debug.print("Quote calculation - amount_in_with_fee: " # Nat.toText(amount_in_with_fee));

    let numerator = amount_in_with_fee * reserve_out;
    let denominator = (reserve_in * FEE_DENOMINATOR) + amount_in_with_fee;
    Debug.print("Quote calculation - numerator: " # Nat.toText(numerator) # ", denominator: " # Nat.toText(denominator));

    let amount_out = numerator / denominator;
    Debug.print("Quote calculation - amount_out: " # Nat.toText(amount_out));

    #ok(amount_out);
  };

  public query func get_liquidity_info(user : ?Principal) : async LiquidityInfo {
    let user_balance = switch (user) {
      case (?u) {
        switch (Map.get(lp_balances, phash, u)) {
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
    token0 : Principal;
    token1 : Principal;
    fee_rate : Nat;
    swap_count : Nat;
  } {
    {
      token0 = token0_ledger_id;
      token1 = token1_ledger_id;
      fee_rate = fee_rate;
      swap_count = swap_count;
    };
  };

  public query func get_transaction_history() : async [TransactionRecord] {
    Iter.toArray(Map.vals(transaction_history));
  };

  // Private helpers
  private func transfer_from_user(token_id : Principal, from : Principal, amount : Nat) : async () {
    Debug.print("Transferring " # Nat.toText(amount) # " tokens from " # Principal.toText(from) # " via " # Principal.toText(token_id));

    let ledger = actor (Principal.toText(token_id)) : ICRC2.Service;

    let args : ICRC2.TransferFromArgs = {
      spender_subaccount = null;
      from = { owner = from; subaccount = null };
      to = { owner = Principal.fromActor(this); subaccount = null };
      amount = amount;
      fee = null;
      memo = null;
      created_at_time = null;
    };

    let result = await ledger.icrc2_transfer_from(args);
    switch (result) {
      case (#Ok(amount)) {
        Debug.print("Transfer from user successful: " # Nat.toText(amount));
      };
      case (#Err(error)) {
        Debug.print("Transfer from user failed: " # debug_show(error));
      };
    }
  };

  private func transfer_to_user(token_id : Principal, to : Principal, amount : Nat) : async () {
    Debug.print("Transferring " # Nat.toText(amount) # " tokens to " # Principal.toText(to) # " via " # Principal.toText(token_id));

    let ledger = actor (Principal.toText(token_id)) : ICRC2.Service;

    let args : ICRC2.TransferArgs = {
      from_subaccount = null;
      to = { owner = to; subaccount = null };
      amount = amount;
      fee = null;
      memo = null;
      created_at_time = null;
    };

    let result = await ledger.icrc1_transfer(args);
    switch (result) {
      case (#Ok(amount)) {
        Debug.print("Transfer to user successful: " # Nat.toText(amount));
      };
      case (#Err(error)) {
        Debug.print("Transfer to user failed: " # debug_show(error));
      };
    }
  };

  // Admin functions
  public shared (msg) func set_fee_rate(new_fee_rate : Nat) : async Result.Result<(), Text> {
    if (msg.caller != owner) {
      return #err("Unauthorized");
    };

    if (new_fee_rate > 50) {
      return #err("Fee rate too high");
    };

    fee_rate := new_fee_rate;
    Debug.print("Fee rate updated to: " # Nat.toText(new_fee_rate));
    #ok();
  };

  // Emergency functions
  public shared (msg) func emergency_withdraw(token_id : Principal, amount : Nat) : async Result.Result<(), Text> {
    if (msg.caller != owner) {
      return #err("Unauthorized");
    };

    try {
      await transfer_to_user(token_id, owner, amount);
      #ok();
    } catch (error) {
      #err("Transfer failed: " # Error.message(error));
    };
  };

  // Debug function to reset AMM state
  public shared (msg) func reset_state() : async Result.Result<(), Text> {
    if (msg.caller != owner) {
      return #err("Unauthorized");
    };

    // Reset all state
    reserve0 := 0;
    reserve1 := 0;
    total_lp_supply := 0;
    lp_balances := Map.new<Principal, Nat>();
    swap_count := 0;

    Debug.print("AMM state reset");
    #ok();
  };
};
