import React from "react";
import { useAccounts } from "@nfid/identitykit/react";

const Home: React.FC = () => {
  const account = useAccounts();
  console.log(account);
  return (
    <main className="flex flex-col w-full min-h-screen">
      {account && (
        <div>
          {account.length > 0 && (
            <div>
              {account.map((account) => (
                <div key={account.principal.toString()}>{account.principal.toString()}</div>
              ))}
            </div>
          )}
          <p>HALO INI HOME PAGE</p>
        </div>
      )}
    </main>
  );
};

export default Home;
