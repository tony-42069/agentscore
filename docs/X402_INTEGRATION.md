# x402 Integration Guide

## Overview

x402 is the payment protocol that powers agent-to-agent transactions. AgentScore reads transaction data from x402 on both Base and Solana to assess an agent's commercial track record.

## Data Sources

### Option 1: CDP Discovery API (Recommended)
The Coinbase Developer Platform provides a discovery endpoint for x402 resources.

**Endpoint:** `GET https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources`

**Authentication:** Requires CDP API credentials

### Option 2: x402scan Indexer
x402scan (www.x402scan.com) indexes all x402 transactions and provides statistics.

**Note:** Check if x402scan has a public API. If not, you may need to:
- Contact the x402scan team for API access
- Build your own indexer from on-chain data

### Option 3: Direct On-Chain Parsing
Parse x402 transactions directly from blockchain data:
- Base: Look for transactions to known facilitator addresses
- Solana: Parse transactions involving x402 program

## x402 Transaction Data Model

```typescript
export interface X402Transaction {
  // Transaction identifiers
  txHash: string;
  chain: 'base' | 'solana';
  
  // Parties
  buyerAddress: string;
  sellerAddress: string;
  facilitatorAddress: string;
  
  // Payment details
  amountRaw: string;       // Raw amount in token units
  amountUsd: number;       // Converted to USD
  asset: string;           // Token address/mint
  assetSymbol: string;     // USDC, SOL, etc.
  
  // Timing
  timestamp: Date;
  blockNumber: number;
  
  // Resource info (if available)
  resourceUrl?: string;
  resourceDescription?: string;
}

export interface X402AgentMetrics {
  // Identification
  address: string;
  chain: 'base' | 'solana';
  
  // Volume metrics
  transactionCount: number;
  totalVolumeUsd: number;
  averageTransactionUsd: number;
  
  // Relationship metrics
  uniqueBuyers: number;
  repeatBuyerRate: number;  // % of buyers who returned
  
  // Temporal metrics
  firstTransactionAt: Date | null;
  lastTransactionAt: Date | null;
  daysSinceFirstTransaction: number;
  daysSinceLastTransaction: number;
  
  // Activity patterns
  transactionsLast7Days: number;
  transactionsLast30Days: number;
  volumeLast7Days: number;
  volumeLast30Days: number;
}
```

## Implementation

### File: `src/lib/data/x402/types.ts`

```typescript
// Chain identifiers (CAIP-2 format)
export const X402_CHAINS = {
  base: 'eip155:8453',
  baseSepolia: 'eip155:84532',
  solana: 'solana',
  solanaDevnet: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
} as const;

export type X402Chain = 'base' | 'solana';

// Known facilitator addresses
export const FACILITATORS = {
  // CDP Facilitator
  cdp: {
    base: '0x...', // Get from CDP docs or x402scan
    solana: '...', // Solana facilitator address
  },
  // PayAI Facilitator
  payai: {
    solana: '...', // PayAI facilitator address
  },
  // Corbits Facilitator
  corbits: {
    base: '0x...',
    solana: '...',
  },
} as const;

// Token addresses
export const TOKENS = {
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  },
  solana: {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
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
  getRecentTransactions(address: string, limit?: number): Promise<X402Transaction[]>;
}
```

### File: `src/lib/data/x402/base.ts`

