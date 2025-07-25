import { useEffect, useState, useCallback } from "react";
import { useIdentity, useAccounts, useAgent } from "@nfid/identitykit/react";
import { idlFactory, canisterId } from "declarations/sudao_backend";
import type {
  UserProfile,
  _SERVICE,
} from "declarations/sudao_backend/sudao_backend.did";
import { Actor, ActorSubclass } from "@dfinity/agent";

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

  // Set principal on login/logout
  useEffect(() => {
    let principal = null;
    if (accounts && accounts.length > 0) {
      principal = accounts[0].principal;
    } else if (identity) {
      principal = identity.getPrincipal();
    }
    setUserPrincipal(principal ? principal.toString() : null);
    if (!principal) {
      setUserProfile(null);
      setStatus(null);
    }
  }, [identity, accounts]);

  // Helper to create an authenticated actor
  const getAuthenticatedActor =
    useCallback(async (): Promise<ActorSubclass<_SERVICE> | null> => {
      if (!authenticatedAgent) {
        setStatus({
          type: "error",
          message: "Not authenticated. Please log in.",
        });
        return null;
      }
      console.log("DFX_NETWORK variable is:", process.env.DFX_NETWORK); 
      if (process.env.DFX_NETWORK !== "ic") {
        try {
          await authenticatedAgent.fetchRootKey();
        } catch {
          setStatus({ type: "error", message: "Could not fetch root key." });
          return null;
        }
      }
      return Actor.createActor<_SERVICE>(idlFactory, {
        agent: authenticatedAgent,
        canisterId,
      });
    }, [authenticatedAgent]);

  // Register user and fetch profile
  const handleUserRegistration = useCallback(async () => {
    setIsRegistering(true);
    setStatus(null);
    const actor = await getAuthenticatedActor();
    if (!actor) {
      setIsRegistering(false);
      return;
    }
    try {
      const registrationResult = await actor.register();
      setStatus({ type: "success", message: registrationResult });
      const [profile] = await actor.getMyProfile();
      setUserProfile(profile ?? null);
    } catch (e) {
      console.error(e);
      setStatus({
        type: "error",
        message: "Failed to register or fetch profile.",
      });
    } finally {
      setIsRegistering(false);
    }
  }, [getAuthenticatedActor]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    setIsRefreshing(true);
    setStatus(null);
    const actor = await getAuthenticatedActor();
    if (!actor) {
      setIsRefreshing(false);
      return;
    }
    try {
      const [profile] = await actor.getMyProfile();
      setUserProfile(profile ?? null);
      setStatus({ type: "success", message: "Profile refreshed." });
    } catch {
      setStatus({ type: "error", message: "Failed to refresh profile." });
    } finally {
      setIsRefreshing(false);
    }
  }, [getAuthenticatedActor]);

  const isLoggedIn = !!authenticatedAgent;

  if (!isLoggedIn) {
    return (
      <div className="p-4 border rounded-lg">
        <p>Please log in with NFID to see your profile.</p>
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
      </div>
    </div>
  );
}
