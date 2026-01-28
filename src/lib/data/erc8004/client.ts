import { createPublicClient, http, type PublicClient } from "viem";
import { base, baseSepolia, sepolia } from "viem/chains";

// Contract addresses - Official ERC-8004 Deployment Addresses (January 2026 Testnet)
// Source: https://github.com/erc-8004/erc-8004-contracts
export const ERC8004_ADDRESSES = {
  // ETH Sepolia - DEPLOYED AND ACTIVE
  sepolia: {
    identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    validationRegistry: "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
  },
  // Base Sepolia - NOT YET DEPLOYED (as of January 2026)
  // Per README: "to be deployed"
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
  // Base Mainnet - NOT YET DEPLOYED
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
} as const;

export type ERC8004Network = "sepolia" | "base" | "baseSepolia";

// eslint-disable-next-line
let clientCache: Record<string, any> = {};

/**
 * Create viem client for ERC-8004 network
 */
export function createERC8004Client(
  network: ERC8004Network = "sepolia"
): PublicClient {
  const cacheKey = network;

  if (!clientCache[cacheKey]) {
    const chain =
      network === "sepolia"
        ? sepolia
        : network === "base"
          ? base
          : baseSepolia;

    let rpcUrl: string | undefined;
    if (network === "sepolia") {
      rpcUrl = process.env.SEPOLIA_RPC_URL;
    } else if (network === "base") {
      rpcUrl = process.env.BASE_RPC_URL;
    } else {
      rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
    }

    if (!rpcUrl) {
      console.warn(`${network} RPC URL not configured, using public RPC`);
    }

    clientCache[cacheKey] = createPublicClient({
      chain,
      transport: http(rpcUrl || undefined),
    });
  }

  return clientCache[cacheKey] as PublicClient;
}

/**
 * Get contract addresses for network
 */
export function getContractAddresses(network: ERC8004Network = "sepolia") {
  return ERC8004_ADDRESSES[network];
}

/**
 * Check if ERC-8004 contracts are configured for a network
 */
export function isERC8004Configured(network: ERC8004Network = "sepolia"): boolean {
  const addresses = getContractAddresses(network);
  return (
    addresses.identityRegistry !==
      "0x0000000000000000000000000000000000000000" &&
    addresses.reputationRegistry !==
      "0x0000000000000000000000000000000000000000" &&
    addresses.validationRegistry !==
      "0x0000000000000000000000000000000000000000"
  );
}

/**
 * Get the recommended network for ERC-8004 operations
 * Returns the first network with deployed contracts
 */
export function getRecommendedNetwork(): ERC8004Network {
  // Sepolia is the only deployed network as of January 2026
  return "sepolia";
}
