import { IdentityKitAuthType, InternetIdentity, NFIDW } from "@nfid/identitykit";
import { IdentityKitProvider, useAccounts, useIdentity } from "@nfid/identitykit/react";
import { canisterId as explorerCanId } from "declarations/sudao_be_explorer";
import React, { useContext, useMemo, useState } from "react";
import { CanistersContext } from "@/contexts/canisters/context";
import "@nfid/identitykit/react/styles.css";
import { IdentityContext, NFIDAccount } from "./context";

export const IdentityProvider = ({ children }: { children: React.ReactNode }) => {
    const canisterContext = useContext(CanistersContext);

    const targets = useMemo(() => {
        const t = [explorerCanId];
        for (const canId of Object.values(canisterContext?.canisterIds || {})) {
            if (canId) t.push(canId);
        }
        return t;
    }, [canisterContext?.canisterIds]);

    return (
        <IdentityKitProvider
            signers={[InternetIdentity, NFIDW]}
            signerClientOptions={{
                targets,
            }}
            authType={IdentityKitAuthType.DELEGATION}
        >
            <AccountContext>
                {children}
            </AccountContext>
        </IdentityKitProvider>
    );
};

const AccountContext = ({ children }: { children: React.ReactNode }) => {
    const identity = useIdentity();
    const accounts = useAccounts();
    const [currentAccountIdx, setCurrentAccountIdx] = useState(0);

    const currentAccount: NFIDAccount | null = useMemo(() => {
        if (identity) return NFIDAccount.fromAccount({ principal: identity.getPrincipal() });
        if (accounts && accounts.length > 0) {
            if (currentAccountIdx >= accounts.length) return NFIDAccount.fromAccount(accounts[0]);
            return NFIDAccount.fromAccount(accounts[currentAccountIdx]);
        };
        return null;
    }, [identity, accounts, currentAccountIdx]);

    return (
        <IdentityContext.Provider value={{
            currentAccount,
            setCurrentAccountIdx,
            accounts,
        }}>
            {children}
        </IdentityContext.Provider>
    )
}
