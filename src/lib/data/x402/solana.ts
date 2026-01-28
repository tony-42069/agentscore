import { Connection, PublicKey } from "@solana/web3.js";
import type {
  X402AgentMetrics,
  X402Transaction,
  X402DataSource,
} from "./types";
import { TOKENS, createEmptyMetrics } from "./types";

/**
 * Fetches x402 data for agents on Solana chain
 */
export class SolanaX402Reader implements X402DataSource {
  private connection: Connection;
  private cdpApiKey?: string;
  private cdpApiSecret?: string;

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
   * Get metrics by parsing on-chain transactions
   */
  private async getMetricsFromChain(address: string): Promise<X402AgentMetrics> {
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(address);
    } catch {
      return createEmptyMetrics(address, "solana");
    }

    // Get transaction signatures for this address
    let signatures;
    try {
      signatures = await this.connection.getSignaturesForAddress(pubkey, {
        limit: 1000,
      });
    } catch (error) {
      console.warn("Failed to get Solana signatures:", error);
      return createEmptyMetrics(address, "solana");
    }

    const transactions: X402Transaction[] = [];
    const buyerCounts = new Map<string, number>();
    let totalVolume = 0;
    let firstTx: Date | null = null;
    let lastTx: Date | null = null;

    // Process each transaction
    for (const sig of signatures.slice(0, 100)) {
      // Limit to avoid rate limits
      try {
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta || !tx.blockTime) continue;

        const x402Tx = this.parseX402Transaction(tx, address, sig.signature);
        if (x402Tx) {
          transactions.push(x402Tx);
          buyerCounts.set(
            x402Tx.buyerAddress,
            (buyerCounts.get(x402Tx.buyerAddress) || 0) + 1
          );
          totalVolume += x402Tx.amountUsd;

          if (!firstTx || x402Tx.timestamp < firstTx)
            firstTx = x402Tx.timestamp;
          if (!lastTx || x402Tx.timestamp > lastTx) lastTx = x402Tx.timestamp;
        }
      } catch {
        // Skip failed transactions
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
   * Parse a Solana transaction to extract x402 payment info
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
        // This is an incoming transfer to the seller
        const buyer =
          tx.transaction.message.accountKeys?.[0]?.pubkey?.toString() ||
          "unknown";

        return {
          txHash: signature,
          chain: "solana",
          buyerAddress: buyer,
          sellerAddress,
          facilitatorAddress: "",
          amountRaw: String(transferAmount * 1e6),
          amountUsd: transferAmount, // USDC is 1:1 with USD
          asset: usdcMint,
          assetSymbol: "USDC",
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
  async getRecentTransactions(
    address: string,
    limit: number = 50
  ): Promise<X402Transaction[]> {
    // Would implement similar to getMetricsFromChain
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
