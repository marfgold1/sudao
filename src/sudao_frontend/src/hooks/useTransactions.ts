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
      // For now, show all transactions since they're contributions to the DAO ecosystem
      console.log('[useTransactions] Fetching all recent transactions');
      
      // Get recent blocks from ICP ledger
      const response = await agents.icpLedger.query_blocks({
        start: 0n,
        length: 100n
      });
      
      const transactions: Transaction[] = [];
      
      console.log(`📊 Processing ${response.blocks.length} blocks`);
      
      // Process blocks to extract transactions involving the DAO
      for (let i = 0; i < response.blocks.length; i++) {
        const block = response.blocks[i];
        const operation = block.transaction.operation?.[0];
        
        if (!operation) {
          console.log(`⏭️  Block ${i}: No operation`);
          continue;
        }
        
        let transaction: Transaction | null = null;
        
        // Handle different operation types
        if ('Transfer' in operation) {
          const transfer = operation.Transfer;
          
          // Original raw log
          console.log(`Block ${i} Transfer:`, transfer);
          
          const fromHex = Array.from(transfer.from).map(b => b.toString(16).padStart(2, '0')).join('');
          const toHex = Array.from(transfer.to).map(b => b.toString(16).padStart(2, '0')).join('');
          
          // Parsed log
          console.log(`💸 Block ${i}: Transfer ${Number(transfer.amount.e8s)/1e8} ICP`);
          console.log(`   From: ${fromHex.slice(0, 16)}...${fromHex.slice(-8)}`);
          console.log(`   To:   ${toHex.slice(0, 16)}...${toHex.slice(-8)}`);
          
          transaction = {
            id: block.parent_hash ? Array.from(block.parent_hash).join('') : Math.random().toString(),
            account: fromHex.slice(0, 8) + '...' + fromHex.slice(-6),
            amount: transfer.amount.e8s,
            type: 'Out',
            beneficiary: 'Transfer',
            address: toHex.slice(0, 8) + '...' + toHex.slice(-6),
            date: new Date(Number(block.timestamp.timestamp_nanos) / 1000000).toISOString().split('T')[0]
          };
        } else if ('Approve' in operation) {
          const approve = operation.Approve;
          
          // Original raw log
          console.log(`Block ${i} Approve:`, approve);
          
          const fromHex = Array.from(approve.from).map(b => b.toString(16).padStart(2, '0')).join('');
          const spenderHex = Array.from(approve.spender).map(b => b.toString(16).padStart(2, '0')).join('');
          
          // Parsed log
          console.log(`✅ Block ${i}: Approve ${Number(approve.allowance.e8s)/1e8} ICP`);
          console.log(`   From:    ${fromHex.slice(0, 16)}...${fromHex.slice(-8)}`);
          console.log(`   Spender: ${spenderHex.slice(0, 16)}...${spenderHex.slice(-8)}`);
          
          transaction = {
            id: block.parent_hash ? Array.from(block.parent_hash).join('') : Math.random().toString(),
            account: fromHex.slice(0, 8) + '...' + fromHex.slice(-6),
            amount: approve.allowance.e8s,
            type: 'In',
            beneficiary: 'Contribution Approval',
            address: spenderHex.slice(0, 8) + '...' + spenderHex.slice(-6),
            date: new Date(Number(block.timestamp.timestamp_nanos) / 1000000).toISOString().split('T')[0]
          };
        } else if ('Mint' in operation) {
          const mint = operation.Mint;
          
          // Original raw log
          console.log(`Block ${i} Mint:`, mint);
          
          const toHex = Array.from(mint.to).map(b => b.toString(16).padStart(2, '0')).join('');
          
          // Parsed log
          console.log(`🪙 Block ${i}: Mint ${Number(mint.amount.e8s)/1e8} ICP`);
          console.log(`   To: ${toHex.slice(0, 16)}...${toHex.slice(-8)}`);
          
          transaction = {
            id: block.parent_hash ? Array.from(block.parent_hash).join('') : Math.random().toString(),
            account: 'System',
            amount: mint.amount.e8s,
            type: 'In',
            beneficiary: 'Token Mint',
            address: toHex.slice(0, 8) + '...' + toHex.slice(-6),
            date: new Date(Number(block.timestamp.timestamp_nanos) / 1000000).toISOString().split('T')[0]
          };
        } else {
          // Original raw log
          console.log(`Block ${i} Unknown operation:`, operation);
          // Parsed log
          console.log(`❓ Block ${i}: Unknown operation:`, Object.keys(operation)[0]);
        }
        
        if (transaction) {
          console.log(`✨ Added: ${transaction.type} ${Number(transaction.amount)/1e8} ICP`);
          transactions.push(transaction);
        }
      }
      
      console.log(`🎯 Found ${transactions.length} transactions total`);
      
      const result = transactions.reverse();
      setLoading(false); // Set loading to false immediately after processing
      return result;
      
    } catch (err) {
      setLoading(false);
      if (handleCertificateError(err)) {
        return [];
      }
      console.error('Failed to fetch transactions:', err);
      return [];
    }
  }, [agents.icpLedger]);

  return {
    fetchTransactions,
    loading
  };
};