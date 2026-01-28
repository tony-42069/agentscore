import { type PublicClient } from "viem";
import { REPUTATION_REGISTRY_ABI } from "./abis";
import { getContractAddresses, type ERC8004Network } from "./client";
import {
  parseValue,
  parseFeedbackEntry,
  STANDARD_TAGS,
  type StandardTag,
} from "./value-parser";

/**
 * Reputation summary with value/valueDecimals format (ERC-8004 v2)
 *
 * To interpret the value:
 *   actualValue = summaryValue / (10 ^ summaryValueDecimals)
 *
 * Example: summaryValue=9977, summaryValueDecimals=2 → 99.77
 * Example: summaryValue=560, summaryValueDecimals=0 → 560
 */
export interface ReputationSummary {
  count: number;
  summaryValue: bigint; // Raw fixed-point value (int128)
  summaryValueDecimals: number; // Number of decimal places (0-18)
}

/**
 * Feedback entry with value/valueDecimals format (ERC-8004 v2)
 *
 * To interpret the value:
 *   actualValue = value / (10 ^ valueDecimals)
 */
export interface FeedbackEntry {
  clientAddress: string;
  value: bigint; // Raw fixed-point value (int128, can be negative)
  valueDecimals: number; // Number of decimal places (0-18)
  tag1: string; // Now returned as string (not bytes32)
  tag2: string; // Now returned as string (not bytes32)
  isRevoked: boolean;

  // Computed properties (added after fetching)
  humanReadableValue?: number;
  displayValue?: string;
  unit?: string;
}

