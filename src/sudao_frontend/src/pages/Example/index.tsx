import React, { useEffect } from "react";
import Greet from "./greet";
import { useAccounts } from "@nfid/identitykit/react";
import Profile from "@/components/Auth/Profile";

const Example: React.FC = () => {
  const account = useAccounts();

  useEffect(() => {
    console.log(`Account: ${account}`);
  }, [account]);

  return (
    <main className="flex flex-col w-full min-h-screen pt-20">
      {account && (
        <div>
          {account.length > 0 && (
            <div>
              {account.map((account) => (
                <div key={account.principal.toString()}>
                  {account.principal.toString()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <p>HALO INI EXAMPLE PAGE</p>
      <Profile />
      <Greet />
    </main>
  );
};

export default Example;