```typescript
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import type { X402AgentMetrics, X402Transaction, X402DataSource } from './types';
import { FACILITATORS, TOKENS } from './types';

/**
 * Fetches x402 data for agents on Base chain
 */
export class BaseX402Reader implements X402DataSource {
  private client;
  private cdpApiKey?: string;
  private cdpApiSecret?: string;

  constructor(options: { rpcUrl: string; cdpApiKey?: string; cdpApiSecret?: string }) {
    this.client = createPublicClient({
      chain: base,
      transport: http(options.rpcUrl),
    });
    this.cdpApiKey = options.cdpApiKey;
    this.cdpApiSecret = options.cdpApiSecret;
  }

  /**
   * Get aggregated metrics for an agent on Base
   * 
   * Implementation options:
   * 1. Use CDP Discovery API (if available for specific addresses)
   * 2. Query x402scan API (if they have one)
   * 3. Parse on-chain transfer events (more complex)
   */
  async getAgentMetrics(address: string): Promise<X402AgentMetrics> {
    // Try CDP API first
    if (this.cdpApiKey) {
      try {
        return await this.getMetricsFromCDP(address);
      } catch (error) {
        console.warn('CDP API failed, falling back to on-chain:', error);
      }
    }

    // Fall back to on-chain parsing
    return await this.getMetricsFromChain(address);
  }

  /**
   * Get metrics from CDP Discovery API
   */
  private async getMetricsFromCDP(address: string): Promise<X402AgentMetrics> {
    // Generate JWT for CDP API authentication
    const token = await this.generateCDPToken();
    
    const response = await fetch(
      `https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?seller=${address}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CDP API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform CDP response to our metrics format
    // NOTE: Actual response structure may differ - adjust accordingly
    return this.transformCDPResponse(address, data);
  }

  /**
   * Generate CDP API JWT token
   * See: https://docs.cdp.coinbase.com/api-reference/v2/authentication
   */
  private async generateCDPToken(): Promise<string> {
    if (!this.cdpApiKey || !this.cdpApiSecret) {
      throw new Error('CDP API credentials not configured');
    }

    // Implementation depends on your JWT library
    // This is a simplified example - use proper JWT signing in production
    const header = {
      alg: 'ES256',
      kid: this.cdpApiKey,
      typ: 'JWT',
      nonce: crypto.randomUUID(),
    };

    const payload = {
      sub: this.cdpApiKey,
      iss: 'cdp',
      aud: ['cdp_service'],
      nbf: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes
      uris: ['https://api.cdp.coinbase.com/platform/v2/x402/*'],
    };

    // In production, use a proper JWT library like 'jose'
    // This is pseudocode:
    // return await signJWT(header, payload, this.cdpApiSecret);
    throw new Error('JWT signing not implemented - use jose library');
  }

  /**
   * Transform CDP API response to our metrics format
   */
  private transformCDPResponse(address: string, data: any): X402AgentMetrics {
    // Adjust based on actual CDP API response structure
    return {
      address,
      chain: 'base',
      transactionCount: data.transactionCount || 0,
      totalVolumeUsd: data.totalVolume || 0,
      averageTransactionUsd: data.transactionCount > 0 
        ? data.totalVolume / data.transactionCount 
        : 0,
      uniqueBuyers: data.uniqueBuyers || 0,
      repeatBuyerRate: 0, // Calculate if data available
      firstTransactionAt: data.firstTransaction ? new Date(data.firstTransaction) : null,
      lastTransactionAt: data.lastTransaction ? new Date(data.lastTransaction) : null,
      daysSinceFirstTransaction: this.daysSince(data.firstTransaction),
      daysSinceLastTransaction: this.daysSince(data.lastTransaction),
      transactionsLast7Days: data.recentTransactions?.last7Days || 0,
      transactionsLast30Days: data.recentTransactions?.last30Days || 0,
      volumeLast7Days: data.recentVolume?.last7Days || 0,
      volumeLast30Days: data.recentVolume?.last30Days || 0,
    };
  }

  /**
   * Get metrics by parsing on-chain transfer events
   * This is a fallback if CDP API is not available
   */
  private async getMetricsFromChain(address: string): Promise<X402AgentMetrics> {
    // Parse USDC Transfer events where `to` is the agent address
    // This captures payments received by the agent
    
    const usdcAddress = TOKENS.base.USDC;
    
    // Get transfer events to this address
    const transferLogs = await this.client.getLogs({
      address: usdcAddress as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        to: address as `0x${string}`,
      },
      fromBlock: 'earliest', // In production, use a reasonable starting block
      toBlock: 'latest',
    });

    // Process logs
    const transactions: X402Transaction[] = [];
    const buyerSet = new Set<string>();
    let totalVolume = 0;
    let firstTx: Date | null = null;
    let lastTx: Date | null = null;

    for (const log of transferLogs) {
      const block = await this.client.getBlock({ blockNumber: log.blockNumber });
      const timestamp = new Date(Number(block.timestamp) * 1000);
      
      // USDC has 6 decimals
      const amount = Number(log.args.value) / 1e6;
      
      buyerSet.add(log.args.from as string);
      totalVolume += amount;
      
      if (!firstTx || timestamp < firstTx) firstTx = timestamp;
      if (!lastTx || timestamp > lastTx) lastTx = timestamp;
      
      transactions.push({
        txHash: log.transactionHash,
        chain: 'base',
        buyerAddress: log.args.from as string,
        sellerAddress: address,
        facilitatorAddress: '', // Would need to parse transaction to find
        amountRaw: String(log.args.value),
        amountUsd: amount,
        asset: usdcAddress,
        assetSymbol: 'USDC',
        timestamp,
        blockNumber: Number(log.blockNumber),
      });
    }

    // Calculate time-based metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const txLast7Days = transactions.filter(tx => tx.timestamp >= sevenDaysAgo);
    const txLast30Days = transactions.filter(tx => tx.timestamp >= thirtyDaysAgo);

    return {
      address,
      chain: 'base',
      transactionCount: transactions.length,
      totalVolumeUsd: totalVolume,
      averageTransactionUsd: transactions.length > 0 ? totalVolume / transactions.length : 0,
      uniqueBuyers: buyerSet.size,
      repeatBuyerRate: this.calculateRepeatRate(transactions),
      firstTransactionAt: firstTx,
      lastTransactionAt: lastTx,
      daysSinceFirstTransaction: firstTx ? this.daysSince(firstTx) : 0,
      daysSinceLastTransaction: lastTx ? this.daysSince(lastTx) : 0,
      transactionsLast7Days: txLast7Days.length,
      transactionsLast30Days: txLast30Days.length,
      volumeLast7Days: txLast7Days.reduce((sum, tx) => sum + tx.amountUsd, 0),
      volumeLast30Days: txLast30Days.reduce((sum, tx) => sum + tx.amountUsd, 0),
    };
  }

  /**
   * Get recent transactions for an agent
   */
  async getRecentTransactions(address: string, limit: number = 50): Promise<X402Transaction[]> {
    // Similar to getMetricsFromChain but just return transactions
    // Implementation omitted for brevity
    return [];
  }

  // Helper functions
  private daysSince(date: Date | string | null): number {
    if (!date) return 0;
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateRepeatRate(transactions: X402Transaction[]): number {
    const buyerCounts = new Map<string, number>();
    for (const tx of transactions) {
      buyerCounts.set(tx.buyerAddress, (buyerCounts.get(tx.buyerAddress) || 0) + 1);
    }
    const repeatBuyers = Array.from(buyerCounts.values()).filter(count => count > 1).length;
    return buyerCounts.size > 0 ? (repeatBuyers / buyerCounts.size) * 100 : 0;
  }
}
```

### File: `src/lib/data/x402/solana.ts`

```typescript
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import type { X402AgentMetrics, X402Transaction, X402DataSource } from './types';
import { TOKENS } from './types';

