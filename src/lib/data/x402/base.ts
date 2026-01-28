import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
import type {
  X402AgentMetrics,
  X402Transaction,
  X402DataSource,
} from "./types";
import { TOKENS, createEmptyMetrics } from "./types";

// Constants for chunked fetching
const BLOCK_CHUNK_SIZE = 10000n; // Fetch 10k blocks at a time
const MAX_BLOCKS_TO_SCAN = 1000000n; // ~6 months of blocks

/**
 * Fetches x402 data for agents on Base chain
 */
export class BaseX402Reader implements X402DataSource {
  private client;
  private cdpApiKey?: string;
  private cdpApiSecret?: string;
  private cachedTransactions: Map<string, X402Transaction[]> = new Map();

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
   * Get metrics with chunked block range fetching
   * This overcomes RPC limitations on block range
   */
  private async getMetricsFromChain(address: string): Promise<X402AgentMetrics> {
    try {
      return await this.getMetricsFromChainChunked(address);
    } catch (error) {
      console.error("[BaseX402Reader] Chunked fetching failed:", error);
      // Fall back to original method (limited range)
      return this.getMetricsFromChainLimited(address);
    }
  }

  /**
   * Get metrics with chunked block range fetching
   * This overcomes RPC limitations on block range
   */
  private async getMetricsFromChainChunked(address: string): Promise<X402AgentMetrics> {
    const usdcAddress = TOKENS.base.USDC;
    
    // Get current block
    const currentBlock = await this.client.getBlockNumber();
    
    // Calculate start block (max 6 months back)
    let fromBlock = currentBlock - MAX_BLOCKS_TO_SCAN;
    if (fromBlock < 0n) fromBlock = 0n;
    
    const toBlock = currentBlock;
    
    // Fetch logs in chunks
    const allLogs: any[] = [];
    
    for (
      let chunkStart = fromBlock;
      chunkStart <= toBlock;
      chunkStart += BLOCK_CHUNK_SIZE
    ) {
      const chunkEnd = chunkStart + BLOCK_CHUNK_SIZE < toBlock
        ? chunkStart + BLOCK_CHUNK_SIZE
        : toBlock;
      
      try {
        console.log(`[BaseX402Reader] Fetching blocks ${chunkStart} to ${chunkEnd}`);
        
        const logs = await this.client.getLogs({
          address: usdcAddress as `0x${string}`,
          event: parseAbiItem(
            'event Transfer(address indexed from, address indexed to, uint256 value)'
          ),
          args: {
            to: address as `0x${string}`,
          },
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        });
        
        allLogs.push(...logs);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`[BaseX402Reader] Failed to fetch chunk ${chunkStart}-${chunkEnd}:`, error);
        // Continue with next chunk
      }
    }
    
    console.log(`[BaseX402Reader] Total logs fetched: ${allLogs.length}`);
    
    // Process logs as before
    return this.processTransferLogs(allLogs, address);
  }

  /**
   * Original implementation with 30-day limit
   * Used as fallback when chunked fetching fails
   */
  private async getMetricsFromChainLimited(address: string): Promise<X402AgentMetrics> {
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

    return this.processTransferLogs(transferLogs, address);
  }

  /**
   * Separate log processing for reusability
   */
  private async processTransferLogs(
    logs: any[],
    address: string
  ): Promise<X402AgentMetrics> {
    const transactions: X402Transaction[] = [];
    const buyerCounts = new Map<string, number>();
    let totalVolume = 0;
    let firstTx: Date | null = null;
    let lastTx: Date | null = null;

    // Process logs in batches to avoid rate limiting
    const BATCH_SIZE = 10;
    for (let i = 0; i < logs.length; i += BATCH_SIZE) {
      const batch = logs.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (log) => {
          try {
            const block = await this.client.getBlock({
              blockNumber: log.blockNumber,
            });
            
            const timestamp = new Date(Number(block.timestamp) * 1000);
            const amount = Number(log.args.value) / 1e6;
            const buyer = log.args.from as string;

            buyerCounts.set(buyer, (buyerCounts.get(buyer) || 0) + 1);
            totalVolume += amount;

            if (!firstTx || timestamp < firstTx) firstTx = timestamp;
            if (!lastTx || timestamp > lastTx) lastTx = timestamp;

            // Try to identify if this is an x402 transaction
            const isX402 = await this.isX402Transaction(
              log.transactionHash,
              log.args.from as string,
              address
            );

            transactions.push({
              txHash: log.transactionHash,
              chain: "base",
              buyerAddress: buyer,
              sellerAddress: address,
              facilitatorAddress: isX402.facilitator || "",
              amountRaw: String(log.args.value),
              amountUsd: amount,
              asset: TOKENS.base.USDC,
              assetSymbol: "USDC",
              timestamp,
              blockNumber: Number(log.blockNumber),
              // Add x402 metadata
              paymentType: "incoming",
              x402Version: isX402.version,
            });
          } catch (error) {
            console.warn("[BaseX402Reader] Failed to process log:", error);
          }
        })
      );

      // Small delay between batches
      if (i + BATCH_SIZE < logs.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Cache transactions for getRecentTransactions
    this.cachedTransactions.set(address.toLowerCase(), transactions);

    return this.calculateMetrics(transactions, buyerCounts, totalVolume, firstTx, lastTx, address);
  }

  /**
   * Try to identify if a transaction is x402
   * This is best-effort without full protocol parsing
   */
  private async isX402Transaction(
    txHash: string,
    from: string,
    to: string
  ): Promise<{
    isX402: boolean;
    facilitator?: string;
    version?: "v1" | "v2";
  }> {
    try {
      const tx = await this.client.getTransaction({ hash: txHash as `0x${string}` });
      
      if (!tx) return { isX402: false };
      
      // Check if to address is a known facilitator
      // This is a heuristic - true x402 detection would parse calldata
      // For now, we can't reliably detect x402 without parsing protocol data
      // Return basic info indicating it's potentially x402
      return { isX402: true, version: "v1" };
    } catch (error) {
      return { isX402: false };
    }
  }

  /**
   * Calculate metrics from transaction data
   */
  private calculateMetrics(
    transactions: X402Transaction[],
    buyerCounts: Map<string, number>,
    totalVolume: number,
    firstTx: Date | null,
    lastTx: Date | null,
    address: string
  ): X402AgentMetrics {
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
   * Get recent transactions for an agent with pagination support
   */
  async getRecentTransactions(
    address: string,
    limit: number = 50,
    cursor?: string
  ): Promise<X402Transaction[]> {
    const cached = this.cachedTransactions.get(address.toLowerCase());
    
    if (cached && cached.length > 0) {
      // Use cached transactions
      let transactions = cached;
      
      // Apply cursor pagination if provided
      if (cursor) {
        const cursorIndex = transactions.findIndex(tx => tx.txHash === cursor);
        if (cursorIndex !== -1) {
          transactions = transactions.slice(cursorIndex + 1);
        }
      }
      
      return transactions.slice(0, limit);
    }

    // Fetch fresh transactions
    try {
      await this.getMetricsFromChain(address);
      const fresh = this.cachedTransactions.get(address.toLowerCase()) || [];
      
      let transactions = fresh;
      if (cursor) {
        const cursorIndex = transactions.findIndex(tx => tx.txHash === cursor);
        if (cursorIndex !== -1) {
          transactions = transactions.slice(cursorIndex + 1);
        }
      }
      
      return transactions.slice(0, limit);
    } catch (error) {
      console.warn("[BaseX402Reader] Failed to get recent transactions:", error);
      return [];
    }
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
