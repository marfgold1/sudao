import React from "react";
import UserProfile from "@/components/Auth/Profile";
import { ConnectWallet } from "@nfid/identitykit/react";

const Home: React.FC = () => {

    return (
    <main className="flex flex-col w-full min-h-screen">
      <UserProfile />
      <ConnectWallet />

    </main>
  );
};

export default Home;
