import { createPublicClient, http, type PublicClient } from "viem";
import { base, baseSepolia } from "viem/chains";

// Contract addresses - THESE NEED TO BE REPLACED WITH REAL ADDRESSES
export const ERC8004_ADDRESSES = {
  base: {
    identityRegistry:
      (process.env.ERC8004_IDENTITY_REGISTRY as `0x${string}`) ||
      "0x0000000000000000000000000000000000000000",
    reputationRegistry:
      (process.env.ERC8004_REPUTATION_REGISTRY as `0x${string}`) ||
      "0x0000000000000000000000000000000000000000",
    validationRegistry:
      (process.env.ERC8004_VALIDATION_REGISTRY as `0x${string}`) ||
      "0x0000000000000000000000000000000000000000",
  },
  baseSepolia: {
    identityRegistry:
      (process.env.ERC8004_IDENTITY_REGISTRY as `0x${string}`) ||
      "0x0000000000000000000000000000000000000000",
    reputationRegistry:
      (process.env.ERC8004_REPUTATION_REGISTRY as `0x${string}`) ||
      "0x0000000000000000000000000000000000000000",
    validationRegistry:
      (process.env.ERC8004_VALIDATION_REGISTRY as `0x${string}`) ||
      "0x0000000000000000000000000000000000000000",
  },
} as const;

export type ERC8004Network = "base" | "baseSepolia";

// eslint-disable-next-line
let clientCache: Record<string, unknown> = {};

/**
 * Create viem client for Base
 */
export function createERC8004Client(
  network: ERC8004Network = "base"
): PublicClient {
  const cacheKey = network;

  if (!clientCache[cacheKey]) {
    const chain = network === "base" ? base : baseSepolia;
    const rpcUrl = process.env.BASE_RPC_URL;

    if (!rpcUrl) {
      console.warn("BASE_RPC_URL not configured, using public RPC");
    }

    clientCache[cacheKey] = createPublicClient({
      chain,
      transport: http(rpcUrl || undefined),
    });
  }

  return clientCache[cacheKey];
}

/**
 * Get contract addresses for network
 */
export function getContractAddresses(network: ERC8004Network = "base") {
  return ERC8004_ADDRESSES[network];
}

/**
 * Check if ERC-8004 contracts are configured
 */
export function isERC8004Configured(): boolean {
  const addresses = getContractAddresses();
  return (
    addresses.identityRegistry !==
      "0x0000000000000000000000000000000000000000" &&
    addresses.reputationRegistry !==
      "0x0000000000000000000000000000000000000000" &&
    addresses.validationRegistry !==
      "0x0000000000000000000000000000000000000000"
  );
}
