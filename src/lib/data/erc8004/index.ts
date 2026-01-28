/**
 * ERC-8004 Integration Module
 *
 * Provides readers for the three ERC-8004 registries:
 * - Identity Registry: Agent NFT-based identity
 * - Reputation Registry: Client feedback
 * - Validation Registry: Third-party validations
 */

export * from "./abis";
export * from "./client";
export * from "./identity";
export * from "./reputation";
export * from "./validation";
export * from "./value-parser";
export * from "./indexer";

import { createERC8004Client, type ERC8004Network } from "./client";
import { IdentityRegistryReader } from "./identity";
import { ReputationRegistryReader } from "./reputation";
import { ValidationRegistryReader } from "./validation";

export interface ERC8004Readers {
  identity: IdentityRegistryReader;
  reputation: ReputationRegistryReader;
  validation: ValidationRegistryReader;
}

let readersCache: Record<string, ERC8004Readers> = {};

/**
 * Create all ERC-8004 readers for a network
 */
export function createERC8004Readers(
  network: ERC8004Network = "sepolia"
): ERC8004Readers {
  if (!readersCache[network]) {
    const client = createERC8004Client(network);

    readersCache[network] = {
      identity: new IdentityRegistryReader(client, network),
      reputation: new ReputationRegistryReader(client, network),
      validation: new ValidationRegistryReader(client, network),
    };
  }

  return readersCache[network];
}

/**
 * Get ERC-8004 data for an agent
 */
export async function getAgentERC8004Data(
  agentId: number,
  network: ERC8004Network = "sepolia"
) {
  const readers = createERC8004Readers(network);

  // Get identity data
  const registration = await readers.identity.getRegistrationData(agentId);
  const wallets = readers.identity.extractWallets(registration);

  // Get reputation data
  const reputation = await readers.reputation.getReputationForScoring(agentId);

  // Get validation data
  const validation = await readers.validation.getValidationForScoring(agentId);

  // Get detailed reputation metrics
  const reputationMetrics =
    await readers.reputation.getReputationMetrics(agentId);

  // Format the summary value for display
  const formattedReputation = ReputationRegistryReader.formatSummary({
    count: reputation.feedbackCount,
    summaryValue: reputation.summaryValue,
    summaryValueDecimals: reputation.summaryValueDecimals,
  });

  return {
    identity: {
      agentId,
      name: registration.registrationData?.name,
      description: registration.registrationData?.description,
      imageUrl: registration.registrationData?.image,
      owner: registration.owner,
      wallets,
    },
    reputation: {
      feedbackCount: reputation.feedbackCount,
      summaryValue: reputation.summaryValue,
      summaryValueDecimals: reputation.summaryValueDecimals,
      averageScore: formattedReputation.averageScore,
      metrics: reputationMetrics,
    },
    validation: {
      totalValidations: validation.totalValidations,
      passed: validation.passed,
      failed: validation.failed,
    },
  };
}
