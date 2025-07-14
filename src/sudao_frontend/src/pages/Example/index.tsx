import React from "react";
import Greet from "./greet";
import { useAccounts } from "@nfid/identitykit/react";

const Example: React.FC = () => {
  const account = useAccounts();
  console.log(account);
  return (
    <main className="flex flex-col w-full min-h-screen pt-20">
        {account && (
            <div>
                {account.length > 0 && (
                    <div>
                        {account.map((account) => (
                            <div key={account.principal.toString()}>{account.principal.toString()}</div>
                        ))}
                    </div>
                )}
            </div>
        )}
        <p>HALO INI EXAMPLE PAGE</p>
        <Greet />
    </main>
  );
};

export default Example;