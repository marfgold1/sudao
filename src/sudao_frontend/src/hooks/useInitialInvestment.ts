import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import { toast } from 'react-toastify';
import { useAgents } from './useAgents';
import { useAccount } from './useAccount';
import type { Icrc1TransferError } from 'declarations/icp_ledger_canister/icp_ledger_canister.did';

const handleTransferError = (error: Icrc1TransferError): string => {
  if ('InsufficientFunds' in error) {
    const balance = Number(error.InsufficientFunds.balance) / 100000000;
    return `Insufficient balance. You have ${balance.toFixed(8)} ICP`;
  }
  if ('BadFee' in error) {
    const expectedFee = Number(error.BadFee.expected_fee) / 100000000;
    return `Incorrect fee. Expected: ${expectedFee.toFixed(8)} ICP`;
  }
  if ('TooOld' in error) {
    return 'Transaction expired. Please try again';
  }
  if ('Duplicate' in error) {
    return `Duplicate transaction. Original block: ${error.Duplicate.duplicate_of}`;
  }
  if ('TemporarilyUnavailable' in error) {
    return 'Ledger temporarily unavailable. Please retry';
  }
  if ('GenericError' in error) {
    return `Error: ${error.GenericError.message}`;
  }
  return 'Unknown transfer error';
};

export const useInitialInvestment = () => {
  const { agents } = useAgents();
  const { currentAccount } = useAccount();
  const [loading, setLoading] = useState(false);

  const getBalance = async (account: { owner: Principal; subaccount: [] }): Promise<number> => {
    if (!agents.icpLedger) return 0;
    const balance = await agents.icpLedger.icrc1_balance_of(account);
    return Number(balance) / 100000000;
  };

  const transferICP = async (amount: number, daoCanisterId: string): Promise<bigint> => {
    if (!agents.icpLedgerAuth || !currentAccount) {
      throw new Error('ICP Ledger or account not available');
    }

    const userAccount = { owner: currentAccount.principal, subaccount: [] as [] };
    const daoAccount = { owner: Principal.fromText(daoCanisterId), subaccount: [] as [] };
    
    // Log initial balances
    const userInitialBalance = await getBalance(userAccount);
    const daoInitialBalance = await getBalance(daoAccount);
    console.log(`[Investment] Initial user balance: ${userInitialBalance.toFixed(8)} ICP`);
    console.log(`[Investment] Initial DAO balance: ${daoInitialBalance.toFixed(8)} ICP`);

    const amountE8s = BigInt(Math.floor(amount * 100000000));
    console.log(`[Investment] Transferring ${amount} ICP (${amountE8s} e8s) from ${currentAccount.principal.toString()} to ${daoCanisterId}`);
    
    const result = await agents.icpLedgerAuth.icrc1_transfer({
      to: daoAccount,
      amount: amountE8s,
      fee: [],
      memo: [],
      from_subaccount: [],
      created_at_time: []
    });

    if ('Err' in result) {
      console.error('[Investment] Transfer failed:', result.Err);
      throw new Error(handleTransferError(result.Err));
    }

    console.log(`[Investment] Transfer successful, block index: ${result.Ok}`);
    
    // Log final balances
    const userFinalBalance = await getBalance(userAccount);
    const daoFinalBalance = await getBalance(daoAccount);
    console.log(`[Investment] Final user balance: ${userFinalBalance.toFixed(8)} ICP`);
    console.log(`[Investment] Final DAO balance: ${daoFinalBalance.toFixed(8)} ICP`);
    console.log(`[Investment] User balance change: ${(userFinalBalance - userInitialBalance).toFixed(8)} ICP`);
    console.log(`[Investment] DAO balance change: ${(daoFinalBalance - daoInitialBalance).toFixed(8)} ICP`);

    return result.Ok;
  };

  const markCompleted = async (daoId: string, _blockIndex?: bigint): Promise<void> => {
    if (!agents.explorerDao) {
      throw new Error('Explorer DAO not available');
    }

    console.log(`[Investment] Calling markInitialInvestmentCompleted for DAO: ${daoId}`);
    const result = await agents.explorerDao.markInitialInvestmentCompleted(daoId);
    
    if ('err' in result) {
      console.error('[Investment] Failed to mark investment as completed:', result.err);
      throw new Error(`Failed to mark investment as completed: ${result.err}`);
    }
    
    console.log('[Investment] Successfully marked investment as completed');
    
    // Verify the investment is marked as completed
    const isCompleted = await agents.explorerDao.isInitialInvestmentCompleted(daoId);
    console.log(`[Investment] Investment completion verified: ${isCompleted}`);
  };

  const processInvestment = async (amount: number, daoId: string, daoCanisterId: string) => {
    setLoading(true);
    try {
      console.log(`[Investment] Starting investment process`);
      console.log(`[Investment] Amount: ${amount} ICP`);
      console.log(`[Investment] DAO ID: ${daoId}`);
      console.log(`[Investment] DAO Canister ID: ${daoCanisterId}`);
      console.log(`[Investment] User Principal: ${currentAccount?.principal.toString()}`);
      
      // 1. Transfer ICP to DAO treasury
      const blockIndex = await transferICP(amount, daoCanisterId);
      
      // 2. Mark investment as completed
      console.log(`[Investment] Marking investment as completed...`);
      await markCompleted(daoId, blockIndex);
      
      // 3. Force refresh of DAO data to update initialInvestmentCompleted flag
      console.log(`[Investment] Forcing DAO data refresh...`);
      // Note: The refetch will be handled by the calling component
      
      toast.success(`Successfully invested ${amount} ICP in the DAO!`);
      return blockIndex;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Investment failed';
      console.error('[Investment] Error:', errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    processInvestment,
    loading
  };
};