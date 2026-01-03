import { type PublicClient } from "viem";
import { REPUTATION_REGISTRY_ABI } from "./abis";
import { getContractAddresses, type ERC8004Network } from "./client";

export interface ReputationSummary {
  count: number;
  averageScore: number;
}

export interface FeedbackEntry {
  clientAddress: string;
  score: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
}

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

export class ReputationRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor(client: PublicClient, network: ERC8004Network = "base") {
    this.client = client;
    this.contractAddress = getContractAddresses(network).reputationRegistry;
  }

  /**
   * Get reputation summary for an agent
   */
  async getSummary(
    agentId: number,
    clientAddresses: string[] = [],
    tag1: string = "",
    tag2: string = ""
  ): Promise<ReputationSummary> {
    try {
      const tag1Bytes = tag1 ? this.stringToBytes32(tag1) : ZERO_BYTES32;
      const tag2Bytes = tag2 ? this.stringToBytes32(tag2) : ZERO_BYTES32;

      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: "getSummary",
        args: [
          BigInt(agentId),
          clientAddresses as `0x${string}`[],
          tag1Bytes,
          tag2Bytes,
        ],
      });

      const [count, averageScore] = result as [bigint, number];

      return {
        count: Number(count),
        averageScore: averageScore,
      };
    } catch (error) {
      console.warn(`Failed to get reputation summary for agent ${agentId}:`, error);
      return { count: 0, averageScore: 0 };
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
   * Get all feedback for an agent
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
          ZERO_BYTES32,
          ZERO_BYTES32,
          includeRevoked,
        ],
      });

      const [clients, scores, tag1s, tag2s, revokedStatuses] = result as [
        string[],
        number[],
        string[],
        string[],
        boolean[]
      ];

      return clients.map((client, i) => ({
        clientAddress: client,
        score: scores[i],
        tag1: this.bytes32ToString(tag1s[i]),
        tag2: this.bytes32ToString(tag2s[i]),
        isRevoked: revokedStatuses[i],
      }));
    } catch (error) {
      console.warn(`Failed to get all feedback for agent ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Get the reputation data needed for scoring
   */
  async getReputationForScoring(agentId: number): Promise<{
    feedbackCount: number;
    averageScore: number;
    feedback: FeedbackEntry[];
  }> {
    const [summary, feedback] = await Promise.all([
      this.getSummary(agentId),
      this.getAllFeedback(agentId, [], false),
    ]);

    return {
      feedbackCount: summary.count,
      averageScore: summary.averageScore,
      feedback,
    };
  }

  // Helper functions
  private stringToBytes32(str: string): `0x${string}` {
    const hex = Buffer.from(str).toString("hex").padEnd(64, "0");
    return `0x${hex}` as `0x${string}`;
  }

  private bytes32ToString(bytes32: string): string {
    if (!bytes32 || bytes32 === ZERO_BYTES32) {
      return "";
    }
    const hex = bytes32.slice(2);
    const str = Buffer.from(hex, "hex").toString("utf8");
    return str.replace(/\0/g, "");
  }
}
