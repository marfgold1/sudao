import { useState, useCallback } from 'react';
import { useAgents } from './useAgents';
import { Principal } from '@dfinity/principal';
import { Transaction } from '../types';
import { handleCertificateError } from '../utils/errorHandler';
import { AccountIdentifier } from '@dfinity/ledger-icp';

// Convert account identifier to principal (best effort)
const accountIdToPrincipal = (accountIdBytes: Uint8Array): string => {
  try {
    // Try to extract principal from account identifier
    // Account ID = hash(principal + subaccount), so we can't directly reverse it
    // But for default subaccounts (all zeros), we can try to match known patterns
    const accountId = AccountIdentifier.fromHex(Array.from(accountIdBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    const hex = accountId.toHex();
    
    // For display purposes, show truncated hex that looks like a principal
    return hex.slice(0, 5) + '-' + hex.slice(5, 10) + '-' + hex.slice(10, 15) + '-' + hex.slice(15, 20) + '-' + hex.slice(20, 23);
  } catch {
    // Fallback to hex format
    const hex = Array.from(accountIdBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 8) + '...' + hex.slice(-6);
  }
};

export const useTransactions = () => {
  const { agents } = useAgents();
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async (daoCanisterId: string): Promise<Transaction[]> => {
    if (!agents.icpLedger || !daoCanisterId) return [];
    
    setLoading(true);
    try {
      console.log(`[useTransactions] Fetching transactions for DAO: ${daoCanisterId}`);
      
      // Get DAO account identifier for filtering
      const daoAccount = { owner: Principal.fromText(daoCanisterId), subaccount: [] as [] };
      const daoAccountId = await agents.icpLedger.account_identifier(daoAccount);
      console.log(`[useTransactions] DAO account ID: ${Array.from(daoAccountId).map(b => b.toString(16).padStart(2, '0')).join('')}`);
      
      // Get recent blocks from ICP ledger
      const response = await agents.icpLedger.query_blocks({
        start: 0n,
        length: 1000n // Get more blocks to find DAO-related transactions
      });
      
      const transactions: Transaction[] = [];
      const daoAccountHex = Array.from(daoAccountId).map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log(`[useTransactions] Processing ${response.blocks.length} blocks for DAO transactions`);
      
      // Process blocks to extract transactions involving the DAO
      for (let i = 0; i < response.blocks.length; i++) {
        const block = response.blocks[i];
        const operation = block.transaction.operation?.[0];
        
        if (!operation) continue;
        
        let transaction: Transaction | null = null;
        
        // Handle Transfer operations  
        if ('Transfer' in operation) {
          const transfer = operation.Transfer;
          const fromHex = Array.from(new Uint8Array(transfer.from)).map(b => b.toString(16).padStart(2, '0')).join('');
          const toHex = Array.from(new Uint8Array(transfer.to)).map(b => b.toString(16).padStart(2, '0')).join('');
          
          // Check if this transaction involves the DAO
          const isDAOReceiver = toHex === daoAccountHex;
          const isDAOSender = fromHex === daoAccountHex;
          
          if (isDAOReceiver || isDAOSender) {
            console.log(`[useTransactions] Found DAO transaction in block ${i}: ${isDAOReceiver ? 'Incoming' : 'Outgoing'} ${Number(transfer.amount.e8s)/1e8} ICP`);
            
            // For display, show the DAO canister ID as principal for the DAO side
            const fromDisplay = isDAOSender ? daoCanisterId : accountIdToPrincipal(new Uint8Array(transfer.from));
            const toDisplay = isDAOReceiver ? daoCanisterId : accountIdToPrincipal(new Uint8Array(transfer.to));
            
            transaction = {
              id: `${i}-${block.timestamp.timestamp_nanos}`,
              account: fromDisplay,
              amount: transfer.amount.e8s,
              type: isDAOReceiver ? 'In' : 'Out',
              beneficiary: isDAOReceiver ? 'DAO Contribution' : 'DAO Payment',
              address: toDisplay,
              date: new Date(Number(block.timestamp.timestamp_nanos) / 1000000).toISOString().split('T')[0]
            };
          }
        }
        
        if (transaction) {
          transactions.push(transaction);
        }
      }
      
      console.log(`[useTransactions] Found ${transactions.length} DAO-related transactions`);
      
      setLoading(false);
      return transactions.reverse(); // Most recent first
      
    } catch (err) {
      setLoading(false);
      if (handleCertificateError(err)) {
        return [];
      }
      console.error('[useTransactions] Failed to fetch transactions:', err);
      return [];
    }
  }, [agents.icpLedger]);

  return {
    fetchTransactions,
    loading
  };
};