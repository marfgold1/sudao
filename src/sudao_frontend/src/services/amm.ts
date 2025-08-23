import { Actor, HttpAgent } from "@dfinity/agent"
import { Principal } from "@dfinity/principal"
import { idlFactory as idlFactoryAMM } from "declarations/sudao_amm/index"
import type { _SERVICE as _SERVICE_AMM } from "declarations/sudao_amm/sudao_amm.did"

export interface AMMTransaction {
  id: string
  user: string
  transactionType: 'swap' | 'add_liquidity'
  tokenIn: string
  tokenOut?: string
  amountIn: number
  amountOut: number
  timestamp: bigint
}

export const getAMMTransactionHistory = async (ammCanisterId: string): Promise<AMMTransaction[]> => {
  console.log('[AMM] getAMMTransactionHistory called with canisterId:', ammCanisterId)
  try {
    console.log('[AMM] Creating HttpAgent')
    const agent = new HttpAgent()
    if (process.env.DFX_NETWORK !== "ic") {
      console.log('[AMM] Fetching root key for local development')
      await agent.fetchRootKey()
    }
    
    console.log('[AMM] Creating AMM actor')
    const ammActor = Actor.createActor<_SERVICE_AMM>(idlFactoryAMM, {
      agent,
      canisterId: ammCanisterId
    })
    
    console.log('[AMM] Calling get_transaction_history')
    const transactions = await ammActor.get_transaction_history()
    
    console.log('[AMM] Received transactions:', transactions)
    return transactions.map(tx => ({
      id: tx.id.toString(),
      user: tx.user.toString(),
      transactionType: tx.transaction_type as 'swap' | 'add_liquidity',
      tokenIn: tx.token_in.toString(),
      tokenOut: tx.token_out?.[0]?.toString(),
      amountIn: Number(tx.amount_in),
      amountOut: Number(tx.amount_out),
      timestamp: tx.timestamp
    }))
  } catch (error) {
    console.error('Failed to fetch AMM transaction history:', error)
    return []
  }
}