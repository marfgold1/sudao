import { useEffect, useState } from 'react';
import { useIdentity, useAccounts } from '@nfid/identitykit/react';

export default function UserProfile() {
  const identity = useIdentity();
  const accounts = useAccounts();
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs whenever the identity or account objects change
    let principal = null;

    if (accounts) {
      console.log("Logged in with Wallet (e.g., NFID). Using account object.");
      principal = accounts[0].principal; // Get Principal from the account object
    } else if (identity) {
      console.log("Logged in with Internet Identity. Using identity object.");
      principal = identity.getPrincipal(); // Get Principal from the identity object
    } else {
      console.log("No accounts or identity found");
      setUserPrincipal(null);
    }

    if (principal) {
      setUserPrincipal(principal.toString());
      // Now that we have the Principal, we can register the user in the backend
      registerUserInBackend(principal.toString());
      console.log(`Principal: ${principal}`);
    }

  }, [identity, accounts]); // Rerun when either identity or account is populated

  // This function would call your backend
  const registerUserInBackend = async (principal: string) => {
    // NOTE: You still need an authenticated agent to make the call.
    // The `createActor` function should be able to handle either identity or an ICRC-25 signer.
    // Modern agent libraries can often be initialized with a 'signer' object, which `account` conforms to.
    console.log(`Registering principal ${principal} in backend...`);
    // ... logic to create actor and call backend.register()
  };

  if (!userPrincipal) {
    return <p>Please log in to see your profile.</p>;
  }

  return (
    <div>
      <h2>Your Universal Identifier</h2>
      <p>Your Principal is: {userPrincipal}</p>
      {/* Payment button would go here */}
    </div>
  );
}