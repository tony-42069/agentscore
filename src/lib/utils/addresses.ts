/**
 * Address validation and chain detection utilities
 */

export type DetectedChain = "base" | "solana" | "unknown";

/**
 * Detect which chain an address belongs to based on format
 */
export function detectChain(address: string): DetectedChain {
  if (!address || typeof address !== "string") {
    return "unknown";
  }

  const trimmed = address.trim();

  // Base (EVM): starts with 0x, 42 chars, valid hex
  if (trimmed.startsWith("0x") && trimmed.length === 42) {
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return "base";
    }
  }

  // Solana: base58, 32-44 chars (no 0, O, I, l characters)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    return "solana";
  }

  return "unknown";
}

/**
 * Validate if an address is a valid Base (EVM) address
 */
export function isValidBaseAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/**
 * Validate if an address is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") {
    return false;
  }
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim());
}

/**
 * Validate if an address is valid for either chain
 */
export function isValidAddress(address: string): boolean {
  return isValidBaseAddress(address) || isValidSolanaAddress(address);
}

/**
 * Shorten an address for display (e.g., 0x1234...5678)
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";

  if (address.startsWith("0x")) {
    // EVM address
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  }

  // Solana address
  if (address.length > chars * 2 + 3) {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }

  return address;
}

/**
 * Normalize an address (lowercase for EVM, unchanged for Solana)
 */
export function normalizeAddress(address: string): string {
  if (!address) return "";

  const trimmed = address.trim();

  if (trimmed.startsWith("0x")) {
    return trimmed.toLowerCase();
  }

  return trimmed;
}

/**
 * Parse a CAIP-10 format address (e.g., "eip155:8453:0x...")
 */
export function parseCAIP10(caip10: string): {
  namespace: string;
  chainId: string;
  address: string;
} | null {
  const parts = caip10.split(":");

  if (parts.length === 3) {
    return {
      namespace: parts[0],
      chainId: parts[1],
      address: parts[2],
    };
  }

  if (parts.length === 2) {
    // Handle "solana:address" format
    return {
      namespace: parts[0],
      chainId: "",
      address: parts[1],
    };
  }

  return null;
}

/**
 * Format an address to CAIP-10 format
 */
export function toCAIP10(
  address: string,
  chain: "base" | "solana"
): string {
  if (chain === "base") {
    return `eip155:8453:${address}`;
  }
  return `solana:${address}`;
}
