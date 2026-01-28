/**
 * x402 Protocol Integration Module
 *
 * Provides readers for x402 transaction data on both Base and Solana chains.
 */

export * from "./types";
export * from "./base";
export * from "./solana";
export * from "./cdp-client";

import { BaseX402Reader } from "./base";
import { SolanaX402Reader } from "./solana";
import { CDPClient } from "./cdp-client";
import type { X402AgentMetrics } from "./types";

export interface X402Readers {
  base: BaseX402Reader;
  solana: SolanaX402Reader;
}

let readersCache: X402Readers | null = null;
let cdpClientCache: CDPClient | null = null;

/**
 * Create x402 readers for both chains
 */
export function createX402Readers(options: {
  baseRpcUrl?: string;
  solanaRpcUrl?: string;
  cdpApiKey?: string;
  cdpApiSecret?: string;
}): X402Readers {
  if (!readersCache) {
    readersCache = {
      base: new BaseX402Reader({
        rpcUrl: options.baseRpcUrl || process.env.BASE_RPC_URL,
        cdpApiKey: options.cdpApiKey,
        cdpApiSecret: options.cdpApiSecret,
      }),
      solana: new SolanaX402Reader({
        rpcUrl: options.solanaRpcUrl || process.env.SOLANA_RPC_URL,
        cdpApiKey: options.cdpApiKey,
        cdpApiSecret: options.cdpApiSecret,
      }),
    };
  }

  return readersCache;
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
    wallets.base
      ? readers.base.getAgentMetrics(wallets.base).catch(() => null)
      : Promise.resolve(null),
    wallets.solana
      ? readers.solana.getAgentMetrics(wallets.solana).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Combine metrics
  const chainsActive: string[] = [];
  if (baseMetrics && baseMetrics.transactionCount > 0) chainsActive.push("base");
  if (solanaMetrics && solanaMetrics.transactionCount > 0)
    chainsActive.push("solana");

  const dates = [
    baseMetrics?.firstTransactionAt,
    solanaMetrics?.firstTransactionAt,
    baseMetrics?.lastTransactionAt,
    solanaMetrics?.lastTransactionAt,
  ].filter((d): d is Date => d !== null);

  const firstTx =
    dates.length > 0
      ? new Date(Math.min(...dates.map((d) => d.getTime())))
      : null;
  const lastTx =
    dates.length > 0
      ? new Date(Math.max(...dates.map((d) => d.getTime())))
      : null;

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
        (baseMetrics?.uniqueBuyers || 0) + (solanaMetrics?.uniqueBuyers || 0),
      chainsActive,
      firstTransactionAt: firstTx,
      lastTransactionAt: lastTx,
    },
  };
}

/**
 * Create or retrieve cached CDP API client
 *
 * Returns a cached instance if one exists, or creates a new one from
 * environment variables. Returns null if credentials are not configured.
 *
 * @returns CDPClient instance or null if credentials missing
 *
 * @example
 * ```typescript
 * const client = createCDPClient();
 * if (client) {
 *   const transactions = await client.getTransactions({
 *     address: '0x...',
 *     chain: 'base'
 *   });
 * }
 * ```
 */
export function createCDPClient(): CDPClient | null {
  if (cdpClientCache) {
    return cdpClientCache;
  }

  const apiKey = process.env.CDP_API_KEY;
  const apiSecret = process.env.CDP_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn("CDP API credentials not configured (CDP_API_KEY, CDP_API_SECRET)");
    return null;
  }

  cdpClientCache = new CDPClient({
    apiKey,
    apiSecret,
    baseUrl: process.env.CDP_BASE_URL,
  });

  return cdpClientCache;
}

/**
 * Reset the CDP client cache
 *
 * Useful for testing or when credentials change.
 */
export function resetCDPClientCache(): void {
  cdpClientCache = null;
}
