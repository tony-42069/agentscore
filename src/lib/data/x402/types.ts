/**
 * x402 Protocol Types
 *
 * Types for x402 transaction data on both Base and Solana
 */

// Chain identifiers (CAIP-2 format)
export const X402_CHAINS = {
  base: "eip155:8453",
  baseSepolia: "eip155:84532",
  solana: "solana",
  solanaDevnet: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
} as const;

export type X402Chain = "base" | "solana";

// Token addresses
export const TOKENS = {
  base: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  solana: {
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
} as const;

export interface X402Transaction {
  txHash: string;
  chain: X402Chain;
  buyerAddress: string;
  sellerAddress: string;
  facilitatorAddress: string;
  amountRaw: string;
  amountUsd: number;
  asset: string;
  assetSymbol: string;
  timestamp: Date;
  blockNumber: number;
  resourceUrl?: string;
}

export interface X402AgentMetrics {
  address: string;
  chain: X402Chain;
  transactionCount: number;
  totalVolumeUsd: number;
  averageTransactionUsd: number;
  uniqueBuyers: number;
  repeatBuyerRate: number;
  firstTransactionAt: Date | null;
  lastTransactionAt: Date | null;
  daysSinceFirstTransaction: number;
  daysSinceLastTransaction: number;
  transactionsLast7Days: number;
  transactionsLast30Days: number;
  volumeLast7Days: number;
  volumeLast30Days: number;
}

export interface X402DataSource {
  getAgentMetrics(address: string): Promise<X402AgentMetrics>;
  getRecentTransactions(
    address: string,
    limit?: number
  ): Promise<X402Transaction[]>;
}

/**
 * Create empty metrics for an address with no data
 */
export function createEmptyMetrics(
  address: string,
  chain: X402Chain
): X402AgentMetrics {
  return {
    address,
    chain,
    transactionCount: 0,
    totalVolumeUsd: 0,
    averageTransactionUsd: 0,
    uniqueBuyers: 0,
    repeatBuyerRate: 0,
    firstTransactionAt: null,
    lastTransactionAt: null,
    daysSinceFirstTransaction: 0,
    daysSinceLastTransaction: 0,
    transactionsLast7Days: 0,
    transactionsLast30Days: 0,
    volumeLast7Days: 0,
    volumeLast30Days: 0,
  };
}
