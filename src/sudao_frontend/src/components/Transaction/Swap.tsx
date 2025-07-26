import { useEffect, useState, useCallback } from "react";
import { useIdentity, useAccounts, useAgent } from "@nfid/identitykit/react";
import { Actor, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

// Import AMM canister
import {
  idlFactory as idlFactoryAMM,
  canisterId as canisterIdAMM,
} from "declarations/sudao_amm";
import type { _SERVICE as _SERVICE_AMM } from "declarations/sudao_amm/sudao_amm.did";

// Import ICP Ledger (Local ICP)
import {
  idlFactory as idlFactoryICP,
  canisterId as icpCanisterId,
} from "declarations/icp_ledger_canister/index";
import type { _SERVICE as _SERVICE_ICP_LEDGER } from "declarations/icp_ledger_canister/icp_ledger_canister.did";

// Import Governance Token Ledger
import {
  idlFactory as idlFactoryGovernance,
  canisterId as governanceCanisterId,
} from "declarations/icrc1_ledger_canister/index";
import type { _SERVICE as _SERVICE_GOVERNANCE_LEDGER } from "declarations/icrc1_ledger_canister/icrc1_ledger_canister.did";

export default function Swap() {
  const identity = useIdentity();
  const accounts = useAccounts();
  const authenticatedAgent = useAgent();

  // State
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [actorAMM, setActorAMM] = useState<ActorSubclass<_SERVICE_AMM> | null>(
    null
  );
  const [actorICP, setActorICP] =
    useState<ActorSubclass<_SERVICE_ICP_LEDGER> | null>(null);
  const [actorGovernance, setActorGovernance] =
    useState<ActorSubclass<_SERVICE_GOVERNANCE_LEDGER> | null>(null);

  // Swap state
  const [amountIn, setAmountIn] = useState<number>(0);
  const [amountOut, setAmountOut] = useState<number>(0);
  const [slippage, setSlippage] = useState<number>(1); // 1% default slippage
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [ammInfo, setAmmInfo] = useState<{
    token0: string | null;
    token1: string | null;
    fee_rate: number;
    is_initialized: boolean;
    swap_count: number;
  } | null>(null);
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
    addDebugLog(
      "Setting principal - accounts length: " + (accounts?.length || 0)
    );
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

  // Initialize actors when agent changes
  useEffect(() => {
    addDebugLog(
      "Agent changed - authenticatedAgent: " +
        (authenticatedAgent ? "exists" : "null")
    );

    if (!authenticatedAgent) {
      addDebugLog("No authenticated agent, clearing actors");
      setActorAMM(null);
      setActorICP(null);
      setActorGovernance(null);
      return;
    }

    const initializeActors = async () => {
      addDebugLog("Starting actor initialization");
      try {
        if (process.env.DFX_NETWORK !== "ic") {
          addDebugLog("Fetching root key for local development");
          await authenticatedAgent.fetchRootKey();
          addDebugLog("Root key fetched successfully");
        }

        addDebugLog("Creating AMM actor");
        const authenticatedActorAMM = Actor.createActor<_SERVICE_AMM>(
          idlFactoryAMM,
          {
            agent: authenticatedAgent,
            canisterId: canisterIdAMM,
          }
        );
        addDebugLog("AMM actor created: " + canisterIdAMM);

        addDebugLog("Creating ICP actor");
        const authenticatedActorICP = Actor.createActor<_SERVICE_ICP_LEDGER>(
          idlFactoryICP,
          {
            agent: authenticatedAgent,
            canisterId: icpCanisterId,
          }
        );
        addDebugLog("ICP actor created: " + icpCanisterId);

        addDebugLog("Creating Governance actor");
        const authenticatedActorGovernance =
          Actor.createActor<_SERVICE_GOVERNANCE_LEDGER>(idlFactoryGovernance, {
            agent: authenticatedAgent,
            canisterId: governanceCanisterId,
          });
        addDebugLog("Governance actor created: " + governanceCanisterId);

        setActorAMM(authenticatedActorAMM);
        setActorICP(authenticatedActorICP);
        setActorGovernance(authenticatedActorGovernance);
        addDebugLog("All actors set successfully");
      } catch (err) {
        addDebugLog(
          "Failed to create actors: " +
            (err instanceof Error ? err.message : String(err))
        );
        console.error("Failed to create authenticated actors:", err);
        setActorAMM(null);
        setActorICP(null);
        setActorGovernance(null);
      }
    };

    initializeActors();
  }, [authenticatedAgent, addDebugLog]);

  // Load AMM info and user balances
  useEffect(() => {
    if (!actorAMM || !actorICP || !actorGovernance || !userPrincipal) return;

    const loadData = async () => {
      try {
        addDebugLog("Loading AMM info");
        const info = await actorAMM.get_token_info();
        const ammInfoData = {
          token0: info.token0 ? info.token0.toString() : null,
          token1: info.token1 ? info.token1.toString() : null,
          fee_rate: Number(info.fee_rate),
          is_initialized: info.is_initialized,
          swap_count: 0, // Default value since it might not be in the response
        };
        setAmmInfo(ammInfoData);
        addDebugLog("AMM info loaded: " + JSON.stringify(ammInfoData));

        addDebugLog("Loading user balances");
        const icpBalance = await actorICP.icrc1_balance_of({
          owner: Principal.fromText(userPrincipal),
          subaccount: [] as [],
        });
        const governanceBalance = await actorGovernance.icrc1_balance_of({
          owner: Principal.fromText(userPrincipal),
          subaccount: [] as [],
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
  }, [actorAMM, actorICP, actorGovernance, userPrincipal, addDebugLog]);

  // Calculate swap quote
  const calculateQuote = useCallback(async () => {
    if (!actorAMM || !ammInfo || amountIn <= 0) {
      setAmountOut(0);
      return;
    }

    try {
      addDebugLog("Calculating swap quote for amount: " + amountIn);
      const quote = await actorAMM.get_swap_quote(
        Principal.fromText(ammInfo.token0 || ""), // Assuming token0 is Local ICP
        BigInt(amountIn)
      );

      if ("Ok" in quote) {
        const outputAmount = Number(quote.Ok);
        setAmountOut(outputAmount);
        addDebugLog("Quote calculated: " + outputAmount);
      } else {
        addDebugLog("Quote calculation failed: " + JSON.stringify(quote));
        setAmountOut(0);
      }
    } catch (error) {
      addDebugLog(
        "Quote calculation error: " +
          (error instanceof Error ? error.message : String(error))
      );
      setAmountOut(0);
    }
  }, [actorAMM, ammInfo, amountIn, addDebugLog]);

  // Update quote when amount changes
  useEffect(() => {
    calculateQuote();
  }, [calculateQuote]);

  // Step 1: Approve Local ICP for AMM
  const handleApprove = async () => {
    if (!actorICP || !userPrincipal || amountIn <= 0) {
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
      const approveArgs = {
        from_subaccount: [] as [],
        spender: {
          owner: Principal.fromText(canisterIdAMM),
          subaccount: [] as [],
        },
        fee: [BigInt(10000)] as [bigint],
        memo: [] as [],
        amount: BigInt(amountIn),
        created_at_time: [BigInt(Date.now() * 1000000)] as [bigint],
        expected_allowance: [0n] as [bigint],
        expires_at: [BigInt((Date.now() + 10000000000000) * 1000000)] as [
          bigint
        ],
      };

      console.log("Approval args: " + approveArgs);
      const result = await actorICP.icrc2_approve(approveArgs);
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
    if (!actorAMM || !ammInfo || amountIn <= 0 || amountOut <= 0) {
      setStatus({ type: "error", message: "Missing required data for swap" });
      return;
    }

    setIsLoading(true);
    setStatus(null);
    addDebugLog("Starting swap process");

    try {
      const minAmountOut = Math.floor(amountOut * (1 - slippage / 100));
      addDebugLog(
        `Swap: ${amountIn} ICP -> min ${minAmountOut} Governance (${slippage}% slippage)`
      );

      const swapArgs = {
        token_in_id: Principal.fromText(ammInfo.token0 || ""), // Local ICP
        amount_in: BigInt(amountIn),
        min_amount_out: BigInt(minAmountOut),
      };

      console.log("Swap args: " + swapArgs);
      const result = await actorAMM.swap(swapArgs);

      if ("Ok" in result) {
        const actualOutput = Number(result.Ok);
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

  const isLoggedIn = !!authenticatedAgent;

  if (!isLoggedIn) {
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
          <strong>Actors:</strong> AMM {actorAMM ? "✅" : "❌"} | ICP{" "}
          {actorICP ? "✅" : "❌"} | Governance {actorGovernance ? "✅" : "❌"}
        </p>
      </div>

      {/* AMM Info */}
      {ammInfo && (
        <div className="mb-4 p-2 bg-blue-100 rounded">
          <h3 className="font-semibold">AMM Information</h3>
          <p className="text-sm">Token 0 (Local ICP): {ammInfo.token0}</p>
          <p className="text-sm">Token 1 (Governance): {ammInfo.token1}</p>
          <p className="text-sm">Fee Rate: {ammInfo.fee_rate}‰</p>
          <p className="text-sm">
            Initialized: {ammInfo.is_initialized ? "Yes" : "No"}
          </p>
          <p className="text-sm">Total Swaps: {ammInfo.swap_count}</p>
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
            value={amountIn}
            onChange={(e) => setAmountIn(Number(e.target.value))}
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
              {Math.floor(amountOut * (1 - slippage / 100)).toLocaleString()}{" "}
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
