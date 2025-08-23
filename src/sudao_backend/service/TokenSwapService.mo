import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Float "mo:base/Float";
import Array "mo:base/Array";

module {
  public type SwapError = {
    #insufficientBalance;
    #insufficientLiquidity;
    #invalidAmount;
    #unauthorized;
    #swapDisabled;
    #priceToleranceExceeded;
  };

  public type SwapRecord = {
    id : Text;
    user : Principal;
    swapType : SwapType;
    amountIn : Nat;
    amountOut : Nat;
    rate : Float;
    timestamp : Time.Time;
    status : SwapStatus;
  };

  public type SwapType = {
    #tokenToIcp; // Governance token -> ICP
    #icpToToken; // ICP -> Governance token
  };

  public type SwapStatus = {
    #pending;
    #completed;
    #failed : Text;
  };

  public type LiquidityPool = {
    tokenReserve : Nat; // Amount of governance tokens in pool
    icpReserve : Nat; // Amount of ICP in pool (in e8s)
    totalShares : Nat; // Total liquidity provider shares
    isActive : Bool; // Whether swapping is enabled
  };

  public type SwapQuote = {
    amountOut : Nat;
    priceImpact : Float;
    exchangeRate : Float;
    fee : Nat;
  };

  public class TokenSwapService() {
    private var liquidityPool : LiquidityPool = {
      tokenReserve = 0;
      icpReserve = 0;
      totalShares = 0;
      isActive = false;
    };

    private var swapHistory = HashMap.HashMap<Text, SwapRecord>(10, func(a : Text, b : Text) : Bool = a == b, func(t : Text) : Nat32 = 0);
    private var nextSwapId : Nat = 1;
    private var swapFeePercent : Float = 0.3; // 0.3% fee
    private var minLiquidity : Nat = 1000; // Minimum tokens for liquidity

    /**
         * Initialize the liquidity pool with initial reserves
         */
    public func initializeLiquidity(
      initialTokens : Nat,
      initialIcp : Nat,
    ) : Result.Result<(), SwapError> {
      if (liquidityPool.isActive) {
        return #err(#swapDisabled);
      };

      if (initialTokens < minLiquidity or initialIcp < minLiquidity) {
        return #err(#insufficientLiquidity);
      };

      liquidityPool := {
        tokenReserve = initialTokens;
        icpReserve = initialIcp;
        totalShares = initialTokens; // Initial shares equal to token amount
        isActive = true;
      };

      Debug.print("Liquidity pool initialized with " # Nat.toText(initialTokens) # " tokens and " # Nat.toText(initialIcp) # " ICP");
      #ok();
    };

    /**
         * Get quote for swapping tokens to ICP
         */
    public func getTokenToIcpQuote(tokenAmount : Nat) : Result.Result<SwapQuote, SwapError> {
      if (not liquidityPool.isActive) {
        return #err(#swapDisabled);
      };

      if (tokenAmount == 0) {
        return #err(#invalidAmount);
      };

      if (tokenAmount >= liquidityPool.tokenReserve) {
        return #err(#insufficientLiquidity);
      };

      // Calculate output using constant product formula: x * y = k
      let fee = Float.fromInt(tokenAmount) * (swapFeePercent / 100.0);
      let tokenAmountAfterFee = tokenAmount - Int.abs(Float.toInt(fee));

      let numerator = Float.fromInt(tokenAmountAfterFee) * Float.fromInt(liquidityPool.icpReserve);
      let denominator = Float.fromInt(liquidityPool.tokenReserve) + Float.fromInt(tokenAmountAfterFee);
      let icpOut = Int.abs(Float.toInt(numerator / denominator));

      let priceImpact = (Float.fromInt(tokenAmountAfterFee) / Float.fromInt(liquidityPool.tokenReserve)) * 100.0;
      let exchangeRate = Float.fromInt(icpOut) / Float.fromInt(tokenAmount);

      #ok({
        amountOut = icpOut;
        priceImpact = priceImpact;
        exchangeRate = exchangeRate;
        fee = Int.abs(Float.toInt(fee));
      });
    };

    /**
         * Get quote for swapping ICP to tokens
         */
    public func getIcpToTokenQuote(icpAmount : Nat) : Result.Result<SwapQuote, SwapError> {
      if (not liquidityPool.isActive) {
        return #err(#swapDisabled);
      };

      if (icpAmount == 0) {
        return #err(#invalidAmount);
      };

      if (icpAmount >= liquidityPool.icpReserve) {
        return #err(#insufficientLiquidity);
      };

      // Calculate output using constant product formula
      let fee = Float.fromInt(icpAmount) * (swapFeePercent / 100.0);
      let icpAmountAfterFee = icpAmount - Int.abs(Float.toInt(fee));

      let numerator = Float.fromInt(icpAmountAfterFee) * Float.fromInt(liquidityPool.tokenReserve);
      let denominator = Float.fromInt(liquidityPool.icpReserve) + Float.fromInt(icpAmountAfterFee);
      let tokensOut = Int.abs(Float.toInt(numerator / denominator));

      let priceImpact = (Float.fromInt(icpAmountAfterFee) / Float.fromInt(liquidityPool.icpReserve)) * 100.0;
      let exchangeRate = Float.fromInt(tokensOut) / Float.fromInt(icpAmount);

      #ok({
        amountOut = tokensOut;
        priceImpact = priceImpact;
        exchangeRate = exchangeRate;
        fee = Int.abs(Float.toInt(fee));
      });
    };

    /**
         * Execute token to ICP swap
         */
    public func executeTokenToIcpSwap(
      user : Principal,
      tokenAmount : Nat,
      minIcpOut : Nat,
    ) : async Result.Result<SwapRecord, SwapError> {
      switch (getTokenToIcpQuote(tokenAmount)) {
        case (#err(error)) return #err(error);
        case (#ok(quote)) {
          if (quote.amountOut < minIcpOut) {
            return #err(#priceToleranceExceeded);
          };

          // Update reserves
          liquidityPool := {
            liquidityPool with
            tokenReserve = liquidityPool.tokenReserve + tokenAmount;
            icpReserve = liquidityPool.icpReserve - quote.amountOut;
          };

          // Create swap record
          let swapId = "swap_" # Nat.toText(nextSwapId);
          nextSwapId += 1;

          let swapRecord : SwapRecord = {
            id = swapId;
            user = user;
            swapType = #tokenToIcp;
            amountIn = tokenAmount;
            amountOut = quote.amountOut;
            rate = quote.exchangeRate;
            timestamp = Time.now();
            status = #completed;
          };

          swapHistory.put(swapId, swapRecord);

          Debug.print("Token to ICP swap completed: " # Nat.toText(tokenAmount) # " tokens -> " # Nat.toText(quote.amountOut) # " ICP");
          #ok(swapRecord);
        };
      };
    };

    /**
         * Execute ICP to token swap
         */
    public func executeIcpToTokenSwap(
      user : Principal,
      icpAmount : Nat,
      minTokensOut : Nat,
    ) : async Result.Result<SwapRecord, SwapError> {
      switch (getIcpToTokenQuote(icpAmount)) {
        case (#err(error)) return #err(error);
        case (#ok(quote)) {
          if (quote.amountOut < minTokensOut) {
            return #err(#priceToleranceExceeded);
          };

          // Update reserves
          liquidityPool := {
            liquidityPool with
            icpReserve = liquidityPool.icpReserve + icpAmount;
            tokenReserve = liquidityPool.tokenReserve - quote.amountOut;
          };

          // Create swap record
          let swapId = "swap_" # Nat.toText(nextSwapId);
          nextSwapId += 1;

          let swapRecord : SwapRecord = {
            id = swapId;
            user = user;
            swapType = #icpToToken;
            amountIn = icpAmount;
            amountOut = quote.amountOut;
            rate = quote.exchangeRate;
            timestamp = Time.now();
            status = #completed;
          };

          swapHistory.put(swapId, swapRecord);

          Debug.print("ICP to token swap completed: " # Nat.toText(icpAmount) # " ICP -> " # Nat.toText(quote.amountOut) # " tokens");
          #ok(swapRecord);
        };
      };
    };

    /**
         * Add liquidity to the pool
         */
    public func addLiquidity(
      tokenAmount : Nat,
      icpAmount : Nat,
      provider : Principal,
    ) : Result.Result<Nat, SwapError> {
      if (not liquidityPool.isActive) {
        return #err(#swapDisabled);
      };

      if (tokenAmount == 0 or icpAmount == 0) {
        return #err(#invalidAmount);
      };

      // Calculate shares to mint (simplified version)
      let shares = if (liquidityPool.totalShares == 0) {
        tokenAmount // Initial liquidity provider gets shares equal to tokens
      } else {
        // Proportional to existing pool
        let tokenRatio = Float.fromInt(tokenAmount) / Float.fromInt(liquidityPool.tokenReserve);
        Int.abs(Float.toInt(tokenRatio * Float.fromInt(liquidityPool.totalShares)));
      };

      // Update pool
      liquidityPool := {
        tokenReserve = liquidityPool.tokenReserve + tokenAmount;
        icpReserve = liquidityPool.icpReserve + icpAmount;
        totalShares = liquidityPool.totalShares + shares;
        isActive = liquidityPool.isActive;
      };

      Debug.print("Liquidity added: " # Nat.toText(tokenAmount) # " tokens, " # Nat.toText(icpAmount) # " ICP, " # Nat.toText(shares) # " shares");
      #ok(shares);
    };

    /**
         * Get current liquidity pool state
         */
    public func getLiquidityPool() : LiquidityPool {
      liquidityPool;
    };

    /**
         * Get swap history for a user
         */
    public func getUserSwapHistory(user : Principal) : [SwapRecord] {
      let allSwaps = Iter.toArray(swapHistory.vals());
      Array.filter<SwapRecord>(allSwaps, func(swap) = Principal.equal(swap.user, user));
    };

    /**
         * Get all swap history (admin function)
         */
    public func getAllSwapHistory() : [SwapRecord] {
      Iter.toArray(swapHistory.vals());
    };

    /**
         * Set swap fee percentage (admin function)
         */
    public func setSwapFee(newFeePercent : Float) : Result.Result<(), SwapError> {
      if (newFeePercent < 0.0 or newFeePercent > 5.0) {
        // Max 5% fee
        return #err(#invalidAmount);
      };
      swapFeePercent := newFeePercent;
      #ok();
    };

    /**
         * Enable/disable swapping
         */
    public func setSwapEnabled(enabled : Bool) {
      liquidityPool := {
        liquidityPool with isActive = enabled;
      };
    };

    /**
         * Get current exchange rates
         */
    public func getExchangeRates() : {
      tokenToIcpRate : Float;
      icpToTokenRate : Float;
      totalLiquidity : Nat;
    } {
      let tokenToIcpRate = if (liquidityPool.tokenReserve > 0) {
        Float.fromInt(liquidityPool.icpReserve) / Float.fromInt(liquidityPool.tokenReserve);
      } else { 0.0 };

      let icpToTokenRate = if (liquidityPool.icpReserve > 0) {
        Float.fromInt(liquidityPool.tokenReserve) / Float.fromInt(liquidityPool.icpReserve);
      } else { 0.0 };

      {
        tokenToIcpRate = tokenToIcpRate;
        icpToTokenRate = icpToTokenRate;
        totalLiquidity = liquidityPool.tokenReserve + liquidityPool.icpReserve;
      };
    };

    /**
         * For stable variable handling
         */
    public func stableGet() : {
      pool : LiquidityPool;
      swaps : [(Text, SwapRecord)];
      nextId : Nat;
      fee : Float;
    } {
      {
        pool = liquidityPool;
        swaps = Iter.toArray(swapHistory.entries());
        nextId = nextSwapId;
        fee = swapFeePercent;
      };
    };

    public func stableSet(
      data : {
        pool : LiquidityPool;
        swaps : [(Text, SwapRecord)];
        nextId : Nat;
        fee : Float;
      }
    ) {
      liquidityPool := data.pool;
      swapHistory := HashMap.fromIter<Text, SwapRecord>(data.swaps.vals(), data.swaps.size(), func(a : Text, b : Text) : Bool = a == b, func(t : Text) : Nat32 = 0);
      nextSwapId := data.nextId;
      swapFeePercent := data.fee;
    };
  };
};
