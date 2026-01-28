/**
 * Hybrid x402 Data Source
 *
 * Intelligently combines CDP API (fast, complete) with on-chain parsing (reliable fallback)
 * for x402 transaction data. Uses a tiered approach:
 *
 * 1. Try CDP API (fast, complete data)
 * 2. If CDP fails, fall back to on-chain parsing
 * 3. If on-chain fails, return cached data
 * 4. If no cache, return empty metrics
 */

import { CDPClient, createCDPClient } from "./cdp-client";
import { BaseX402Reader } from "./base";
import { SolanaX402Reader } from "./solana";
import type {
  X402AgentMetrics,
  X402Transaction,
  X402DataSource,
  X402Chain,
} from "./types";
import { createEmptyMetrics } from "./types";

export interface HybridReaderOptions {
  baseRpcUrl?: string;
  solanaRpcUrl?: string;
  cdpApiKey?: string;
  cdpApiSecret?: string;
}

export interface CombinedMetricsResult {
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
}

/**
 * Hybrid x402 reader that combines CDP API with on-chain parsing
 */
export class HybridX402Reader {
  private cdpClient: CDPClient | null;
  private baseReader: BaseX402Reader;
  private solanaReader: SolanaX402Reader;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(options: HybridReaderOptions = {}) {
    // Initialize CDP client if credentials available
    this.cdpClient = createCDPClient();

    // Initialize on-chain readers
    this.baseReader = new BaseX402Reader({
      rpcUrl: options.baseRpcUrl,
      cdpApiKey: options.cdpApiKey,
      cdpApiSecret: options.cdpApiSecret,
    });

    this.solanaReader = new SolanaX402Reader({
      rpcUrl: options.solanaRpcUrl,
      cdpApiKey: options.cdpApiKey,
      cdpApiSecret: options.cdpApiSecret,
    });
  }

