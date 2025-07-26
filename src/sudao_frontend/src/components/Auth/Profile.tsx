import { useEffect, useState } from "react";
import { useIdentity, useAccounts, useAgent } from "@nfid/identitykit/react";
import { idlFactory, canisterId } from "declarations/sudao_backend";
import type {
  UserProfile,
  _SERVICE,
} from "declarations/sudao_backend/sudao_backend.did";
import { Actor, ActorSubclass } from "@dfinity/agent";
import { createActor as createLedgerActor, canisterId as ledgerCanisterId } from "declarations/sudao_ledger/index";
import { Principal } from "@dfinity/principal";

export default function UserProfile() {
  const identity = useIdentity();
  const accounts = useAccounts();
  const authenticatedAgent = useAgent();
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string>("");

  const [actor, setActor] = useState<ActorSubclass<_SERVICE> | null>(null);

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
          // For local development, fetch the root key first
          if (process.env.DFX_NETWORK !== "ic") {
            console.log("Fetching root key for local development...");
            await authenticatedAgent.fetchRootKey();
            console.log("Root key fetched successfully");
          }

          const authenticatedActor = Actor.createActor<_SERVICE>(idlFactory, {
            agent: authenticatedAgent,
            canisterId: canisterId,
          });
          setActor(authenticatedActor);
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

  // Separate effect to handle registration when actor is ready
  useEffect(() => {
    if (actor && userPrincipal) {
      console.log("Actor and principal ready, attempting registration...");
      handleUserRegistration();
    }
  }, [actor, userPrincipal]); // Run when actor or principal changes

  // Handle user registration and profile fetching
  const handleUserRegistration = async () => {
    if (!actor) {
      setRegistrationStatus("Authenticated actor not ready. Please log in.");
      return;
    }

    console.log("handleUserRegistration called with authenticated actor.");
    setIsLoading(true);
    try {
      // First, try to register the user
      const registrationResult = await actor.register();
      setRegistrationStatus(registrationResult);
      console.log("Registration Result:", registrationResult);

      // Then, fetch the user profile
      const [profile] = await actor.getMyProfile();
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
    if (!actor) {
      console.log("Authenticated actor not available for mint.");
      return;
    }
    const ledger = createLedgerActor(ledgerCanisterId);
    const mintResult = await ledger.mint(
      {
        owner: Principal.fromText("vqluh-coqli-j2ase-mhzal-aop7e-ccajg-wl44c-lmvb7-4umu4-z4vu4-fqe"),
        subaccount: [],
      },
      1_000_000n,
    );
    console.log("Mint Result:", mintResult);
  };

  const refreshProfile = async () => {
    if (!actor) {
      console.log("Authenticated actor not available for refresh.");
      return;
    }

    setIsLoading(true);
    try {
      const profile = await actor?.getMyProfile();
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
        {!actor && (
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
        Authentication: {actor ? "✅ NFID Connected" : "❌ NFID Not Connected"}
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
        disabled={isLoading || !actor}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
      >
        {isLoading ? "Refreshing..." : "Refresh Profile"}
      </button>

      <button
        onClick={handleUserRegistration}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        disabled={isLoading || !actor}
      >
        {isLoading ? "Registering..." : "Register"}
      </button>

      <button onClick={handleMint}>
        Mint
      </button>
    </div>
  );
}
