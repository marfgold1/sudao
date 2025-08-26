import Principal "mo:base/Principal";
import Result "mo:base/Result";

module {
    public type InitArgs = {
        token0_ledger_id : Principal;
        token1_ledger_id : Principal;
        owner : Principal;
    };

    public type AddLiquidityArgs = {
        amount0_desired : Nat;
        amount1_desired : Nat;
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
        #ApprovalRequired : Text;
    };

    public type CommonAMMResult = Result.Result<Nat, AMMError>;
}