export class ReputationRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;
  private network: ERC8004Network;

  constructor(client: PublicClient, network: ERC8004Network = "sepolia") {
    this.client = client;
    this.contractAddress = getContractAddresses(network).reputationRegistry;
    this.network = network;
  }

  /**
   * Get reputation summary for an agent
   *
   * Note: clientAddresses must be non-empty to prevent Sybil attacks
   */
  async getSummary(
    agentId: number,
    clientAddresses: string[] = [],
    tag1: string = "",
    tag2: string = ""
  ): Promise<ReputationSummary> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getSummary",
        args: [
          BigInt(agentId),
          clientAddresses as `0x${string}`[],
          tag1,
          tag2,
        ],
      });

      const [count, summaryValue, summaryValueDecimals] = result as readonly [
        bigint,
        bigint,
        number
      ];

      return {
        count: Number(count),
        summaryValue,
        summaryValueDecimals,
      };
    } catch (error) {
      console.warn(
        `Failed to get reputation summary for agent ${agentId}:`,
        error
      );
      return { count: 0, summaryValue: 0n, summaryValueDecimals: 0 };
    }
  }

  /**
   * Get all clients who have given feedback to an agent
   */
  async getClients(agentId: number): Promise<string[]> {
    try {
      const clients = await this.client.readContract({
        address: this.contractAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getClients",
        args: [BigInt(agentId)],
      });
      return clients as string[];
    } catch (error) {
      console.warn(`Failed to get clients for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Get all feedback for an agent with human-readable computed properties
   */
  async getAllFeedback(
    agentId: number,
    clientAddresses: string[] = [],
    includeRevoked: boolean = false
  ): Promise<FeedbackEntry[]> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "readAllFeedback",
        args: [
          BigInt(agentId),
          clientAddresses as `0x${string}`[],
          "", // tag1 - pass empty string for all
          "", // tag2 - pass empty string for all
          includeRevoked,
        ],
      });

      // New format: [clients, feedbackIndexes, values, valueDecimals, tag1s, tag2s, revokedStatuses]
      const [
        clients,
        _feedbackIndexes,
        values,
        valueDecimals,
        tag1s,
        tag2s,
        revokedStatuses,
      ] = result as readonly [
        `0x${string}`[],
        bigint[],
        bigint[],
        number[],
        string[],
        string[],
        boolean[]
      ];

      return clients.map((client, i) => {
        const entry: FeedbackEntry = {
          clientAddress: client,
          value: values[i],
          valueDecimals: valueDecimals[i],
          tag1: tag1s[i] || "",
          tag2: tag2s[i] || "",
          isRevoked: revokedStatuses[i],
        };

        // Add human-readable computed properties using value-parser
        const parsed = parseFeedbackEntry(entry);
        entry.humanReadableValue = parsed.humanReadableValue;
        entry.displayValue = parsed.displayValue;
        entry.unit = parsed.unit;

        return entry;
      });
    } catch (error) {
      console.warn(`Failed to get all feedback for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Read specific feedback entry
   */
  async readFeedback(
    agentId: number,
    clientAddress: string,
    feedbackIndex: number
  ): Promise<Omit<FeedbackEntry, "clientAddress"> | null> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "readFeedback",
        args: [
          BigInt(agentId),
          clientAddress as `0x${string}`,
          BigInt(feedbackIndex),
        ],
      });

      const [value, decimals, tag1, tag2, isRevoked] = result as readonly [
        bigint,
        number,
        string,
        string,
        boolean
      ];

      const entry = {
        value,
        valueDecimals: decimals,
        tag1,
        tag2,
        isRevoked,
      };

      // Add human-readable computed properties
      const parsed = parseFeedbackEntry(entry);

      return {
        ...entry,
        humanReadableValue: parsed.humanReadableValue,
        displayValue: parsed.displayValue,
        unit: parsed.unit,
      };
    } catch (error) {
      console.warn(`Failed to read feedback for agent ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Get the reputation data needed for scoring
   */
  async getReputationForScoring(agentId: number): Promise<{
    feedbackCount: number;
    summaryValue: bigint;
    summaryValueDecimals: number;
    feedback: FeedbackEntry[];
  }> {
    // Get all clients first
    const allClients = await this.getClients(agentId);

    const [summary, feedback] = await Promise.all([
      this.getSummary(agentId, allClients),
      this.getAllFeedback(agentId, allClients, false),
    ]);

    return {
      feedbackCount: summary.count,
      summaryValue: summary.summaryValue,
      summaryValueDecimals: summary.summaryValueDecimals,
      feedback,
    };
  }

  /**
   * Get reputation entries filtered by tag
   *
   * @param agentId - The agent ID
   * @param tag1 - The tag to filter by
   * @returns Aggregated reputation data for the tag
   */
  async getReputationByTag(
    agentId: number,
    tag1: string
  ): Promise<{
    averageValue: number;
    count: number;
    entries: FeedbackEntry[];
  }> {
    // Get all feedback
    const allFeedback = await this.getAllFeedback(agentId);

    // Filter by tag (case-insensitive)
    const filteredEntries = allFeedback.filter(
      (entry) => entry.tag1.toLowerCase() === tag1.toLowerCase() && !entry.isRevoked
    );

    if (filteredEntries.length === 0) {
      return {
        averageValue: 0,
        count: 0,
        entries: [],
      };
    }

    // Calculate average
    const sum = filteredEntries.reduce(
      (acc, entry) => acc + (entry.humanReadableValue ?? 0),
      0
    );
    const averageValue = sum / filteredEntries.length;

    return {
      averageValue,
      count: filteredEntries.length,
      entries: filteredEntries,
    };
  }

  /**
   * Get all reputation metrics for standard tags
   *
   * @param agentId - The agent ID
   * @returns Reputation metrics for all standard tags
   */
  async getReputationMetrics(agentId: number): Promise<{
    starred: { average: number; count: number };
    uptime: { average: number; count: number };
    successRate: { average: number; count: number };
    revenues: { total: number; count: number };
    tradingYield: { average: number; count: number };
    totalFeedbackCount: number;
  }> {
    // Fetch all tag metrics in parallel
    const [
      starred,
      uptime,
      successRate,
      revenues,
      tradingYield,
      totalFeedback,
    ] = await Promise.all([
      this.getReputationByTag(agentId, STANDARD_TAGS.STARRED),
      this.getReputationByTag(agentId, STANDARD_TAGS.UPTIME),
      this.getReputationByTag(agentId, STANDARD_TAGS.SUCCESS_RATE),
      this.getReputationByTag(agentId, STANDARD_TAGS.REVENUES),
      this.getReputationByTag(agentId, STANDARD_TAGS.TRADING_YIELD),
      this.getAllFeedback(agentId),
    ]);

    // Calculate total revenue (sum, not average)
    const totalRevenue = revenues.entries.reduce(
      (acc, entry) => acc + (entry.humanReadableValue ?? 0),
      0
    );

    return {
      starred: {
        average: starred.averageValue,
        count: starred.count,
      },
      uptime: {
        average: uptime.averageValue,
        count: uptime.count,
      },
      successRate: {
        average: successRate.averageValue,
        count: successRate.count,
      },
      revenues: {
        total: totalRevenue,
        count: revenues.count,
      },
      tradingYield: {
        average: tradingYield.averageValue,
        count: tradingYield.count,
      },
      totalFeedbackCount: totalFeedback.filter((f) => !f.isRevoked).length,
    };
  }

  /**
   * Helper to convert value/valueDecimals to a decimal number
   *
   * Example: value=9977n, decimals=2 → 99.77
   * Example: value=-500n, decimals=2 → -5.00
   */
  static formatValue(value: bigint, decimals: number): number {
    const divisor = 10 ** decimals;
    return Number(value) / divisor;
  }

  /**
   * Helper to format a summary into a readable percentage/score
   *
   * This interprets the fixed-point value as a percentage.
   * For example, if value=9977 with 2 decimals, returns 99.77 (representing 99.77%)
   */
  static formatSummary(summary: ReputationSummary): {
    count: number;
    averageScore: number; // As a percentage (0-100 typically)
  } {
    return {
      count: summary.count,
      averageScore: ReputationRegistryReader.formatValue(
        summary.summaryValue,
        summary.summaryValueDecimals
      ),
    };
  }
}

// Export helper functions for tag-based operations
export { getReputationByTag, getReputationMetrics };

/**
 * Get reputation entries filtered by tag (standalone function)
 */
async function getReputationByTag(
  client: PublicClient,
  agentId: number,
  tag1: string,
  network: ERC8004Network = "sepolia"
): Promise<{
  averageValue: number;
  count: number;
  entries: FeedbackEntry[];
}> {
  const reader = new ReputationRegistryReader(client, network);
  return reader.getReputationByTag(agentId, tag1);
}

/**
 * Get all reputation metrics for standard tags (standalone function)
 */
async function getReputationMetrics(
  client: PublicClient,
  agentId: number,
  network: ERC8004Network = "sepolia"
): Promise<{
  starred: { average: number; count: number };
  uptime: { average: number; count: number };
  successRate: { average: number; count: number };
  revenues: { total: number; count: number };
  tradingYield: { average: number; count: number };
  totalFeedbackCount: number;
}> {
  const reader = new ReputationRegistryReader(client, network);
  return reader.getReputationMetrics(agentId);
}