  /**
   * Get agent metrics with hybrid approach:
   * 1. Try CDP API (fast, complete)
   * 2. If fails, try on-chain parsing
   * 3. If fails, return cached data
   * 4. If no cache, return empty metrics
   */
  async getAgentMetrics(
    address: string,
    chain: X402Chain
  ): Promise<X402AgentMetrics> {
    const cacheKey = `metrics:${chain}:${address.toLowerCase()}`;

    // Try cache first
    const cached = this.getFromCache<X402AgentMetrics>(cacheKey);
    if (cached) {
      console.log(`[Hybrid] Cache hit for ${address} on ${chain}`);
      return cached;
    }

    // Try CDP API first
    if (this.cdpClient) {
      try {
        console.log(`[Hybrid] Trying CDP API for ${address} on ${chain}`);
        const metrics = await this.getMetricsFromCDP(address, chain);
        this.setCache(cacheKey, metrics);
        return metrics;
      } catch (error) {
        console.warn(
          `[Hybrid] CDP API failed, falling back to on-chain:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Fall back to on-chain parsing
    try {
      console.log(`[Hybrid] Trying on-chain for ${address} on ${chain}`);
      const metrics = await this.getMetricsFromChain(address, chain);
      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error(
        `[Hybrid] On-chain failed, returning empty:`,
        error instanceof Error ? error.message : error
      );
    }

    // Return empty as last resort
    return createEmptyMetrics(address, chain);
  }

  /**
   * Get recent transactions with hybrid approach
   */
  async getRecentTransactions(
    address: string,
    chain: X402Chain,
    limit: number = 50
  ): Promise<X402Transaction[]> {
    const cacheKey = `txs:${chain}:${address.toLowerCase()}:${limit}`;

    // Try cache
    const cached = this.getFromCache<X402Transaction[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Try CDP API
    if (this.cdpClient) {
      try {
        const { transactions } = await this.cdpClient.getTransactions({
          address,
          chain,
          limit,
        });

        // Transform CDP format to our format
        const txs = this.transformCDPTransactions(transactions, chain);
        this.setCache(cacheKey, txs);
        return txs;
      } catch (error) {
        console.warn(
          `[Hybrid] CDP transactions failed, falling back:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Fall back to on-chain
    try {
      const reader =
        chain === "base" ? this.baseReader : this.solanaReader;
      const txs = await reader.getRecentTransactions(address, limit);
      this.setCache(cacheKey, txs);
      return txs;
    } catch (error) {
      console.error(
        `[Hybrid] On-chain transactions failed:`,
        error instanceof Error ? error.message : error
      );
      return [];
    }
  }

  /**
   * Get combined metrics for multiple wallets across chains
   */
  async getCombinedMetrics(wallets: {
    base?: string;
    solana?: string;
  }): Promise<CombinedMetricsResult> {
    const [baseMetrics, solanaMetrics] = await Promise.all([
      wallets.base
        ? this.getAgentMetrics(wallets.base, "base").catch(() => null)
        : Promise.resolve(null),
      wallets.solana
        ? this.getAgentMetrics(wallets.solana, "solana").catch(() => null)
        : Promise.resolve(null),
    ]);

    const chainsActive: string[] = [];
    if (baseMetrics && baseMetrics.transactionCount > 0)
      chainsActive.push("base");
    if (solanaMetrics && solanaMetrics.transactionCount > 0)
      chainsActive.push("solana");

    const dates = [
      baseMetrics?.firstTransactionAt,
      solanaMetrics?.firstTransactionAt,
      baseMetrics?.lastTransactionAt,
      solanaMetrics?.lastTransactionAt,
    ].filter((d): d is Date => d !== null && d !== undefined);

    return {
      base: baseMetrics,
      solana: solanaMetrics,
      combined: {
        totalTransactionCount:
          (baseMetrics?.transactionCount || 0) +
          (solanaMetrics?.transactionCount || 0),
        totalVolumeUsd:
          (baseMetrics?.totalVolumeUsd || 0) +
          (solanaMetrics?.totalVolumeUsd || 0),
        totalUniqueBuyers:
          (baseMetrics?.uniqueBuyers || 0) +
          (solanaMetrics?.uniqueBuyers || 0),
        chainsActive,
        firstTransactionAt:
          dates.length > 0
            ? new Date(Math.min(...dates.map((d) => d.getTime())))
            : null,
        lastTransactionAt:
          dates.length > 0
            ? new Date(Math.max(...dates.map((d) => d.getTime())))
            : null,
      },
    };
  }

  /**
   * Get metrics from CDP API
   */
  private async getMetricsFromCDP(
    address: string,
    chain: X402Chain
  ): Promise<X402AgentMetrics> {
    if (!this.cdpClient) {
      throw new Error("CDP client not available");
    }

    const metrics = await this.cdpClient.getMetrics({ address, chain });

    // Transform CDP format to X402AgentMetrics
    return {
      address,
      chain,
      transactionCount: metrics.transactionCount,
      totalVolumeUsd: metrics.totalVolume,
      averageTransactionUsd:
        metrics.transactionCount > 0
          ? metrics.totalVolume / metrics.transactionCount
          : 0,
      uniqueBuyers: metrics.uniqueBuyers,
      repeatBuyerRate: 0, // CDP may not provide this
      firstTransactionAt: metrics.firstTransaction
        ? new Date(metrics.firstTransaction)
        : null,
      lastTransactionAt: metrics.lastTransaction
        ? new Date(metrics.lastTransaction)
        : null,
      daysSinceFirstTransaction: metrics.firstTransaction
        ? this.daysSince(new Date(metrics.firstTransaction))
        : 0,
      daysSinceLastTransaction: metrics.lastTransaction
        ? this.daysSince(new Date(metrics.lastTransaction))
        : 0,
      transactionsLast7Days: metrics.transactionsLast7Days || 0,
      transactionsLast30Days: metrics.transactionsLast30Days || 0,
      volumeLast7Days: 0, // CDP may not provide this
      volumeLast30Days: 0, // CDP may not provide this
    };
  }

  /**
   * Get metrics from on-chain parsing
   */
  private async getMetricsFromChain(
    address: string,
    chain: X402Chain
  ): Promise<X402AgentMetrics> {
    const reader = chain === "base" ? this.baseReader : this.solanaReader;
    return reader.getAgentMetrics(address);
  }

  /**
   * Transform CDP transaction format to X402Transaction
   */
  private transformCDPTransactions(
    cdpTxs: Array<{
      hash: string;
      from: string;
      to: string;
      value: string;
      timestamp: string;
      blockNumber?: number;
      asset?: string;
      facilitator?: string;
    }>,
    chain: X402Chain
  ): X402Transaction[] {
    return cdpTxs.map((tx) => ({
      txHash: tx.hash,
      chain,
      buyerAddress: tx.from,
      sellerAddress: tx.to,
      facilitatorAddress: tx.facilitator || "",
      amountRaw: tx.value,
      amountUsd: parseFloat(tx.value) / 1e6, // Assuming USDC with 6 decimals
      asset: tx.asset || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
      assetSymbol: "USDC",
      timestamp: new Date(tx.timestamp),
      blockNumber: tx.blockNumber || 0,
    }));
  }

  /**
   * Get from cache
   */
  getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache
   */
  setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  private daysSince(date: Date): number {
    return Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
  }
}