/**
 * Fetches x402 data for agents on Solana chain
 */
export class SolanaX402Reader implements X402DataSource {
  private connection: Connection;
  private cdpApiKey?: string;
  private cdpApiSecret?: string;

  constructor(options: { rpcUrl: string; cdpApiKey?: string; cdpApiSecret?: string }) {
    this.connection = new Connection(options.rpcUrl, 'confirmed');
    this.cdpApiKey = options.cdpApiKey;
    this.cdpApiSecret = options.cdpApiSecret;
  }

  /**
   * Get aggregated metrics for an agent on Solana
   */
  async getAgentMetrics(address: string): Promise<X402AgentMetrics> {
    // Try CDP API first (similar to Base implementation)
    if (this.cdpApiKey) {
      try {
        return await this.getMetricsFromCDP(address);
      } catch (error) {
        console.warn('CDP API failed, falling back to on-chain:', error);
      }
    }

    // Fall back to on-chain parsing
    return await this.getMetricsFromChain(address);
  }

  /**
   * Get metrics from CDP Discovery API
   */
  private async getMetricsFromCDP(address: string): Promise<X402AgentMetrics> {
    // Similar implementation to Base - generate JWT and call CDP API
    // The endpoint and response format should be the same
    throw new Error('CDP API implementation needed');
  }

