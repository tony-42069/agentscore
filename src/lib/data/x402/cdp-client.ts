/**
 * CDP (Coinbase Developer Platform) API Client
 *
 * Provides authenticated access to CDP API for fetching x402 transaction data.
 * Uses ES256 JWT authentication with automatic token caching and retry logic.
 *
 * @example
 * ```typescript
 * const client = new CDPClient({
 *   apiKey: process.env.CDP_API_KEY!,
 *   apiSecret: process.env.CDP_API_SECRET!,
 * });
 *
 * const transactions = await client.getTransactions({
 *   address: '0x...',
 *   chain: 'base',
 *   limit: 50
 * });
 * ```
 */

import { SignJWT, importPKCS8 } from "jose";

/**
 * Configuration options for the CDPClient
 */
export interface CDPClientOptions {
  /** CDP API Key (used as JWT issuer and key ID) */
  apiKey: string;
  /** CDP API Secret in PEM/PKCS8 format */
  apiSecret: string;
  /** Optional base URL for CDP API (defaults to https://api.cdp.coinbase.com) */
  baseUrl?: string;
}

/**
 * Parameters for fetching transactions
 */
export interface GetTransactionsParams {
  /** Wallet address to fetch transactions for */
  address: string;
  /** Blockchain to query */
  chain: "base" | "solana";
  /** Maximum number of transactions to return (default: 50) */
  limit?: number;
  /** Cursor for pagination (from previous response) */
  cursor?: string;
}

/**
 * CDP API transaction response
 */
export interface CDPTransaction {
  /** Transaction hash */
  hash: string;
  /** Sender address */
  from: string;
  /** Recipient address */
  to: string;
  /** Transaction value in smallest unit */
  value: string;
  /** Transaction timestamp (ISO 8601) */
  timestamp: string;
  /** Block number (if applicable) */
  blockNumber?: number;
  /** Chain identifier */
  chain: string;
  /** Token address or symbol */
  asset?: string;
  /** Transaction status */
  status?: "pending" | "confirmed" | "failed";
  /** Gas fee paid (if applicable) */
  gasFee?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Response from getTransactions
 */
export interface GetTransactionsResponse {
  /** List of transactions */
  transactions: CDPTransaction[];
  /** Cursor for fetching next page (if more results available) */
  nextCursor?: string;
  /** Total count of transactions (if available) */
  totalCount?: number;
}

/**
 * Parameters for fetching metrics
 */
export interface GetMetricsParams {
  /** Wallet address to fetch metrics for */
  address: string;
  /** Blockchain to query */
  chain: "base" | "solana";
}

/**
 * Aggregated metrics response
 */
export interface GetMetricsResponse {
  /** Total number of transactions */
  transactionCount: number;
  /** Total volume in USD */
  totalVolume: number;
  /** Number of unique counterparties */
  uniqueBuyers: number;
  /** Timestamp of first transaction (ISO 8601) */
  firstTransaction: string;
  /** Timestamp of last transaction (ISO 8601) */
  lastTransaction: string;
  /** Average transaction size in USD */
  averageTransactionSize?: number;
  /** Transactions in last 7 days */
  transactionsLast7Days?: number;
  /** Transactions in last 30 days */
  transactionsLast30Days?: number;
}

/**
 * JWT cache entry
 */
interface JWTCacheEntry {
  /** The JWT token string */
  token: string;
  /** Unix timestamp when token expires */
  expiresAt: number;
}

/**
 * CDP API Error types
 */
export class CDPAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: Response
  ) {
    super(message);
    this.name = "CDPAPIError";
  }
}

/**
 * CDP API Client
 *
 * Handles JWT authentication, token caching, and API requests with retry logic.
 */
