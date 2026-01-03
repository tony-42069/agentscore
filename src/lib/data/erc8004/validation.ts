import { type PublicClient } from "viem";
import { VALIDATION_REGISTRY_ABI } from "./abis";
import { getContractAddresses, type ERC8004Network } from "./client";

export interface ValidationStatus {
  requestHash: string;
  validatorAddress: string;
  agentId: number;
  response: number; // 0-100, where 0 = failed, 100 = passed
  tag: string;
  lastUpdate: Date;
}

export interface ValidationSummary {
  count: number;
  averageResponse: number;
}

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

export class ValidationRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor(client: PublicClient, network: ERC8004Network = "base") {
    this.client = client;
    this.contractAddress = getContractAddresses(network).validationRegistry;
  }

  /**
   * Get validation summary for an agent
   */
  async getSummary(
    agentId: number,
    validatorAddresses: string[] = [],
    tag: string = ""
  ): Promise<ValidationSummary> {
    try {
      const tagBytes = tag ? this.stringToBytes32(tag) : ZERO_BYTES32;

      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: "getSummary",
        args: [
          BigInt(agentId),
          validatorAddresses as `0x${string}`[],
          tagBytes,
        ],
      });

      const [count, avgResponse] = result as [bigint, number];

      return {
        count: Number(count),
        averageResponse: avgResponse,
      };
    } catch (error) {
      console.warn(
        `Failed to get validation summary for agent ${agentId}:`,
        error
      );
      return { count: 0, averageResponse: 0 };
    }
  }

  /**
   * Get all validation request hashes for an agent
   */
  async getAgentValidations(agentId: number): Promise<string[]> {
    try {
      const hashes = await this.client.readContract({
        address: this.contractAddress,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: "getAgentValidations",
        args: [BigInt(agentId)],
      });
      return hashes as string[];
    } catch (error) {
      console.warn(
        `Failed to get agent validations for agent ${agentId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get status of a specific validation
   */
  async getValidationStatus(
    requestHash: string
  ): Promise<ValidationStatus | null> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: "getValidationStatus",
        args: [requestHash as `0x${string}`],
      });

      const [validatorAddress, agentId, response, tag, lastUpdate] =
        result as [string, bigint, number, string, bigint];

      return {
        requestHash,
        validatorAddress,
        agentId: Number(agentId),
        response,
        tag: this.bytes32ToString(tag),
        lastUpdate: new Date(Number(lastUpdate) * 1000),
      };
    } catch (error) {
      console.warn(`Failed to get validation status for ${requestHash}:`, error);
      return null;
    }
  }

  /**
   * Get all validation details for an agent
   */
  async getAllValidations(agentId: number): Promise<ValidationStatus[]> {
    const hashes = await this.getAgentValidations(agentId);

    const validations = await Promise.all(
      hashes.map((hash) => this.getValidationStatus(hash))
    );

    return validations.filter((v): v is ValidationStatus => v !== null);
  }

  /**
   * Get validation data needed for scoring
   */
  async getValidationForScoring(agentId: number): Promise<{
    totalValidations: number;
    passed: number;
    failed: number;
    averageResponse: number;
    validations: ValidationStatus[];
  }> {
    const [summary, validations] = await Promise.all([
      this.getSummary(agentId),
      this.getAllValidations(agentId),
    ]);

    // Count passed (response >= 70) and failed (response < 70)
    const passed = validations.filter((v) => v.response >= 70).length;
    const failed = validations.filter((v) => v.response < 70).length;

    return {
      totalValidations: summary.count,
      passed,
      failed,
      averageResponse: summary.averageResponse,
      validations,
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
