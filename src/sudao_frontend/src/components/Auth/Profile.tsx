import { useEffect, useState, useCallback } from "react";
import { useIdentity, useAccounts, useAgent } from "@nfid/identitykit/react";
import {
  idlFactory as idlFactoryGovernance,
  canisterId as canisterIdGovernance,
} from "declarations/sudao_backend";
import type {
  UserProfile,
  _SERVICE as _SERVICE_GOVERNANCE,
} from "declarations/sudao_backend/sudao_backend.did";
import type { _SERVICE as _SERVICE_ICP_LEDGER } from "declarations/icp_ledger_canister/icp_ledger_canister.did";
import type { _SERVICE as _SERVICE_GOVERNANCE_LEDGER } from "declarations/icrc1_ledger_canister/icrc1_ledger_canister.did";
import {
  idlFactory as idlFactoryGovernanceLedger,
  canisterId as canisterIdGovernanceLedger,
} from "declarations/icrc1_ledger_canister/index";
// import type { _SERVICE as _SERVICE_DAO_LEDGER } from "declarations/icrc1_ledger_canister/icrc1_ledger_canister.did";
import { Actor, ActorSubclass } from "@dfinity/agent";
// import {
//   idlFactory as idlFactoryLedger,
//   canisterId as ledgerCanisterId,
// } from "declarations/icrc1_ledger_canister/index";
import { Principal } from "@dfinity/principal";
import {
  idlFactory as idlFactoryICP,
  canisterId as icpCanisterId,
} from "declarations/icp_ledger_canister/index";
import {
  idlFactory as idlFactoryAMM,
  canisterId as ammCanisterId,
} from "declarations/sudao_amm/index";
import type { _SERVICE as _SERVICE_AMM } from "declarations/sudao_amm/sudao_amm.did";

// Helper to safely stringify objects with BigInt
function safeStringify(obj: unknown) {
  return JSON.stringify(
    obj,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2
  );
}

