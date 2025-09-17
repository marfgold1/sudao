import { createContext } from "react";
import { Account as ICRC1Account } from "declarations/sudao_ledger/sudao_ledger.did";
import { SubAccount as NFIDSubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { useAccounts } from "@nfid/identitykit/react";
import { MakeOpt } from "@/utils/converter";

type Account = (NonNullable<ReturnType<typeof useAccounts>>) extends (infer T)[] ? T : never;

export class NFIDAccount {
    principal: Principal;
    subAccount?: NFIDSubAccount;

    constructor(principal: Principal, subAccount?: NFIDSubAccount) {
        this.principal = principal;
        this.subAccount = subAccount;
    }

    toICRC1Account(): ICRC1Account {
        return {
            owner: this.principal,
            subaccount: MakeOpt(this.subAccount?.toUint8Array()),
        }
    }

    toString(): string {
        return `${this.principal.toString()}${this.subAccount ? ` [Account] - ${this.subAccount.toString()} [SubAccount]` : ""}`;
    }

    static fromAccount(acc: Account): NFIDAccount {
        return new NFIDAccount(
            acc.principal,
            acc.subAccount,
        );
    }
}

type IdentityContextType = {
  currentAccount: NFIDAccount | null;
  setCurrentAccountIdx: (idx: number) => void;
  accounts: Account[] | undefined;
};

export const IdentityContext = createContext<IdentityContextType | undefined>(undefined);