  /**
   * Get metrics by parsing on-chain transactions
   */
  private async getMetricsFromChain(address: string): Promise<X402AgentMetrics> {
    const pubkey = new PublicKey(address);
    
    // Get transaction signatures for this address
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit: 1000, // Adjust based on needs
    });

    const transactions: X402Transaction[] = [];
    const buyerSet = new Set<string>();
    let totalVolume = 0;
    let firstTx: Date | null = null;
    let lastTx: Date | null = null;

    // Fetch and parse transactions
    for (const sig of signatures) {
      try {
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) continue;

        const x402Tx = this.parseX402Transaction(tx, address);
        if (x402Tx) {
          transactions.push(x402Tx);
          buyerSet.add(x402Tx.buyerAddress);
          totalVolume += x402Tx.amountUsd;
          
          if (!firstTx || x402Tx.timestamp < firstTx) firstTx = x402Tx.timestamp;
          if (!lastTx || x402Tx.timestamp > lastTx) lastTx = x402Tx.timestamp;
        }
      } catch (error) {
        // Skip failed transactions
        console.warn(`Failed to parse transaction ${sig.signature}:`, error);
      }
    }

    // Calculate time-based metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const txLast7Days = transactions.filter(tx => tx.timestamp >= sevenDaysAgo);
    const txLast30Days = transactions.filter(tx => tx.timestamp >= thirtyDaysAgo);

    return {
      address,
      chain: 'solana',
      transactionCount: transactions.length,
      totalVolumeUsd: totalVolume,
      averageTransactionUsd: transactions.length > 0 ? totalVolume / transactions.length : 0,
      uniqueBuyers: buyerSet.size,
      repeatBuyerRate: this.calculateRepeatRate(transactions),
      firstTransactionAt: firstTx,
      lastTransactionAt: lastTx,
      daysSinceFirstTransaction: firstTx ? this.daysSince(firstTx) : 0,
      daysSinceLastTransaction: lastTx ? this.daysSince(lastTx) : 0,
      transactionsLast7Days: txLast7Days.length,
      transactionsLast30Days: txLast30Days.length,
      volumeLast7Days: txLast7Days.reduce((sum, tx) => sum + tx.amountUsd, 0),
      volumeLast30Days: txLast30Days.reduce((sum, tx) => sum + tx.amountUsd, 0),
    };
  }

  /**
   * Parse a Solana transaction to extract x402 payment info
   */
  private parseX402Transaction(
    tx: ParsedTransactionWithMeta,
    sellerAddress: string
  ): X402Transaction | null {
    if (!tx.meta || !tx.blockTime) return null;

    // Look for SPL Token transfers to the seller address
    // This is a simplified implementation - adjust based on actual x402 transaction structure
    
    const usdcMint = TOKENS.solana.USDC;
    
    // Check post token balances for incoming USDC
    const postBalances = tx.meta.postTokenBalances || [];
    const preBalances = tx.meta.preTokenBalances || [];
    
    for (const postBalance of postBalances) {
      if (postBalance.mint !== usdcMint) continue;
      if (postBalance.owner !== sellerAddress) continue;
      
      // Find matching pre-balance
      const preBalance = preBalances.find(
        pb => pb.accountIndex === postBalance.accountIndex
      );
      
      const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
      const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
      const transferAmount = postAmount - preAmount;
      
      if (transferAmount > 0) {
        // This is an incoming transfer to the seller
        // Try to identify the buyer from the transaction signers
        const buyer = tx.transaction.message.accountKeys[0]?.pubkey?.toString();
        
        return {
          txHash: tx.transaction.signatures[0],
          chain: 'solana',
          buyerAddress: buyer || 'unknown',
          sellerAddress,
          facilitatorAddress: '', // Would need to identify from instruction data
          amountRaw: String(transferAmount * 1e6), // Convert to micro-units
          amountUsd: transferAmount, // USDC is 1:1 with USD
          asset: usdcMint,
          assetSymbol: 'USDC',
          timestamp: new Date(tx.blockTime * 1000),
          blockNumber: tx.slot,
        };
      }
    }

    return null;
  }

  /**
   * Get recent transactions for an agent
   */
  async getRecentTransactions(address: string, limit: number = 50): Promise<X402Transaction[]> {
    const pubkey = new PublicKey(address);
    
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit,
    });

    const transactions: X402Transaction[] = [];

    for (const sig of signatures) {
      try {
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) continue;

        const x402Tx = this.parseX402Transaction(tx, address);
        if (x402Tx) {
          transactions.push(x402Tx);
        }
      } catch (error) {
        console.warn(`Failed to parse transaction ${sig.signature}:`, error);
      }
    }

    return transactions;
  }

  // Helper functions
  private daysSince(date: Date | null): number {
    if (!date) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateRepeatRate(transactions: X402Transaction[]): number {
    const buyerCounts = new Map<string, number>();
    for (const tx of transactions) {
      buyerCounts.set(tx.buyerAddress, (buyerCounts.get(tx.buyerAddress) || 0) + 1);
    }
    const repeatBuyers = Array.from(buyerCounts.values()).filter(count => count > 1).length;
    return buyerCounts.size > 0 ? (repeatBuyers / buyerCounts.size) * 100 : 0;
  }
}
```

### File: `src/lib/data/x402/index.ts`

```typescript
export * from './types';
export * from './base';
export * from './solana';

import { BaseX402Reader } from './base';
import { SolanaX402Reader } from './solana';
import type { X402AgentMetrics } from './types';