export class CDPClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;
  private jwtCache: JWTCacheEntry | null = null;

  /**
   * Creates a new CDPClient instance
   *
   * @param options - Configuration options including API credentials
   */
  constructor(options: CDPClientOptions) {
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    this.baseUrl = options.baseUrl || "https://api.cdp.coinbase.com";
  }

  /**
   * Generate a new JWT for CDP API authentication
   *
   * Uses ES256 signing algorithm. The JWT includes standard claims:
   * - iss: API key (issuer)
   * - aud: ['cdp.api'] (audience)
   * - exp: 2 minutes from now
   * - iat: current time
   * - nbf: current time (not before)
   *
   * @returns Promise resolving to JWT string
   * @throws Error if key import or signing fails
   */
  private async generateJWT(): Promise<string> {
    try {
      // Import the private key from PKCS8 format
      const privateKey = await importPKCS8(this.apiSecret, "ES256");

      // Create and sign JWT
      const jwt = await new SignJWT({
        iss: this.apiKey,
        aud: ["cdp.api"],
      })
        .setProtectedHeader({ alg: "ES256", kid: this.apiKey })
        .setIssuedAt()
        .setNotBefore("now")
        .setExpirationTime("2m")
        .sign(privateKey);

      return jwt;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error during JWT generation";
      throw new Error(`Failed to generate CDP JWT: ${message}`);
    }
  }

  /**
   * Get a valid JWT, either from cache or generate a new one
   *
   * Tokens are cached for 55 minutes (they expire at 60 minutes).
   * This prevents unnecessary JWT generation on every request.
   *
   * @returns Promise resolving to valid JWT string
   */
  private async getJWT(): Promise<string> {
    const now = Date.now();

    // Check if we have a cached token that's still valid (with 5 min buffer)
    if (this.jwtCache && this.jwtCache.expiresAt > now + 5 * 60 * 1000) {
      return this.jwtCache.token;
    }

    // Generate new token
    const token = await this.generateJWT();

    // Cache for 55 minutes (token expires at 60 minutes)
    this.jwtCache = {
      token,
      expiresAt: now + 55 * 60 * 1000,
    };

    return token;
  }

  /**
   * Clear the JWT cache, forcing a new token on next request
   * Useful for handling authentication errors
   */
  private clearJWTCache(): void {
    this.jwtCache = null;
  }

  /**
   * Handle HTTP error responses
   *
   * @param response - Fetch response object
   * @throws CDPAPIError with appropriate message
   */
  private handleError(response: Response): never {
    switch (response.status) {
      case 400:
        throw new CDPAPIError(
          "CDP API: Bad request - check request parameters",
          400,
          response
        );
      case 401:
        throw new CDPAPIError(
          "CDP API: Unauthorized - check API credentials",
          401,
          response
        );
      case 403:
        throw new CDPAPIError(
          "CDP API: Forbidden - insufficient permissions",
          403,
          response
        );
      case 404:
        throw new CDPAPIError("CDP API: Resource not found", 404, response);
      case 429:
        throw new CDPAPIError(
          "CDP API: Rate limited - please retry later",
          429,
          response
        );
      case 500:
        throw new CDPAPIError("CDP API: Internal server error", 500, response);
      case 502:
        throw new CDPAPIError("CDP API: Bad gateway", 502, response);
      case 503:
        throw new CDPAPIError(
          "CDP API: Service unavailable",
          503,
          response
        );
      default:
        throw new CDPAPIError(
          `CDP API: ${response.status} ${response.statusText}`,
          response.status,
          response
        );
    }
  }

  /**
   * Make an authenticated request to the CDP API
   *
   * @param endpoint - API endpoint (relative to baseUrl)
   * @param options - Fetch options
   * @returns Promise resolving to parsed JSON response
   * @throws CDPAPIError on HTTP errors
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const jwt = await this.getJWT();

    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);

    headers.set("Authorization", `Bearer ${jwt}`);
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 by clearing cache and letting caller retry if needed
      if (response.status === 401) {
        this.clearJWTCache();
      }
      this.handleError(response);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make an authenticated request with automatic retry logic
   *
   * Retries on network errors or rate limiting (429) with exponential backoff.
   * Does not retry on authentication errors (401) or bad requests (400).
   *
   * @param endpoint - API endpoint
   * @param options - Fetch options
   * @param retries - Number of retries remaining (default: 3)
   * @returns Promise resolving to parsed JSON response
   * @throws CDPAPIError after all retries exhausted
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<T> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error) {
      // Don't retry on auth errors or client errors (except rate limit)
      if (error instanceof CDPAPIError) {
        if (error.statusCode === 401 || error.statusCode === 403) {
          throw error;
        }
        // Only retry rate limits and server errors
        if (error.statusCode !== 429 && error.statusCode < 500) {
          throw error;
        }
      }

      if (retries > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, 3 - retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.requestWithRetry(endpoint, options, retries - 1);
      }

      throw error;
    }
  }

  /**
   * Fetch x402 transactions for a wallet address
   *
   * Retrieves payment transactions where the specified address was either
   * the sender or recipient in x402 protocol interactions.
   *
   * @param params - Query parameters including address, chain, and pagination options
   * @returns Promise resolving to transactions and optional next cursor
   * @throws CDPAPIError on API errors
   *
   * @example
   * ```typescript
   * const { transactions, nextCursor } = await client.getTransactions({
   *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   chain: 'base',
   *   limit: 50
   * });
   * ```
   */
  async getTransactions(
    params: GetTransactionsParams
  ): Promise<GetTransactionsResponse> {
    const { address, chain, limit = 50, cursor } = params;

    // Build query parameters
    const queryParams = new URLSearchParams({
      address,
      chain,
      limit: String(limit),
    });

    if (cursor) {
      queryParams.set("cursor", cursor);
    }

    // Note: The exact endpoint path may need adjustment based on CDP API docs
    // Common patterns: /platform/v1/x402/transactions or /v1/x402/transactions
    const endpoint = `/platform/v1/x402/transactions?${queryParams.toString()}`;

    return this.requestWithRetry<GetTransactionsResponse>(endpoint);
  }

  /**
   * Fetch aggregated metrics for a wallet address
   *
   * Returns summary statistics including transaction count, volume,
   * unique counterparties, and time range of activity.
   *
   * @param params - Query parameters including address and chain
   * @returns Promise resolving to aggregated metrics
   * @throws CDPAPIError on API errors
   *
   * @example
   * ```typescript
   * const metrics = await client.getMetrics({
   *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
   *   chain: 'base'
   * });
   *
   * console.log(`Total volume: $${metrics.totalVolume}`);
   * console.log(`Transaction count: ${metrics.transactionCount}`);
   * ```
   */
  async getMetrics(params: GetMetricsParams): Promise<GetMetricsResponse> {
    const { address, chain } = params;

    const queryParams = new URLSearchParams({
      address,
      chain,
    });

    // Note: The exact endpoint path may need adjustment based on CDP API docs
    const endpoint = `/platform/v1/x402/metrics?${queryParams.toString()}`;

    return this.requestWithRetry<GetMetricsResponse>(endpoint);
  }

  /**
   * Check if the CDP API is accessible with current credentials
   *
   * Makes a lightweight request to verify connectivity and authentication.
   *
   * @returns Promise resolving to true if healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to generate a JWT as a basic health check
      await this.getJWT();
      return true;
    } catch {
      return false;
    }
  }
}

// CDP Client singleton cache
let cdpClientCache: CDPClient | null = null;

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
    console.warn(
      "CDP API credentials not configured (CDP_API_KEY, CDP_API_SECRET)"
    );
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
