/**
 * x402 Protocol Integration Module
 *
 * Provides readers for x402 transaction data on both Base and Solana chains.
 */

export * from "./types";
export * from "./base";
export * from "./solana";

import { BaseX402Reader } from "./base";
import { SolanaX402Reader } from "./solana";
import type { X402AgentMetrics } from "./types";

export interface X402Readers {
  base: BaseX402Reader;
  solana: SolanaX402Reader;
}

let readersCache: X402Readers | null = null;

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
