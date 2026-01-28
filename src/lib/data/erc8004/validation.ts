import { type PublicClient } from "viem";
import { VALIDATION_REGISTRY_ABI } from "./abis";
import { getContractAddresses, type ERC8004Network } from "./client";

export interface ValidationStatus {
  requestHash: string;
  validatorAddress: string;
  agentId: number;
  response: number; // 0-100, where 0 = failed, 100 = passed
  responseHash: string; // Added: bytes32 response hash
  tag: string;          // Now returned as string (not bytes32)
  lastUpdate: Date;
}

export interface ValidationSummary {
  count: number;
  averageResponse: number;
}

export class ValidationRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor(client: PublicClient, network: ERC8004Network = "sepolia") {
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
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: "getSummary",
        args: [
          BigInt(agentId),
          validatorAddresses as `0x${string}`[],
          tag, // Now string instead of bytes32
        ],
      });

      const [count, avgResponse] = result as readonly [bigint, number];

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
   * 
   * Updated for new ABI: returns (validatorAddress, agentId, response, responseHash, tag, lastUpdate)
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

      // New format: [validatorAddress, agentId, response, responseHash, tag, lastUpdate]
      const [validatorAddress, agentId, response, responseHash, tag, lastUpdate] =
        result as readonly [`0x${string}`, bigint, number, `0x${string}`, string, bigint];

      return {
        requestHash,
        validatorAddress,
        agentId: Number(agentId),
        response,
        responseHash,
        tag: tag || "",
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

  /**
   * Get all validation requests for a specific validator
   */
  async getValidatorRequests(validatorAddress: string): Promise<string[]> {
    try {
      const hashes = await this.client.readContract({
        address: this.contractAddress,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: "getValidatorRequests",
        args: [validatorAddress as `0x${string}`],
      });
      return hashes as string[];
    } catch (error) {
      console.warn(
        `Failed to get validator requests for ${validatorAddress}:`,
        error
      );
      return [];
    }
  }
}
