import React from "react";
import Greet from "./greet";

const Example: React.FC = () => {
    return (
        <main className="flex flex-col w-full min-h-screen">
            HALO INI HOME PAGE
            <Greet />
        </main>
    );
};

export default Example;