export interface X402Readers {
  base: BaseX402Reader;
  solana: SolanaX402Reader;
}

export function createX402Readers(options: {
  baseRpcUrl: string;
  solanaRpcUrl: string;
  cdpApiKey?: string;
  cdpApiSecret?: string;
}): X402Readers {
  return {
    base: new BaseX402Reader({
      rpcUrl: options.baseRpcUrl,
      cdpApiKey: options.cdpApiKey,
      cdpApiSecret: options.cdpApiSecret,
    }),
    solana: new SolanaX402Reader({
      rpcUrl: options.solanaRpcUrl,
      cdpApiKey: options.cdpApiKey,
      cdpApiSecret: options.cdpApiSecret,
    }),
  };
}

/**
 * Get combined x402 metrics for an agent across both chains
 */
export async function getCombinedX402Metrics(
  readers: X402Readers,
  wallets: { base?: string; solana?: string }
): Promise<{
  base: X402AgentMetrics | null;
  solana: X402AgentMetrics | null;
  combined: {
    totalTransactionCount: number;
    totalVolumeUsd: number;
    totalUniqueBuyers: number;
    chainsActive: string[];
    firstTransactionAt: Date | null;
    lastTransactionAt: Date | null;
  };
}> {
  const [baseMetrics, solanaMetrics] = await Promise.all([
    wallets.base ? readers.base.getAgentMetrics(wallets.base) : null,
    wallets.solana ? readers.solana.getAgentMetrics(wallets.solana) : null,
  ]);

  // Combine metrics
  const chainsActive: string[] = [];
  if (baseMetrics && baseMetrics.transactionCount > 0) chainsActive.push('base');
  if (solanaMetrics && solanaMetrics.transactionCount > 0) chainsActive.push('solana');

  const dates = [
    baseMetrics?.firstTransactionAt,
    solanaMetrics?.firstTransactionAt,
    baseMetrics?.lastTransactionAt,
    solanaMetrics?.lastTransactionAt,
  ].filter((d): d is Date => d !== null);

  const firstTx = dates.length > 0 
    ? new Date(Math.min(...dates.map(d => d.getTime()))) 
    : null;
  const lastTx = dates.length > 0 
    ? new Date(Math.max(...dates.map(d => d.getTime()))) 
    : null;

  return {
    base: baseMetrics,
    solana: solanaMetrics,
    combined: {
      totalTransactionCount: 
        (baseMetrics?.transactionCount || 0) + (solanaMetrics?.transactionCount || 0),
      totalVolumeUsd: 
        (baseMetrics?.totalVolumeUsd || 0) + (solanaMetrics?.totalVolumeUsd || 0),
      totalUniqueBuyers: 
        (baseMetrics?.uniqueBuyers || 0) + (solanaMetrics?.uniqueBuyers || 0),
      chainsActive,
      firstTransactionAt: firstTx,
      lastTransactionAt: lastTx,
    },
  };
}
```

## CDP API Authentication

The CDP API uses JWT authentication. Here's how to implement it properly:

### File: `src/lib/data/cdp-auth.ts`

```typescript
import * as jose from 'jose';

export async function generateCDPToken(
  apiKey: string,
  apiSecret: string,
  uri: string
): Promise<string> {
  // Parse the EC private key
  const privateKey = await jose.importPKCS8(apiSecret, 'ES256');

  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new jose.SignJWT({
    sub: apiKey,
    iss: 'cdp',
    aud: ['cdp_service'],
    uris: [uri],
  })
    .setProtectedHeader({
      alg: 'ES256',
      kid: apiKey,
      typ: 'JWT',
      nonce: crypto.randomUUID(),
    })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + 120) // 2 minutes
    .sign(privateKey);

  return jwt;
}
```

## Important Notes

1. **Rate Limiting:** Both on-chain queries and CDP API have rate limits. Implement caching and request throttling.

2. **Historical Data:** On-chain parsing can be slow for addresses with many transactions. Consider using an indexer for production.

3. **Transaction Identification:** Identifying x402 transactions specifically (vs general transfers) may require additional logic based on facilitator addresses or memo fields.

4. **Price Conversion:** For non-USDC tokens, you'll need price feeds to convert to USD.

5. **x402scan Integration:** If x402scan provides an API, it would be the most efficient data source. Contact the x402scan team to inquire about API access.

## Environment Variables

```env
# RPC Endpoints
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# CDP API (optional but recommended)
CDP_API_KEY=your_api_key
CDP_API_SECRET=-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----
```
