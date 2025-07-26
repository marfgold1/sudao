import React from "react";
import Greet from "./greet";
import { useAccounts } from "@nfid/identitykit/react";
import UserProfile from "@/components/Auth/Profile";

const Example: React.FC = () => {
  const account = useAccounts();
  console.log(account);

  return (
    <main className="flex flex-col w-full min-h-screen pt-20">
        <UserProfile />
        <p>HALO INI EXAMPLE PAGE</p>
        <Greet />
    </main>
  );
};

export default Example;