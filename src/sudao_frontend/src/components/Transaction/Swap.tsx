import { useEffect, useState, useCallback } from "react";
import { useIdentity, useAccounts } from "@nfid/identitykit/react";
import { Principal } from "@dfinity/principal";
import { useAgents } from "@/hooks/useAgents";
import { useAMM } from "@/hooks/useAMM";
import { getVariant, MakeOpt, PrincipalReq } from "@/utils/converter";
import { ApproveArgs } from "declarations/icp_ledger_canister/icp_ledger_canister.did";

export default function Swap() {
  const identity = useIdentity();
  const accounts = useAccounts();
  const { agents, canisterIds: {daoAmm: daoAmmCanId} } = useAgents();
  const { tokenInfo, handleGetQuote, handleSwap: handleSwapAmm } = useAMM();

  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  // Swap state
  const [amountIn, setAmountIn] = useState<bigint>(0n);
  const [amountOut, setAmountOut] = useState<bigint>(0n);
  const [slippage, setSlippage] = useState<number>(1); // 1% default slippage
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [userBalances, setUserBalances] = useState<{
    icp: number;
    governance: number;
  }>({ icp: 0, governance: 0 });

  const addDebugLog = useCallback((message: string) => {
    console.log(`[SWAP DEBUG] ${message}`);
    setDebugInfo((prev) => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  // Set principal on login/logout
  useEffect(() => {
    addDebugLog("Setting principal - accounts length: " + (accounts?.length || 0));
    let principal = null;
    if (accounts && accounts.length > 0) {
      principal = accounts[0].principal;
      addDebugLog("Using account principal: " + principal.toString());
    } else if (identity) {
      principal = identity.getPrincipal();
      addDebugLog("Using identity principal: " + principal.toString());
    } else {
      addDebugLog("No accounts or identity found");
    }
    setUserPrincipal(principal ? principal.toString() : null);
  }, [identity, accounts, addDebugLog]);

  // Load AMM info and user balances
  useEffect(() => {
    if (!userPrincipal || !agents.daoLedger) return;

    const loadData = async () => {
      try {
        addDebugLog("Loading user balances");
        const icpBalance = await agents.icpLedger.icrc1_balance_of({
          owner: Principal.fromText(userPrincipal),
          subaccount: [],
        });
        const governanceBalance = await agents.daoLedger!.icrc1_balance_of({
          owner: Principal.fromText(userPrincipal),
          subaccount: [],
        });

        setUserBalances({
          icp: Number(icpBalance),
          governance: Number(governanceBalance),
        });
        addDebugLog(
          `Balances loaded - ICP: ${icpBalance}, Governance: ${governanceBalance}`
        );
      } catch (error) {
        addDebugLog(
          "Failed to load data: " +
            (error instanceof Error ? error.message : String(error))
        );
      }
    };

    loadData();
  }, [agents.daoLedger, agents.icpLedger, userPrincipal, addDebugLog]);

  // Calculate swap quote
  const calculateQuote = useCallback(async () => {
    if (!tokenInfo || amountIn <= 0) {
      setAmountOut(0n);
      return;
    }

    try {
      addDebugLog("Calculating swap quote for amount: " + amountIn);
      const quote = await handleGetQuote(
        tokenInfo.token0.toString(),
        BigInt(amountIn)
      );

      const outputAmount = getVariant(quote, "ok")
      if (outputAmount !== null) {
        setAmountOut(outputAmount);
        addDebugLog("Quote calculated: " + outputAmount);
      } else {
        throw new Error("Quote calculation failed: " + JSON.stringify(quote));
      }
    } catch (error) {
      addDebugLog(
        "Quote calculation error: " +
          (error instanceof Error ? error.message : String(error))
      );
      setAmountOut(0n);
    }
  }, [tokenInfo, handleGetQuote, amountIn, setAmountOut, addDebugLog]);

  // Update quote when amount changes
  useEffect(() => {
    calculateQuote();
  }, [calculateQuote]);

  // Step 1: Approve Local ICP for AMM
  const handleApprove = async () => {
    if (!userPrincipal || !daoAmmCanId || amountIn <= 0) {
      setStatus({
        type: "error",
        message: "Missing required data for approval",
      });
      return;
    }

    setIsLoading(true);
    setStatus(null);
    addDebugLog("Starting approval process");

    try {
      const approveArgs: ApproveArgs = {
        from_subaccount: [],
        spender: {
          owner: PrincipalReq(daoAmmCanId!),
          subaccount: [] as [],
        },
        fee: MakeOpt(BigInt(10000)),
        memo: [],
        amount: BigInt(amountIn),
        created_at_time: MakeOpt(BigInt(Date.now() * 1000000)),
        expected_allowance: MakeOpt(0n),
        expires_at: MakeOpt(BigInt((Date.now() + 10000000000000) * 1000000)),
      };

      console.log("Approval args: " + approveArgs);
      const result = await agents.icpLedger.icrc2_approve(approveArgs);
      console.log("Approval result: " + result);

      setStatus({
        type: "success",
        message: "Approval successful! You can now perform the swap.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Approval failed: " + errorMessage);
      setStatus({ type: "error", message: "Approval failed: " + errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Perform the swap
  const handleSwap = async () => {
    if (!tokenInfo || amountIn <= 0 || amountOut <= 0) {
      setStatus({ type: "error", message: "Missing required data for swap" });
      return;
    }

    setIsLoading(true);
    setStatus(null);
    addDebugLog("Starting swap process");

    try {
      const minAmountOut = BigInt(Math.floor(Number(amountOut) * (1 - slippage / 100)));
      addDebugLog(
        `Swap: ${amountIn} ICP -> min ${minAmountOut} Governance (${slippage}% slippage)`
      );

      const result = await handleSwapAmm(tokenInfo.token0.toString(), amountIn, minAmountOut);
      const actualOutput = getVariant(result, "ok")
      if (actualOutput !== null) {
        addDebugLog("Swap successful! Output: " + actualOutput);
        setStatus({
          type: "success",
          message: `Swap successful! Received ${actualOutput} Governance tokens.`,
        });

        // Refresh balances
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        addDebugLog("Swap failed: " + JSON.stringify(result));
        setStatus({
          type: "error",
          message: "Swap failed: " + JSON.stringify(result),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Swap error: " + errorMessage);
      setStatus({ type: "error", message: "Swap failed: " + errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userPrincipal) {
    return (
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">AMM Swap</h2>
        <p>Please log in with NFID to use the swap functionality.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        AMM Swap: Local ICP ↔ Governance Token
      </h2>

      {/* Status Display */}
      {status && (
        <div
          className={`my-4 p-2 border rounded ${
            status.type === "error"
              ? "bg-red-100 border-red-300 text-red-800"
              : status.type === "success"
              ? "bg-green-100 border-green-300 text-green-800"
              : "bg-blue-100 border-blue-300 text-blue-800"
          }`}
        >
          <p>{status.message}</p>
        </div>
      )}

      {/* User Info */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="text-sm">
          <strong>User:</strong> {userPrincipal}
        </p>
        <p className="text-sm">
          <strong>Local ICP Balance:</strong>{" "}
          {userBalances.icp.toLocaleString()}
        </p>
        <p className="text-sm">
          <strong>Governance Balance:</strong>{" "}
          {userBalances.governance.toLocaleString()}
        </p>
        <p className="text-sm">
          <strong>Actors:</strong> AMM {agents.daoAmm ? "✅" : "❌"} | ICP{" "}
          {agents.icpLedger ? "✅" : "❌"} | Governance {agents.daoLedger ? "✅" : "❌"}
        </p>
      </div>

      {/* AMM Info */}
      {tokenInfo && (
        <div className="mb-4 p-2 bg-blue-100 rounded">
          <h3 className="font-semibold">AMM Information</h3>
          <p className="text-sm">Token 0 (Local ICP): {tokenInfo.token0.toString()}</p>
          <p className="text-sm">Token 1 (Governance): {tokenInfo.token1.toString()}</p>
          <p className="text-sm">Fee Rate: {tokenInfo.fee_rate.toString()}‰</p>
          <p className="text-sm">Total Swaps: {tokenInfo.swap_count.toString()}</p>
        </div>
      )}

      {/* Swap Interface */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Amount of Local ICP to Swap:
          </label>
          <input
            type="number"
            value={amountIn.toString()}
            onChange={(e) => setAmountIn(BigInt(e.target.value))}
            className="w-full p-2 border rounded"
            placeholder="Enter amount"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Slippage Tolerance (%):
          </label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
            className="w-full p-2 border rounded"
            placeholder="1"
            min="0.1"
            max="50"
            step="0.1"
          />
        </div>

        {amountOut > 0 && (
          <div className="p-2 bg-yellow-100 border rounded">
            <p className="text-sm">
              <strong>Estimated Output:</strong> {amountOut.toLocaleString()}{" "}
              Governance tokens
            </p>
            <p className="text-sm">
              <strong>Minimum Output (with {slippage}% slippage):</strong>{" "}
              {BigInt(Math.floor(Number(amountOut) * (1 - slippage / 100))).toLocaleString()}{" "}
              Governance tokens
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleApprove}
            disabled={isLoading || amountIn <= 0}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Step 1: Approve Local ICP"}
          </button>

          <button
            onClick={handleSwap}
            disabled={isLoading || amountIn <= 0 || amountOut <= 0}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Step 2: Execute Swap"}
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {debugInfo.length > 0 && (
        <div className="mt-4 p-2 bg-gray-100 border rounded text-xs">
          <h4 className="font-semibold">Debug Log:</h4>
          {debugInfo.map((log, index) => (
            <div key={index} className="text-gray-600">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
