import { useState, useCallback } from 'react';
import { useAgents } from './useAgents';
import { Principal } from '@dfinity/principal';
import { Transaction } from '../types';
import { handleCertificateError } from '../utils/errorHandler';

export const useTransactions = () => {
  const { agents } = useAgents();
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async (daoCanisterId: string): Promise<Transaction[]> => {
    if (!agents.icpLedger || !daoCanisterId) return [];
    
    setLoading(true);
    try {
      const daoPrincipal = Principal.fromText(daoCanisterId);
      const daoAccount = { owner: daoPrincipal, subaccount: [] };
      
      // Get recent blocks from ICP ledger
      const response = await agents.icpLedger.query_blocks({
        start: 0n,
        length: 100n
      });
      
      const transactions: Transaction[] = [];
      
      // Process blocks to extract transactions involving the DAO
      for (const block of response.blocks) {
        if (!block.transaction.operation) continue;
        
        const operation = block.transaction.operation[0];
        if (!operation) continue;
        
        let transaction: Transaction | null = null;
        
        if ('Transfer' in operation) {
          const transfer = operation.Transfer;
          const fromAccount = transfer.from.toString();
          const toAccount = transfer.to.toString();
          const daoAccount = daoPrincipal.toString();
          
          if (fromAccount === daoAccount) {
            // Outgoing transaction
            transaction = {
              id: block.parent_hash ? Array.from(block.parent_hash).join('') : Math.random().toString(),
              account: fromAccount.slice(0, 8) + '...' + fromAccount.slice(-6),
              amount: transfer.amount.e8s,
              type: 'Out',
              beneficiary: 'External Account',
              address: toAccount.slice(0, 8) + '...' + toAccount.slice(-6),
              date: new Date(Number(block.timestamp.timestamp_nanos) / 1000000).toISOString().split('T')[0]
            };
          } else if (toAccount === daoAccount) {
            // Incoming transaction
            transaction = {
              id: block.parent_hash ? Array.from(block.parent_hash).join('') : Math.random().toString(),
              account: fromAccount.slice(0, 8) + '...' + fromAccount.slice(-6),
              amount: transfer.amount.e8s,
              type: 'In',
              beneficiary: 'Collective Treasury',
              address: toAccount.slice(0, 8) + '...' + toAccount.slice(-6),
              date: new Date(Number(block.timestamp.timestamp_nanos) / 1000000).toISOString().split('T')[0]
            };
          }
        }
        
        if (transaction) {
          transactions.push(transaction);
        }
      }
      
      return transactions.reverse();
      
    } catch (err) {
      if (handleCertificateError(err)) {
        return [];
      }
      console.error('Failed to fetch transactions:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [agents.icpLedger]);

  return {
    fetchTransactions,
    loading
  };
};