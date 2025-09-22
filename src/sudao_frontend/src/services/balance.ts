// Balance service placeholder
export interface BalanceService {
  getBalance: (account: string) => Promise<number>;
}

export const balanceService: BalanceService = {
  getBalance: async (_account: string) => {
    return 0;
  }
};

export interface UserBalances {
  icp: bigint;
  governance: bigint;
}

export const checkUserBalances = async (_account: string): Promise<UserBalances> => {
  return { icp: 0n, governance: 0n };
};