export default function UserProfile() {
  const identity = useIdentity();
  const accounts = useAccounts();
  const authenticatedAgent = useAgent();
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [numberValue, setNumberValue] = useState<number>(0);
  const [actorGovernance, setActorGovernance] =
    useState<ActorSubclass<_SERVICE_GOVERNANCE> | null>(null);
  // const [actorLedger, setActorLedger] = useState<ActorSubclass<_SERVICE_DAO_LEDGER> | null>(null);
  const [actorICP, setActorICP] =
    useState<ActorSubclass<_SERVICE_ICP_LEDGER> | null>(null);
  const [actorAMM, setActorAMM] = useState<ActorSubclass<_SERVICE_AMM> | null>(
    null
  );
  const [actorGovernanceLedger, setActorGovernanceLedger] =
    useState<ActorSubclass<_SERVICE_GOVERNANCE_LEDGER> | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Add state for liquidity provision and balances
  const [liquidityICP, setLiquidityICP] = useState<number>(0);
  const [liquidityGovernance, setLiquidityGovernance] = useState<number>(0);
  const [userBalances, setUserBalances] = useState<{
    icp: number;
    governance: number;
    lp: number;
  }>({ icp: 0, governance: 0, lp: 0 });
  const [ammInfo, setAmmInfo] = useState<{
    token0: string | null;
    token1: string | null;
    fee_rate: number;
    is_initialized: boolean;
    swap_count: number;
    reserve0: number;
    reserve1: number;
  }>({
    token0: null,
    token1: null,
    fee_rate: 0,
    is_initialized: false,
    swap_count: 0,
    reserve0: 0,
    reserve1: 0,
  });

  const addDebugLog = useCallback((message: string) => {
    console.log(`[DEBUG] ${message}`);
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
    if (!principal) {
      setUserProfile(null);
      setStatus(null);
    }
  }, [identity, accounts, addDebugLog]);

  // Initialize actors when agent changes
  useEffect(() => {
    addDebugLog(
      "Agent changed - authenticatedAgent: " +
        (authenticatedAgent ? "exists" : "null")
    );

    if (!authenticatedAgent) {
      addDebugLog("No authenticated agent, clearing actors");
      setActorGovernance(null);
      setActorICP(null);
      setActorAMM(null);
      setActorGovernanceLedger(null);
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

        addDebugLog("Creating governance actor");
        const authenticatedActorGovernance =
          Actor.createActor<_SERVICE_GOVERNANCE>(idlFactoryGovernance, {
            agent: authenticatedAgent,
            canisterId: canisterIdGovernance,
          });
        addDebugLog("Governance actor created: " + canisterIdGovernance);

        addDebugLog("Creating ICP actor");
        const authenticatedActorICP = Actor.createActor<_SERVICE_ICP_LEDGER>(
          idlFactoryICP,
          {
            agent: authenticatedAgent,
            canisterId: icpCanisterId,
          }
        );
        addDebugLog("ICP actor created: " + icpCanisterId);

        addDebugLog("Creating AMM actor");
        const authenticatedActorAMM = Actor.createActor<_SERVICE_AMM>(
          idlFactoryAMM,
          {
            agent: authenticatedAgent,
            canisterId: ammCanisterId,
          }
        );
        addDebugLog("AMM actor created: " + ammCanisterId);

        addDebugLog("Creating Governance Ledger actor");
        const authenticatedActorGovernanceLedger =
          Actor.createActor<_SERVICE_GOVERNANCE_LEDGER>(
            idlFactoryGovernanceLedger,
            {
              agent: authenticatedAgent,
              canisterId: canisterIdGovernanceLedger,
            }
          );
        addDebugLog(
          "Governance Ledger actor created: " + canisterIdGovernanceLedger
        );

        setActorGovernance(authenticatedActorGovernance);
        setActorICP(authenticatedActorICP);
        setActorAMM(authenticatedActorAMM);
        setActorGovernanceLedger(authenticatedActorGovernanceLedger);
        addDebugLog("All actors set successfully");
      } catch (err) {
        addDebugLog(
          "Failed to create actors: " +
            (err instanceof Error ? err.message : String(err))
        );
        console.error("Failed to create authenticated actors:", err);
        setActorGovernance(null);
        setActorICP(null);
        setActorAMM(null);
        setActorGovernanceLedger(null);
      }
    };

    initializeActors();
  }, [authenticatedAgent, addDebugLog]);

  // Register user and fetch profile
  const handleUserRegistration = useCallback(async () => {
    addDebugLog("Starting user registration");
    setIsRegistering(true);
    setStatus(null);

    if (!actorGovernance) {
      addDebugLog("No governance actor available");
      setIsRegistering(false);
      setStatus({
        type: "error",
        message: "Authenticated actor not ready. Please log in.",
      });
      return;
    }

    try {
      addDebugLog("Calling register() on governance actor");
      const registrationResult = await actorGovernance.register();
      addDebugLog("Registration result: " + registrationResult);
      console.log("Registration result:", registrationResult);

      addDebugLog("Calling getMyProfile() on governance actor");
      const profileResult = await actorGovernance.getMyProfile();
      addDebugLog("Profile result length: " + profileResult.length);
      console.log("Profile result:", profileResult);

      const [profile] = profileResult;
      addDebugLog("Profile extracted: " + (profile ? "exists" : "null"));
      console.log("Profile extracted:", profile);

      setUserProfile(profile ?? null);
      setStatus({
        type: "success",
        message: `Registration successful: ${registrationResult}`,
      });
      addDebugLog("Registration and profile fetch completed successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Error during registration/profile fetch: " + errorMessage);
      console.error("Error during registration/profile fetch:", error);
      setStatus({
        type: "error",
        message: `Failed to register or fetch profile: ${errorMessage}`,
      });
    } finally {
      setIsRegistering(false);
      addDebugLog("Registration process finished");
    }
  }, [actorGovernance, addDebugLog]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    addDebugLog("Starting profile refresh");
    setIsRefreshing(true);
    setStatus(null);

    if (!actorGovernance) {
      addDebugLog("No governance actor available for refresh");
      setIsRefreshing(false);
      setStatus({
        type: "error",
        message: "Authenticated actor not ready. Please log in.",
      });
      return;
    }

    try {
      addDebugLog("Calling getMyProfile() for refresh");
      const [profile] = await actorGovernance.getMyProfile();
      addDebugLog("Refresh profile result: " + (profile ? "exists" : "null"));
      setUserProfile(profile ?? null);
      setStatus({ type: "success", message: "Profile refreshed." });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Error during profile refresh: " + errorMessage);
      setStatus({ type: "error", message: "Failed to refresh profile." });
    } finally {
      setIsRefreshing(false);
      addDebugLog("Profile refresh finished");
    }
  }, [actorGovernance, addDebugLog]);

  // Approve logic
  const handleApprove = async () => {
    addDebugLog("Starting approve process");
    if (!actorICP) {
      addDebugLog("No ICP actor available for approve");
      setStatus({
        type: "error",
        message: "Authenticated actor not ready. Please log in.",
      });
      return;
    }

    const acc = {
      owner: Principal.fromText("uzt4z-lp777-77774-qaabq-cai"),
      subaccount: [] as [],
    };

    const acc2 = {
      owner: Principal.fromText(
        "n74bt-mr7nf-tbl4t-kf6xx-6yd3a-egzs3-6sjvg-x6nxa-lvy7v-gvrg4-yae"
      ),
      subaccount: [] as [],
    };

    const icrc2_approve_args = {
      from_subaccount: [] as [],
      spender: acc,
      fee: [BigInt(10000)] as [bigint],
      memo: [] as [],
      amount: BigInt(numberValue),
      created_at_time: [BigInt(Date.now() * 1000000)] as [bigint],
      expected_allowance: [0n] as [bigint],
      expires_at: [BigInt((Date.now() + 10000000000000) * 1000000)] as [bigint],
    };

    console.log("icrc2_approve_args", icrc2_approve_args);

    try {
      addDebugLog("Checking balance for acc1");
      const balance = await actorICP.icrc1_balance_of(acc);
      addDebugLog("Balance for acc1: " + balance);
      console.log("Balance:", balance, acc, acc.owner.toString());

      addDebugLog("Checking balance for acc2");
      const balance2 = await actorICP.icrc1_balance_of(acc2);
      addDebugLog("Balance for acc2: " + balance2);
      console.log("Balance2:", balance2, acc2, acc2.owner.toString());

      addDebugLog("Calling icrc2_approve");
      const response = await actorICP.icrc2_approve(icrc2_approve_args);
      console.log("Approve Result:", response);
      setStatus({ type: "success", message: "Approve transaction sent." });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Error during approve: " + errorMessage);
      console.error("Error during approve:", error);
      setStatus({ type: "error", message: "Approve failed." });
    }
  };

  const handleSwap = async () => {
    addDebugLog("Starting swap process");
    if (!actorAMM) {
      addDebugLog("No AMM actor available for swap");
      setStatus({
        type: "error",
        message: "Authenticated actor not ready. Please log in.",
      });
      return;
    }

    if (!numberValue || numberValue <= 0) {
      setStatus({
        type: "error",
        message: "Please enter a valid amount to swap.",
      });
      return;
    }

    // Check if amount is too small (likely to result in 0 output)
    if (numberValue < 10000) {
      setStatus({
        type: "error",
        message:
          "Amount too small. Try at least 10,000 ICP for a meaningful swap.",
      });
      return;
    }

    setStatus({
      type: "info",
      message: "Fetching quote and processing swap...",
    });

    try {
      // Fetch the latest quote
      const quoteResult = await actorAMM.get_swap_quote(
        Principal.fromText(icpCanisterId),
        BigInt(numberValue)
      );
      addDebugLog("Fetched quote for swap: " + safeStringify(quoteResult));

      if (!("ok" in quoteResult)) {
        setStatus({
          type: "error",
          message: `Swap quote failed: ${safeStringify(quoteResult.err)}`,
        });
        addDebugLog("Swap quote failed: " + safeStringify(quoteResult.err));
        return;
      }

      const quote = Number(quoteResult.ok);
      if (quote === 0) {
        setStatus({
          type: "error",
          message: "Swap output would be 0. Try a larger amount.",
        });
        addDebugLog("Swap output would be 0");
        return;
      }

      // Apply 1% slippage tolerance
      const minAmountOut = Math.floor(quote * 0.99);
      addDebugLog(
        `Using min_amount_out: ${minAmountOut} (1% slippage from quote: ${quote})`
      );

      const swapArgs = {
        token_in_id: Principal.fromText(icpCanisterId),
        amount_in: BigInt(numberValue),
        min_amount_out: BigInt(minAmountOut),
      };

      addDebugLog("Swap args: " + safeStringify(swapArgs));
      const result = await actorAMM.swap(swapArgs);
      console.log("Swap Result:", result);
      addDebugLog("Swap result: " + safeStringify(result));

      if ("ok" in result) {
        setStatus({
          type: "success",
          message: `Swap successful! Output: ${result.ok}`,
        });
        addDebugLog("Swap completed successfully: " + result.ok);
      } else {
        setStatus({
          type: "error",
          message: `Swap failed: ${safeStringify(result.err)}`,
        });
        addDebugLog("Swap failed: " + safeStringify(result.err));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Swap error: " + errorMessage);
      setStatus({
        type: "error",
        message: "Swap failed: " + errorMessage,
      });
    }
  };

  // Load AMM info only handler
  const handleLoadAMMInfo = async () => {
    if (!actorAMM) {
      setStatus({
        type: "error",
        message: "AMM actor not ready. Please ensure you're logged in.",
      });
      return;
    }

    setStatus({ type: "info", message: "Loading AMM info..." });

    try {
      addDebugLog("Loading AMM info");
      const info = await actorAMM.get_token_info();
      const reserves = await actorAMM.get_reserves();
      setAmmInfo({
        token0:
          info.token0?.length && info.token0[0]
            ? info.token0[0].toString()
            : null,
        token1:
          info.token1?.length && info.token1[0]
            ? info.token1[0].toString()
            : null,
        fee_rate: Number(info.fee_rate),
        is_initialized: info.is_initialized,
        swap_count: Number(info.swap_count),
        reserve0: Number(reserves[0]),
        reserve1: Number(reserves[1]),
      });
      addDebugLog("AMM info loaded: " + safeStringify(info));
      addDebugLog("AMM reserves loaded: " + safeStringify(reserves));
      setStatus({
        type: "success",
        message: "AMM info loaded successfully",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Failed to load AMM info: " + errorMessage);
      setStatus({
        type: "error",
        message: "Failed to load AMM info: " + errorMessage,
      });
    }
  };

  // Manual refresh balances handler
  const handleRefreshBalances = async () => {
    if (!actorAMM || !actorICP || !actorGovernanceLedger || !userPrincipal) {
      setStatus({
        type: "error",
        message: "Actors not ready. Please ensure you're logged in.",
      });
      return;
    }

    setStatus({ type: "info", message: "Loading balances..." });

    try {
      addDebugLog("Loading AMM info");
      const info = await actorAMM.get_token_info();
      const reserves = await actorAMM.get_reserves();
      setAmmInfo({
        token0:
          info.token0?.length && info.token0[0]
            ? info.token0[0].toString()
            : null,
        token1:
          info.token1?.length && info.token1[0]
            ? info.token1[0].toString()
            : null,
        fee_rate: Number(info.fee_rate),
        is_initialized: info.is_initialized,
        swap_count: Number(info.swap_count),
        reserve0: Number(reserves[0]),
        reserve1: Number(reserves[1]),
      });
      addDebugLog("AMM info loaded: " + safeStringify(info));
      addDebugLog("AMM reserves loaded: " + safeStringify(reserves));
      addDebugLog("Loading user balances");
      const icpBalance = await actorICP.icrc1_balance_of({
        owner: Principal.fromText(userPrincipal),
        subaccount: [] as [],
      });
      const governanceBalance = await actorGovernanceLedger.icrc1_balance_of({
        owner: Principal.fromText(userPrincipal),
        subaccount: [] as [],
      });
      const lpInfo = await actorAMM.get_liquidity_info([
        Principal.fromText(userPrincipal),
      ]);
      setUserBalances({
        icp: Number(icpBalance),
        governance: Number(governanceBalance),
        lp: Number(lpInfo?.user_balance ?? 0),
      });
      addDebugLog(
        `Balances loaded - ICP: ${icpBalance}, Governance: ${governanceBalance}, LP: ${
          lpInfo?.user_balance ?? 0
        }`
      );
      setStatus({
        type: "success",
        message: "Balances refreshed successfully!",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Failed to load data: " + errorMessage);
      setStatus({
        type: "error",
        message: "Failed to refresh balances: " + errorMessage,
      });
    }
  };

  // Add Liquidity handler
  const handleAddLiquidity = async () => {
    addDebugLog("Starting add liquidity process");
    if (!actorAMM) {
      addDebugLog("No AMM actor available for add liquidity");
      setStatus({
        type: "error",
        message: "Authenticated actor not ready. Please log in.",
      });
      return;
    }
    try {
      const args = {
        amount0_desired: BigInt(liquidityICP),
        amount1_desired: BigInt(liquidityGovernance),
        amount0_min: [] as [],
        amount1_min: [] as [],
      };
      addDebugLog("Calling add_liquidity: " + safeStringify(args));
      const result = await actorAMM.add_liquidity(args);
      if ("ok" in result) {
        setStatus({
          type: "success",
          message: `Added liquidity! LP tokens: ${result.ok}`,
        });
        addDebugLog("Liquidity added: " + result.ok);
      } else {
        setStatus({
          type: "error",
          message: `Add liquidity failed: ${safeStringify(result.err)}`,
        });
        addDebugLog("Add liquidity failed: " + safeStringify(result.err));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Error during add liquidity: " + errorMessage);
      setStatus({
        type: "error",
        message: "Add liquidity failed: " + errorMessage,
      });
    }
  };

  // Get swap quote handler
  const handleGetSwapQuote = async () => {
    if (!actorAMM) {
      setStatus({
        type: "error",
        message: "AMM actor not ready. Please ensure you're logged in.",
      });
      return;
    }

    if (!numberValue || numberValue <= 0) {
      setStatus({
        type: "error",
        message: "Please enter a valid amount to get quote.",
      });
      return;
    }

    // Check if amount is too small (likely to result in 0 output)
    if (numberValue < 10000) {
      setStatus({
        type: "error",
        message:
          "Amount too small. Try at least 10,000 ICP for a meaningful quote.",
      });
      return;
    }

    setStatus({ type: "info", message: "Getting swap quote..." });

    try {
      addDebugLog(`Getting quote for ${numberValue} ICP`);
      const result = await actorAMM.get_swap_quote(
        Principal.fromText(icpCanisterId),
        BigInt(numberValue)
      );
      addDebugLog("Quote result: " + safeStringify(result));

      if ("ok" in result) {
        setStatus({
          type: "success",
          message: `Quote: ${numberValue} ICP → ${result.ok} Governance tokens`,
        });
      } else {
        setStatus({
          type: "error",
          message: `Quote failed: ${safeStringify(result.err)}`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Quote error: " + errorMessage);
      setStatus({
        type: "error",
        message: "Quote failed: " + errorMessage,
      });
    }
  };

  // Quick balance check handler (ICP and Governance only)
  const handleCheckBalances = async () => {
    if (!actorICP || !actorGovernanceLedger || !userPrincipal) {
      setStatus({
        type: "error",
        message: "Actors not ready. Please ensure you're logged in.",
      });
      return;
    }

    setStatus({ type: "info", message: "Checking balances..." });

    try {
      addDebugLog("Checking user balances");
      const icpBalance = await actorICP.icrc1_balance_of({
        owner: Principal.fromText(userPrincipal),
        subaccount: [] as [],
      });
      const governanceBalance = await actorGovernanceLedger.icrc1_balance_of({
        owner: Principal.fromText(userPrincipal),
        subaccount: [] as [],
      });

      setUserBalances((prev) => ({
        ...prev,
        icp: Number(icpBalance),
        governance: Number(governanceBalance),
      }));

      addDebugLog(
        `Balance check - ICP: ${icpBalance}, Governance: ${governanceBalance}`
      );
      setStatus({
        type: "success",
        message: `Balances: ${Number(
          icpBalance
        ).toLocaleString()} Local ICP, ${Number(
          governanceBalance
        ).toLocaleString()} Governance tokens`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addDebugLog("Failed to check balances: " + errorMessage);
      setStatus({
        type: "error",
        message: "Failed to check balances: " + errorMessage,
      });
    }
  };

  const isLoggedIn = !!authenticatedAgent;

  if (!isLoggedIn) {
    return (
      <div className="p-4 border rounded-lg">
        <p>Please log in with NFID to see your profile.</p>
        <p className="text-sm text-gray-600 mt-2">
          Waiting for NFID authentication...
        </p>
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

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Your Universal Identifier</h2>
      <p className="mb-2">
        Your Principal is:{" "}
        <code className="bg-gray-100 px-1 rounded">{userPrincipal}</code>
      </p>
      <div className="mb-2 text-sm text-gray-600">
        Authentication:{" "}
        {isLoggedIn ? "✅ NFID Connected" : "❌ NFID Not Connected"}
      </div>
      <div className="mb-2 text-sm text-gray-600">
        Actors: Governance {actorGovernance ? "✅" : "❌"} | ICP{" "}
        {actorICP ? "✅" : "❌"}
      </div>
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
      {userProfile && (
        <div className="my-4 p-2 bg-blue-100 border border-blue-300 rounded">
          <h3 className="font-semibold">Profile Information:</h3>
          <p>Principal: {userProfile.principal.toString()}</p>
          <p>
            First Registered:{" "}
            {new Date(
              Number(userProfile.firstRegistered) / 1000000
            ).toLocaleString()}
          </p>
        </div>
      )}
      {/* User and AMM Info */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <p className="text-sm">
          <strong>User:</strong> {userPrincipal}
        </p>
        <p className="text-sm">
          <strong>ICP Balance:</strong> {userBalances.icp.toLocaleString()}
        </p>
        <p className="text-sm">
          <strong>Governance Balance:</strong>{" "}
          {userBalances.governance.toLocaleString()}
        </p>
        <p className="text-sm">
          <strong>LP Balance:</strong> {userBalances.lp.toLocaleString()}
        </p>
        <p className="text-sm">
          <strong>Actors:</strong> Governance {actorGovernance ? "✅" : "❌"} |
          ICP {actorICP ? "✅" : "❌"} | AMM {actorAMM ? "✅" : "❌"}
        </p>
      </div>
      {/* AMM Info */}
      <div className="mb-4 p-2 bg-blue-100 rounded">
        <h3 className="font-semibold">AMM Information</h3>
        <p className="text-sm">Token 0 (ICP): {ammInfo.token0}</p>
        <p className="text-sm">Token 1 (Governance): {ammInfo.token1}</p>
        <p className="text-sm">Fee Rate: {ammInfo.fee_rate}‰</p>
        <p className="text-sm">
          Initialized: {ammInfo.is_initialized ? "Yes" : "No"}
        </p>
        <p className="text-sm">Total Swaps: {ammInfo.swap_count}</p>
        <p className="text-sm">
          Reserves: {ammInfo.reserve0.toLocaleString()} ICP,{" "}
          {ammInfo.reserve1.toLocaleString()} Governance
        </p>
      </div>
      {/* Add Liquidity */}
      <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
        <h3 className="font-semibold mb-2">Add Liquidity</h3>
        <div className="flex space-x-2 mb-2">
          <input
            type="number"
            placeholder="ICP Amount"
            value={liquidityICP}
            onChange={(e) => setLiquidityICP(Number(e.target.value))}
            className="border rounded px-2 py-1"
          />
          <input
            type="number"
            placeholder="Governance Amount"
            value={liquidityGovernance}
            onChange={(e) => setLiquidityGovernance(Number(e.target.value))}
            className="border rounded px-2 py-1"
          />
          <button
            onClick={handleAddLiquidity}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={liquidityICP <= 0 || liquidityGovernance <= 0}
          >
            Add Liquidity
          </button>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={refreshProfile}
          disabled={isRefreshing || isRegistering}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Profile"}
        </button>
        <button
          onClick={handleUserRegistration}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          disabled={isRegistering || isRefreshing}
        >
          {isRegistering ? "Registering..." : "Register"}
        </button>
        <button
          onClick={handleApprove}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
        >
          [1] Approve AMM to Spend ICP
        </button>
        <button
          onClick={handleAddLiquidity}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
        >
          [2] Add Liquidity
        </button>
        <button
          onClick={handleLoadAMMInfo}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          [3] Load AMM Info
        </button>
        <button
          onClick={handleCheckBalances}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          [4] Check Balances
        </button>
        <button
          onClick={handleGetSwapQuote}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          [5] Get Swap Quote
        </button>
        <button
          onClick={handleSwap}
          className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 disabled:opacity-50"
        >
          [6] Swap
        </button>
        <button
          onClick={handleRefreshBalances}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          [7] Refresh Balances
        </button>
      </div>
      <div className="mb-4 mt-2">
        <label htmlFor="numberInput" className="mr-2 font-medium">
          Amount for Swap/Quote (min 10,000):
        </label>
        <input
          id="numberInput"
          type="number"
          value={numberValue}
          onChange={(e) => setNumberValue(Number(e.target.value))}
          placeholder="10000"
          className="border rounded px-2 py-1"
        />
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
