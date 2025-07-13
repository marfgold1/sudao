import { useEffect, useState } from "react";
import { useIdentity, useAccounts, useAgent } from "@nfid/identitykit/react";
import { createBackendAPI, type UserProfile } from "../../api";

export default function UserProfile() {
  const identity = useIdentity();
  const accounts = useAccounts();
  const agent = useAgent();
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string>("");

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

    if (principal && agent) {
      setUserPrincipal(principal.toString());
      // Register and fetch user profile
      handleUserRegistration();
      console.log(`Principal: ${principal}`);
    }
  }, [identity, accounts, agent]); // Rerun when any auth state changes

  // Handle user registration and profile fetching
  const handleUserRegistration = async () => {
    console.log("handleUserRegistration", { identity, accounts, agent });

    if (!agent) {
      console.log("No NFID agent available");
      setRegistrationStatus("Please log in with NFID to continue");
      return;
    }

    setIsLoading(true);
    try {
      const api = createBackendAPI(agent);

      // First, try to register the user
      console.log("register");
      const registrationResult = await api.register();
      setRegistrationStatus(registrationResult);
      console.log("Registration Result:", registrationResult);

      // Then, fetch the user profile
      const profile = await api.getMyProfile();
      setUserProfile(profile);
      console.log("Profile:", profile);
    } catch (error) {
      console.error("Error during registration/profile fetch:", error);
      setRegistrationStatus(
        "Failed to register or fetch profile. Please check console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!agent) {
      console.log("No NFID agent available for refresh");
      return;
    }

    setIsLoading(true);
    try {
      const api = createBackendAPI(agent);
      const profile = await api.getMyProfile();
      setUserProfile(profile);
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
        {!agent && (
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
        Authentication: {agent ? "✅ NFID Connected" : "❌ NFID Not Connected"}
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
          <p>Principal: {userProfile.principal}</p>
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
        disabled={isLoading || !agent}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
      >
        {isLoading ? "Refreshing..." : "Refresh Profile"}
      </button>

      <button
        onClick={handleUserRegistration}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        disabled={isLoading || !agent}
      >
        {isLoading ? "Registering..." : "Register"}
      </button>

      {/* Payment button would go here */}
    </div>
  );
}
