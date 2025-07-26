import { useEffect, useState } from "react";
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
import type { _SERVICE as _SERVICE_DAO_LEDGER } from "declarations/icrc1_ledger_canister/icrc1_ledger_canister.did";
import { Actor, ActorSubclass } from "@dfinity/agent";
import {
  idlFactory as idlFactoryLedger,
  canisterId as ledgerCanisterId,
} from "declarations/icrc1_ledger_canister/index";
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
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string>("");
  const [numberValue, setNumberValue] = useState<number>(0);
  const [actorGovernance, setActorGovernance] =
    useState<ActorSubclass<_SERVICE_GOVERNANCE> | null>(null);
  const [actorLedger, setActorLedger] =
    useState<ActorSubclass<_SERVICE_DAO_LEDGER> | null>(null);
  const [actorICP, setActorICP] =
    useState<ActorSubclass<_SERVICE_ICP_LEDGER> | null>(null);

  useEffect(() => {
    // This effect runs whenever the identity or account objects change
    let principal = null;

    if (accounts && accounts.length > 0) {
      console.log("Logged in with NFID Wallet. Using account object.");
      principal = accounts[0].principal; // Get Principal from the account object
    } else if (identity) {
      console.log(
        "Logged in with Internet Identity via NFID. Using identity object."
      );
      principal = identity.getPrincipal(); // Get Principal from the identity object
    } else {
      console.log("No accounts or identity found");
      setUserPrincipal(null);
      setUserProfile(null);
      return;
    }

    if (authenticatedAgent) {
      console.log(
        "Authenticated agent is available. Creating authenticated actor..."
      );

      // Create actor asynchronously to handle root key fetching
      const createAuthenticatedActor = async () => {
        try {

          const authenticatedActorGovernance =
            Actor.createActor<_SERVICE_GOVERNANCE>(idlFactoryGovernance, {
              agent: authenticatedAgent,
              canisterId: canisterIdGovernance,
            });
          const authenticatedActorLedger =
            Actor.createActor<_SERVICE_DAO_LEDGER>(idlFactoryLedger, {
              agent: authenticatedAgent,
              canisterId: ledgerCanisterId,
            });
          const authenticatedActorICP = Actor.createActor<_SERVICE_ICP_LEDGER>(
            idlFactoryICP,
            {
              agent: authenticatedAgent,
              canisterId: icpCanisterId,
            }
          );
          // const authenticatedActorAMM = Actor.createActor<_SERVICE>(idlFactory, {
          //   agent: authenticatedAgent,
          //   canisterId: canisterId,
          // });
          setActorGovernance(authenticatedActorGovernance);
          setActorLedger(authenticatedActorLedger);
          setActorICP(authenticatedActorICP);
          console.log("Authenticated actor created successfully");
        } catch (err) {
          console.error("Failed to create authenticated actor:", err);
        }
      };

      createAuthenticatedActor();
    }

    if (principal) {
      setUserPrincipal(principal.toString());
      console.log(`Principal: ${principal}`);
    }
  }, [identity, accounts, authenticatedAgent]); // Rerun when any auth state changes

  // Handle user registration and profile fetching
  const handleUserRegistration = async () => {
    if (!actorGovernance) {
      setRegistrationStatus("Authenticated actor not ready. Please log in.");
      return;
    }

    console.log("handleUserRegistration called with authenticated actor.");
    setIsLoading(true);
    try {
      // First, try to register the user
      const registrationResult = await actorGovernance.register();
      setRegistrationStatus(registrationResult);
      console.log("Registration Result:", registrationResult);

      // Then, fetch the user profile
      const [profile] = await actorGovernance.getMyProfile();
      setUserProfile(profile ?? null);
      console.log("Profile:", userProfile);
    } catch (error) {
      console.error("Error during registration/profile fetch:", error);
      setRegistrationStatus(
        "Failed to register or fetch profile. Please check console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async () => {
    if (!actorLedger) {
      console.log("Authenticated actor not available for mint.");
      return;
    }
    // const mintResult = await actorLedger.mint(
    //   {
    //     owner: Principal.fromText("vqluh-coqli-j2ase-mhzal-aop7e-ccajg-wl44c-lmvb7-4umu4-z4vu4-fqe"),
    //     subaccount: [],
    //   },
    //   1_000_000n,
    // );
    // console.log("Mint Result:", mintResult);
  };

  const handleApprove = async () => {
    if (!actorICP) {
      console.log("Authenticated actor not available for approve.");
      return;
    }
    const acc = {
      owner: Principal.fromText(
        "n74bt-mr7nf-tbl4t-kf6xx-6yd3a-egzs3-6sjvg-x6nxa-lvy7v-gvrg4-yae"
      ),
      subaccount: [] as [],
    };

    const acc2 = {
      owner: Principal.fromText(
        "5thol-pwfmc-monwz-xbfkw-rqzfe-xgjf5-canhq-uc7nr-ihpsu-h6exb-jae"
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
      const balance = await actorICP.icrc1_balance_of(acc);
      console.log("Balance:", balance, acc, acc.owner.toString());
      const balance2 = await actorICP.icrc1_balance_of(acc2);
      console.log("Balance2:", balance2, acc2, acc2.owner.toString());
      const response = await actorICP.icrc2_approve(icrc2_approve_args);
      console.log("Approve Result:", response);
    } catch (error) {
      console.error("Error during approve:", error);
    }
  };

  const refreshProfile = async () => {
    if (!actorGovernance) {
      console.log("Authenticated actor not available for refresh.");
      return;
    }

    setIsLoading(true);
    try {
      const profile = await actorGovernance?.getMyProfile();
      if (profile && profile.length > 0) {
        const res = profile[0];
        if (res) {
          setUserProfile(res);
        }
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userPrincipal) {
    return (
      <div className="p-4 border rounded-lg">
        <p>Please log in with NFID to see your profile.</p>
        {!actorGovernance && (
          <p className="text-sm text-gray-600 mt-2">
            Waiting for NFID authentication...
          </p>
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

      {/* Show authentication status */}
      <div className="mb-2 text-sm text-gray-600">
        Authentication:{" "}
        {actorGovernance ? "✅ NFID Connected" : "❌ NFID Not Connected"}
      </div>

      {isLoading && <p className="text-blue-500">Loading...</p>}

      {registrationStatus && (
        <div
          className={`mb-4 p-2 border rounded ${
            registrationStatus.includes("Failed") ||
            registrationStatus.includes("Please log in")
              ? "bg-red-100 border-red-300 text-red-800"
              : "bg-green-100 border-green-300 text-green-800"
          }`}
        >
          <p>{registrationStatus}</p>
        </div>
      )}

      {userProfile && (
        <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded">
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

      <button
        onClick={refreshProfile}
        disabled={isLoading || !actorGovernance}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
      >
        {isLoading ? "Refreshing..." : "Refresh Profile"}
      </button>

      <button
        onClick={handleUserRegistration}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        disabled={isLoading || !actorGovernance}
      >
        {isLoading ? "Registering..." : "Register"}
      </button>

      <button
        onClick={handleMint}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        Mint
      </button>
      <div className="mb-4">
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

      <button
        onClick={handleApprove}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        Approve
      </button>
    </div>
  );
}
