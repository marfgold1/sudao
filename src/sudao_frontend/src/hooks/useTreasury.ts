import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAgents } from './useAgents';
import { useTransactions } from './useTransactions';
import { mockTransactions } from '../mocks';
import type { Transaction } from '../types';
import { Principal } from '@dfinity/principal';
import { handleCertificateError } from '../utils/errorHandler';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export type TreasuryBalance = {
  icp: number;
  governance: number;
};

export const useTreasury = (daoCanisterId: string | null) => {
  const { agents, canisterIds } = useAgents();
  const { fetchTransactions } = useTransactions();
  const [balance, setBalance] = useState<TreasuryBalance>({ icp: 0, governance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: { balance: TreasuryBalance; transactions: Transaction[] }; timestamp: number; canisterId: string } | null>(null);

  const fetchTreasuryData = useCallback(async (forceRefresh = false) => {
    if (!daoCanisterId || !agents.icpLedger || !agents.daoLedger) return;
    
    // Check cache first
    const now = Date.now();
    const cached = cacheRef.current;
    
    if (!forceRefresh && cached && cached.canisterId === daoCanisterId && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('[useTreasury] Using cached treasury data');
      setBalance(cached.data.balance);
      setTransactions(cached.data.transactions);
      return;
    }
    
    console.log('[useTreasury] Fetching fresh treasury data from ledgers');
    setLoading(true);
    setError(null);
    
    try {
      const daoPrincipal = Principal.fromText(daoCanisterId);
      
      // Fetch balances and transactions from ledgers
      const [icpBalance, govBalance, ledgerTransactions] = await Promise.all([
        agents.icpLedger.icrc1_balance_of({ owner: daoPrincipal, subaccount: [] }),
        agents.daoLedger.icrc1_balance_of({ owner: daoPrincipal, subaccount: [] }),
        fetchTransactions(daoCanisterId)
      ]);
      
      const treasuryBalance: TreasuryBalance = {
        icp: Number(icpBalance) / 100000000, // Convert from e8s
        governance: Number(govBalance) / 100000000 // Convert from e8s
      };
      
      // Use only real transactions from ledger
      const convertedTransactions: Transaction[] = ledgerTransactions;
      console.log('[useTreasury] Treasury transactions:', convertedTransactions);
      
      // Update cache
      cacheRef.current = {
        data: { balance: treasuryBalance, transactions: convertedTransactions },
        timestamp: now,
        canisterId: daoCanisterId
      };
      
      setBalance(treasuryBalance);
      setTransactions(convertedTransactions);
    } catch (err) {
      // Handle certificate errors with auto-reload
      if (handleCertificateError(err)) {
        return; // Page will reload
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch treasury data';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Set empty data on error
      setBalance({ icp: 0, governance: 0 });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [daoCanisterId, agents.icpLedger, agents.daoLedger, fetchTransactions]);

  useEffect(() => {
    fetchTreasuryData();
  }, [fetchTreasuryData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!daoCanisterId) return;
    
    const interval = setInterval(() => {
      fetchTreasuryData(true);
    }, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, [daoCanisterId, fetchTreasuryData]);

  return {
    balance,
    transactions,
    loading,
    error,
    refetch: () => fetchTreasuryData(false),
    refreshTreasury: () => fetchTreasuryData(true)
  };
};