import { Connection, PublicKey } from "@solana/web3.js";
import type {
  X402AgentMetrics,
  X402Transaction,
  X402DataSource,
} from "./types";
import { TOKENS, createEmptyMetrics } from "./types";

// Increase transaction limit
const MAX_TRANSACTIONS = 1000; // Was 100

/**
 * Fetches x402 data for agents on Solana chain
 */
export class SolanaX402Reader implements X402DataSource {
  private connection: Connection;
  private cdpApiKey?: string;
  private cdpApiSecret?: string;
  private cachedTransactions: Map<string, X402Transaction[]> = new Map();

  constructor(options: {
    rpcUrl?: string;
    cdpApiKey?: string;
    cdpApiSecret?: string;
  }) {
    this.connection = new Connection(
      options.rpcUrl || "https://api.mainnet-beta.solana.com",
      "confirmed"
    );
    this.cdpApiKey = options.cdpApiKey;
    this.cdpApiSecret = options.cdpApiSecret;
  }

  /**
   * Get aggregated metrics for an agent on Solana
   */
  async getAgentMetrics(address: string): Promise<X402AgentMetrics> {
    try {
      return await this.getMetricsFromChain(address);
    } catch (error) {
      console.warn("Failed to get Solana x402 metrics:", error);
      return createEmptyMetrics(address, "solana");
    }
  }

  /**
   * Get metrics with pagination support
   */
  private async getMetricsFromChain(address: string): Promise<X402AgentMetrics> {
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(address);
    } catch {
      return createEmptyMetrics(address, "solana");
    }

    // Get signatures with higher limit
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit: MAX_TRANSACTIONS,
    });
    
    console.log(`[SolanaX402Reader] Fetched ${signatures.length} signatures`);

    const transactions: X402Transaction[] = [];
    const buyerCounts = new Map<string, number>();
    let totalVolume = 0;
    let firstTx: Date | null = null;
    let lastTx: Date | null = null;

    // Process in batches to avoid rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < signatures.length; i += BATCH_SIZE) {
      const batch = signatures.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (sig) => {
          try {
            const tx = await this.connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (!tx || !tx.meta || !tx.blockTime) return null;

            const x402Tx = this.parseX402Transaction(tx, address, sig.signature);
            return x402Tx;
          } catch (error) {
            console.warn(`[SolanaX402Reader] Failed to parse ${sig.signature}:`, error);
            return null;
          }
        })
      );

      // Process results
      for (const x402Tx of results) {
        if (x402Tx) {
          transactions.push(x402Tx);
          buyerCounts.set(
            x402Tx.buyerAddress,
            (buyerCounts.get(x402Tx.buyerAddress) || 0) + 1
          );
          totalVolume += x402Tx.amountUsd;

          if (!firstTx || x402Tx.timestamp < firstTx) firstTx = x402Tx.timestamp;
          if (!lastTx || x402Tx.timestamp > lastTx) lastTx = x402Tx.timestamp;
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < signatures.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Cache transactions for getRecentTransactions
    this.cachedTransactions.set(address.toLowerCase(), transactions);

    return this.calculateMetrics(transactions, buyerCounts, totalVolume, firstTx, lastTx, address);
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
      chain: "solana",
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
   * Enhanced Solana x402 parsing
   */
  private parseX402Transaction(
    tx: any,
    sellerAddress: string,
    signature: string
  ): X402Transaction | null {
    if (!tx.meta || !tx.blockTime) return null;

    const usdcMint = TOKENS.solana.USDC;

    // Check post token balances for incoming USDC
    const postBalances = tx.meta.postTokenBalances || [];
    const preBalances = tx.meta.preTokenBalances || [];

    for (const postBalance of postBalances) {
      if (postBalance.mint !== usdcMint) continue;
      if (postBalance.owner !== sellerAddress) continue;

      // Find matching pre-balance
      const preBalance = preBalances.find(
        (pb: any) => pb.accountIndex === postBalance.accountIndex
      );

      const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
      const postAmount = postBalance.uiTokenAmount?.uiAmount || 0;
      const transferAmount = postAmount - preAmount;

      if (transferAmount > 0) {
        // Try to identify buyer
        const accountKeys = tx.transaction.message.accountKeys;
        const buyer = accountKeys[0]?.pubkey?.toString() || "unknown";

        // Check for x402 program interactions
        const instructions = tx.transaction.message.instructions || [];
        const isX402 = instructions.some((ix: any) => {
          // Check if any instruction involves known x402 program
          // This is heuristic - would need program IDs for true detection
          return false;
        });

        return {
          txHash: signature,
          chain: "solana",
          buyerAddress: buyer,
          sellerAddress,
          facilitatorAddress: "", // Would need to identify from program
          amountRaw: String(transferAmount * 1e6),
          amountUsd: transferAmount,
          asset: usdcMint,
          assetSymbol: "USDC",
          timestamp: new Date(tx.blockTime * 1000),
          blockNumber: tx.slot,
          paymentType: "incoming",
          x402Version: isX402 ? "v1" : undefined,
        };
      }
    }

    return null;
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
      console.warn("[SolanaX402Reader] Failed to get recent transactions:", error);
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
