import { useState, useEffect } from 'react';
import { useAgent } from '@nfid/identitykit/react';
import { toast } from 'react-toastify';
import { 
  getTreasuryBalance, 
  getTransactionHistory, 
  type TreasuryBalance, 
  type TransactionRecord 
} from '../services/treasury';
import { mockTransactions } from '../mocks';
import type { Transaction } from '../types';

export const useTreasury = (canisterId: string | null) => {
  const agent = useAgent();
  const [balance, setBalance] = useState<TreasuryBalance>({ icp: 0, governance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasuryData = async () => {
    if (!canisterId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [treasuryBalance, transactionHistory] = await Promise.all([
        getTreasuryBalance(canisterId, agent || undefined),
        getTransactionHistory(canisterId, agent || undefined)
      ]);
      
      setBalance(treasuryBalance);
      
      // Convert backend transactions to frontend format
      const convertedTransactions: Transaction[] = transactionHistory.map(tx => ({
        id: tx.id,
        account: tx.from,
        amount: tx.amount,
        type: tx.transactionType === 'Deposit' ? 'In' : 'Out',
        beneficiary: tx.transactionType === 'Deposit' ? 'Collective Treasury' : tx.to,
        address: tx.to,
        date: new Date(Number(tx.timestamp) / 1000000).toISOString().split('T')[0]
      }));
      
      setTransactions(convertedTransactions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch treasury data';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback to mock data
      setBalance({ icp: 1250, governance: 5000 });
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasuryData();
  }, [canisterId, agent]);

  return {
    balance,
    transactions,
    loading,
    error,
    refetch: fetchTreasuryData
  };
};