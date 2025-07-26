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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

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
      // setActorLedger(null);
      setActorICP(null);
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

        // const authenticatedActorLedger = Actor.createActor<_SERVICE_DAO_LEDGER>(idlFactoryLedger, {
        //   agent: authenticatedAgent,
        //   canisterId: ledgerCanisterId,
        // });

        addDebugLog("Creating ICP actor");
        const authenticatedActorICP = Actor.createActor<_SERVICE_ICP_LEDGER>(
          idlFactoryICP,
          {
            agent: authenticatedAgent,
            canisterId: icpCanisterId,
          }
        );
        addDebugLog("ICP actor created: " + icpCanisterId);

        setActorGovernance(authenticatedActorGovernance);
        // setActorLedger(authenticatedActorLedger);
        setActorICP(authenticatedActorICP);
        addDebugLog("All actors set successfully");
      } catch (err) {
        addDebugLog(
          "Failed to create actors: " +
            (err instanceof Error ? err.message : String(err))
        );
        console.error("Failed to create authenticated actors:", err);
        setActorGovernance(null);
        // setActorLedger(null);
        setActorICP(null);
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
      owner: Principal.fromText(
        "5thol-pwfmc-monwz-xbfkw-rqzfe-xgjf5-canhq-uc7nr-ihpsu-h6exb-jae"
      ),
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
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Approve
        </button>
      </div>
      <div className="mb-4 mt-2">
        <label htmlFor="numberInput" className="mr-2 font-medium">
          Enter a number:
        </label>
        <input
          id="numberInput"
          type="number"
          value={numberValue}
          onChange={(e) => setNumberValue(Number(e.target.value))}
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
