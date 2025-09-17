import { useCallback, useContext } from "react";
import { IdentityContext } from "@/contexts/identity/context";
import { useAgents } from "./useAgents";

export interface UserBalances {
    icp: bigint;
    governance: bigint;
}

interface AccountHook {
    getUserBalances: () => Promise<UserBalances | null>;
}

export const useAccount = (): AccountHook & NonNullable<React.ContextType<typeof IdentityContext>> => {
    const identityContext = useContext(IdentityContext);
    const { agents: { icpLedger, daoLedger } } = useAgents();

    if (!identityContext) {
        throw new Error('IdentityContext not found');
    }

    const { currentAccount, setCurrentAccountIdx, accounts } = identityContext;

    const getUserBalances = useCallback(async () => {
        if (currentAccount === null || !daoLedger) return null;
        const icrc1Account = currentAccount.toICRC1Account();
        const [icpBalance, daoBalance] = await Promise.all([
            icpLedger.icrc1_balance_of(icrc1Account),
            daoLedger.icrc1_balance_of(icrc1Account)]);
        return {
            icp: icpBalance,
            governance: daoBalance,
        };
    }, [icpLedger, daoLedger, currentAccount]);

    return {
        getUserBalances,
        currentAccount,
        setCurrentAccountIdx,
        accounts,
    };
}
