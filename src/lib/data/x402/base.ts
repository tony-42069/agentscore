import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
import type {
  X402AgentMetrics,
  X402Transaction,
  X402DataSource,
} from "./types";
import { TOKENS, createEmptyMetrics } from "./types";

/**
 * Fetches x402 data for agents on Base chain
 */
export class BaseX402Reader implements X402DataSource {
  private client;
  private cdpApiKey?: string;
  private cdpApiSecret?: string;

  constructor(options: {
    rpcUrl?: string;
    cdpApiKey?: string;
    cdpApiSecret?: string;
  }) {
    this.client = createPublicClient({
      chain: base,
      transport: http(options.rpcUrl || undefined),
    });
    this.cdpApiKey = options.cdpApiKey;
    this.cdpApiSecret = options.cdpApiSecret;
  }

  /**
   * Get aggregated metrics for an agent on Base
   */
  async getAgentMetrics(address: string): Promise<X402AgentMetrics> {
    // Try on-chain parsing
    // In production, you'd want to use an indexer or CDP API
    try {
      return await this.getMetricsFromChain(address);
    } catch (error) {
      console.warn("Failed to get Base x402 metrics:", error);
      return createEmptyMetrics(address, "base");
    }
  }

  /**
   * Get metrics by parsing on-chain transfer events
   * Note: This is a simplified implementation - production should use indexer
   */
  private async getMetricsFromChain(address: string): Promise<X402AgentMetrics> {
    const usdcAddress = TOKENS.base.USDC;

    // Get current block
    const currentBlock = await this.client.getBlockNumber();

    // Look back ~30 days of blocks (Base has ~2 second blocks)
    // 30 days * 24 hours * 60 min * 30 blocks/min = ~1,296,000 blocks
    const fromBlock = currentBlock - BigInt(1_300_000);

    // Get transfer events to this address (payments received)
    let transferLogs;
    try {
      transferLogs = await this.client.getLogs({
        address: usdcAddress as `0x${string}`,
        event: parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 value)"
        ),
        args: {
          to: address as `0x${string}`,
        },
        fromBlock: fromBlock > BigInt(0) ? fromBlock : BigInt(0),
        toBlock: "latest",
      });
    } catch (error) {
      // RPC might not support large ranges - return empty
      console.warn("Failed to get transfer logs:", error);
      return createEmptyMetrics(address, "base");
    }

    // Process logs
    const transactions: X402Transaction[] = [];
    const buyerCounts = new Map<string, number>();
    let totalVolume = 0;
    let firstTx: Date | null = null;
    let lastTx: Date | null = null;

    for (const log of transferLogs) {
      try {
        const block = await this.client.getBlock({
          blockNumber: log.blockNumber,
        });
        const timestamp = new Date(Number(block.timestamp) * 1000);

        // USDC has 6 decimals
        const amount = Number(log.args.value) / 1e6;
        const buyer = log.args.from as string;

        buyerCounts.set(buyer, (buyerCounts.get(buyer) || 0) + 1);
        totalVolume += amount;

        if (!firstTx || timestamp < firstTx) firstTx = timestamp;
        if (!lastTx || timestamp > lastTx) lastTx = timestamp;

        transactions.push({
          txHash: log.transactionHash,
          chain: "base",
          buyerAddress: buyer,
          sellerAddress: address,
          facilitatorAddress: "",
          amountRaw: String(log.args.value),
          amountUsd: amount,
          asset: usdcAddress,
          assetSymbol: "USDC",
          timestamp,
          blockNumber: Number(log.blockNumber),
        });
      } catch {
        // Skip failed block fetches
        continue;
      }
    }

    // Calculate time-based metrics
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const txLast7Days = transactions.filter((tx) => tx.timestamp >= sevenDaysAgo);
    const txLast30Days = transactions.filter(
      (tx) => tx.timestamp >= thirtyDaysAgo
    );

    const repeatBuyers = Array.from(buyerCounts.values()).filter(
      (count) => count > 1
    ).length;

    return {
      address,
      chain: "base",
      transactionCount: transactions.length,
      totalVolumeUsd: totalVolume,
      averageTransactionUsd:
        transactions.length > 0 ? totalVolume / transactions.length : 0,
      uniqueBuyers: buyerCounts.size,
      repeatBuyerRate:
        buyerCounts.size > 0 ? (repeatBuyers / buyerCounts.size) * 100 : 0,
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
  async getRecentTransactions(
    address: string,
    limit: number = 50
  ): Promise<X402Transaction[]> {
    // Would implement similar to getMetricsFromChain
    // but just return the transactions list
    return [];
  }

  /**
   * Get metrics from CDP API if available
   * Called by HybridX402Reader - base implementation returns null
   */
  async getMetricsFromCDP(_address: string): Promise<null> {
    // CDP integration is handled by HybridX402Reader
    return null;
  }

  private daysSince(date: Date): number {
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}
