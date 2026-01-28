import { describe, it, expect } from "vitest";
import {
  calculateTransactionHistoryScore,
  calculateActivityLevelScore,
  calculateBuyerDiversityScore,
  calculateReputationScore,
  calculateValidationScore,
  calculateLongevityScore,
  calculateCrossChainScore,
} from "../factors";
import { createMockAgentData } from "@/test/utils";
import type { AgentData } from "../types";

describe("TransactionHistory", () => {
  it("returns 0 for zero volume", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 0, solanaVolumeUsd: 0 });
    const reasonCodes: any[] = [];
    const result = calculateTransactionHistoryScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("NO_TRANSACTION_HISTORY");
  });

  it("returns 10 for volume < $100", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 50, solanaVolumeUsd: 0 });
    const reasonCodes: any[] = [];
    const result = calculateTransactionHistoryScore(agent, reasonCodes);
    expect(result.score).toBe(10);
    expect(reasonCodes).toContain("LOW_VOLUME");
  });

  it("returns 30 for volume $100-$1K", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 500, solanaVolumeUsd: 0 });
    const reasonCodes: any[] = [];
    const result = calculateTransactionHistoryScore(agent, reasonCodes);
    expect(result.score).toBe(30);
  });

  it("returns 60 for volume $1K-$10K", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 5000, solanaVolumeUsd: 0 });
    const reasonCodes: any[] = [];
    const result = calculateTransactionHistoryScore(agent, reasonCodes);
    expect(result.score).toBe(60);
  });

  it("returns 100 for volume $10K-$100K", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 50000, solanaVolumeUsd: 0 });
    const reasonCodes: any[] = [];
    const result = calculateTransactionHistoryScore(agent, reasonCodes);
    expect(result.score).toBe(100);
    expect(reasonCodes).toContain("HIGH_VOLUME");
  });

  it("returns 150 for volume > $100K", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 150000, solanaVolumeUsd: 0 });
    const reasonCodes: any[] = [];
    const result = calculateTransactionHistoryScore(agent, reasonCodes);
    expect(result.score).toBe(150);
    expect(reasonCodes).toContain("EXCELLENT_HISTORY");
  });

  it("combines base and solana volumes", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 50000, solanaVolumeUsd: 60000 });
    const reasonCodes: any[] = [];
    const result = calculateTransactionHistoryScore(agent, reasonCodes);
    expect(result.score).toBe(150);
    expect(result.details.totalVolumeUsd).toBe(110000);
  });

  it("calculates correct percentage", () => {
    const agent = createMockAgentData({ baseVolumeUsd: 150000, solanaVolumeUsd: 0 });
    const result = calculateTransactionHistoryScore(agent, []);
    expect(result.percentage).toBe(100);
  });
});

describe("ActivityLevel", () => {
  it("returns 0 for zero transactions", () => {
    const agent = createMockAgentData({ baseTxCount: 0, solanaTxCount: 0 });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(0);
  });

  it("returns 10 for < 10 transactions", () => {
    const agent = createMockAgentData({ baseTxCount: 5, solanaTxCount: 0 });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(10);
    expect(reasonCodes).toContain("FEW_TRANSACTIONS");
  });

  it("returns 25 for 10-100 transactions", () => {
    const agent = createMockAgentData({ baseTxCount: 50, solanaTxCount: 0 });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(25);
  });

  it("returns 50 for 100-1K transactions", () => {
    const agent = createMockAgentData({ baseTxCount: 500, solanaTxCount: 0 });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(50);
  });

  it("returns 75 for 1K-10K transactions", () => {
    const agent = createMockAgentData({ baseTxCount: 5000, solanaTxCount: 0 });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(75);
    expect(reasonCodes).toContain("HIGH_ACTIVITY");
  });

  it("returns 100 for > 10K transactions", () => {
    const agent = createMockAgentData({ baseTxCount: 15000, solanaTxCount: 0 });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(100);
    expect(reasonCodes).toContain("HIGH_ACTIVITY");
  });

  it("applies inactivity penalty for no tx in last 30 days", () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseTxCount: 500,
      baseLastTxAt: sixtyDaysAgo,
      solanaLastTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(35); // 50 - 15 penalty
    expect(reasonCodes).toContain("INACTIVE_RECENTLY");
  });

  it("does not apply penalty if recent activity exists", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseTxCount: 500,
      baseLastTxAt: yesterday,
      solanaLastTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(50);
    expect(reasonCodes).not.toContain("INACTIVE_RECENTLY");
  });

  it("uses most recent transaction date for inactivity check", () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseTxCount: 500,
      solanaTxCount: 100,
      baseLastTxAt: sixtyDaysAgo,
      solanaLastTxAt: yesterday,
    });
    const reasonCodes: any[] = [];
    const result = calculateActivityLevelScore(agent, reasonCodes);
    expect(result.score).toBe(50);
    expect(reasonCodes).not.toContain("INACTIVE_RECENTLY");
  });
});

describe("BuyerDiversity", () => {
  it("returns 0 for zero buyers", () => {
    const agent = createMockAgentData({ baseUniqueBuyers: 0, solanaUniqueBuyers: 0 });
    const reasonCodes: any[] = [];
    const result = calculateBuyerDiversityScore(agent, reasonCodes);
    expect(result.score).toBe(0);
  });

  it("returns 15 for <= 5 buyers", () => {
    const agent = createMockAgentData({ baseUniqueBuyers: 5, solanaUniqueBuyers: 0 });
    const reasonCodes: any[] = [];
    const result = calculateBuyerDiversityScore(agent, reasonCodes);
    expect(result.score).toBe(15);
    expect(reasonCodes).toContain("FEW_BUYERS");
  });

  it("returns 35 for 6-20 buyers", () => {
    const agent = createMockAgentData({ baseUniqueBuyers: 15, solanaUniqueBuyers: 0 });
    const reasonCodes: any[] = [];
    const result = calculateBuyerDiversityScore(agent, reasonCodes);
    expect(result.score).toBe(35);
  });

  it("returns 55 for 21-100 buyers", () => {
    const agent = createMockAgentData({ baseUniqueBuyers: 50, solanaUniqueBuyers: 0 });
    const reasonCodes: any[] = [];
    const result = calculateBuyerDiversityScore(agent, reasonCodes);
    expect(result.score).toBe(55);
    expect(reasonCodes).toContain("DIVERSE_BUYERS");
  });

  it("returns 75 for > 100 buyers", () => {
    const agent = createMockAgentData({ baseUniqueBuyers: 150, solanaUniqueBuyers: 0 });
    const reasonCodes: any[] = [];
    const result = calculateBuyerDiversityScore(agent, reasonCodes);
    expect(result.score).toBe(75);
    expect(reasonCodes).toContain("DIVERSE_BUYERS");
  });

  it("combines base and solana buyers", () => {
    const agent = createMockAgentData({ baseUniqueBuyers: 60, solanaUniqueBuyers: 50 });
    const reasonCodes: any[] = [];
    const result = calculateBuyerDiversityScore(agent, reasonCodes);
    expect(result.score).toBe(75);
    expect(result.details.totalUniqueBuyers).toBe(110);
  });
});

describe("Reputation", () => {
  it("returns 0 for zero feedback count", () => {
    const agent = createMockAgentData({ reputationCount: 0, reputationAvgScore: 0 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("NO_REPUTATION_DATA");
  });

  it("returns 10 for avg score < 50", () => {
    const agent = createMockAgentData({ reputationCount: 5, reputationAvgScore: 40 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(10);
    expect(reasonCodes).toContain("LOW_REPUTATION");
  });

  it("returns 30 for avg score 50-69", () => {
    const agent = createMockAgentData({ reputationCount: 5, reputationAvgScore: 60 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(30);
    expect(reasonCodes).toContain("LOW_REPUTATION");
  });

  it("returns 50 for avg score 70-79", () => {
    const agent = createMockAgentData({ reputationCount: 5, reputationAvgScore: 75 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(50);
  });

  it("returns 75 for avg score 80-89", () => {
    const agent = createMockAgentData({ reputationCount: 5, reputationAvgScore: 85 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(75);
  });

  it("returns 100 for avg score >= 90", () => {
    const agent = createMockAgentData({ reputationCount: 5, reputationAvgScore: 95 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(100);
    expect(reasonCodes).toContain("HIGH_REPUTATION");
  });

  it("adds +5 bonus for 10+ feedback count", () => {
    const agent = createMockAgentData({ reputationCount: 10, reputationAvgScore: 70 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(55); // 50 + 5
  });

  it("adds +10 bonus for 50+ feedback count", () => {
    const agent = createMockAgentData({ reputationCount: 50, reputationAvgScore: 70 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(60); // 50 + 5 + 5
  });

  it("caps score at max 100 with bonuses", () => {
    const agent = createMockAgentData({ reputationCount: 50, reputationAvgScore: 95 });
    const reasonCodes: any[] = [];
    const result = calculateReputationScore(agent, reasonCodes);
    expect(result.score).toBe(100); // capped at 100
  });
});

describe("Validation", () => {
  it("returns 0 for zero validations", () => {
    const agent = createMockAgentData({
      validationCount: 0,
      validationPassed: 0,
      validationFailed: 0,
    });
    const reasonCodes: any[] = [];
    const result = calculateValidationScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("NO_VALIDATION");
  });

  it("returns 0 for failed validation", () => {
    const agent = createMockAgentData({
      validationCount: 1,
      validationPassed: 0,
      validationFailed: 1,
    });
    const reasonCodes: any[] = [];
    const result = calculateValidationScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("FAILED_VALIDATION");
  });

  it("returns 25 for 1 passed validation", () => {
    const agent = createMockAgentData({
      validationCount: 1,
      validationPassed: 1,
      validationFailed: 0,
    });
    const reasonCodes: any[] = [];
    const result = calculateValidationScore(agent, reasonCodes);
    expect(result.score).toBe(25);
    expect(reasonCodes).toContain("VALIDATED");
  });

  it("returns 50 for multiple passed validations", () => {
    const agent = createMockAgentData({
      validationCount: 3,
      validationPassed: 3,
      validationFailed: 0,
    });
    const reasonCodes: any[] = [];
    const result = calculateValidationScore(agent, reasonCodes);
    expect(result.score).toBe(50);
    expect(reasonCodes).toContain("VALIDATED");
  });

  it("returns 0 when any validation failed", () => {
    const agent = createMockAgentData({
      validationCount: 3,
      validationPassed: 2,
      validationFailed: 1,
    });
    const reasonCodes: any[] = [];
    const result = calculateValidationScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("FAILED_VALIDATION");
  });
});

describe("Longevity", () => {
  it("returns 0 for no transaction dates", () => {
    const agent = createMockAgentData({
      baseFirstTxAt: null,
      solanaFirstTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateLongevityScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(result.details.daysSinceFirst).toBe(0);
  });

  it("returns 0 for < 7 days", () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseFirstTxAt: fiveDaysAgo,
      solanaFirstTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateLongevityScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("NEW_AGENT");
  });

  it("returns 15 for 7-30 days", () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseFirstTxAt: fifteenDaysAgo,
      solanaFirstTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateLongevityScore(agent, reasonCodes);
    expect(result.score).toBe(15);
    expect(reasonCodes).toContain("NEW_AGENT");
  });

  it("returns 30 for 30-90 days", () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseFirstTxAt: sixtyDaysAgo,
      solanaFirstTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateLongevityScore(agent, reasonCodes);
    expect(result.score).toBe(30);
  });

  it("returns 40 for 90-180 days", () => {
    const hundredDaysAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseFirstTxAt: hundredDaysAgo,
      solanaFirstTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateLongevityScore(agent, reasonCodes);
    expect(result.score).toBe(40);
  });

  it("returns 50 for > 180 days", () => {
    const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseFirstTxAt: twoHundredDaysAgo,
      solanaFirstTxAt: null,
    });
    const reasonCodes: any[] = [];
    const result = calculateLongevityScore(agent, reasonCodes);
    expect(result.score).toBe(50);
    expect(reasonCodes).toContain("ESTABLISHED_AGENT");
  });

  it("uses earliest transaction date across chains", () => {
    const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      baseFirstTxAt: thirtyDaysAgo,
      solanaFirstTxAt: twoHundredDaysAgo,
    });
    const reasonCodes: any[] = [];
    const result = calculateLongevityScore(agent, reasonCodes);
    expect(result.score).toBe(50);
    expect(result.details.daysSinceFirst).toBeGreaterThanOrEqual(200);
  });
});

describe("CrossChain", () => {
  it("returns 0 when no chain activity", () => {
    const agent = createMockAgentData({
      baseTxCount: 0,
      solanaTxCount: 0,
    });
    const reasonCodes: any[] = [];
    const result = calculateCrossChainScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).not.toContain("MULTI_CHAIN");
    expect(reasonCodes).not.toContain("SINGLE_CHAIN");
  });

  it("returns 0 for single chain (Base only)", () => {
    const agent = createMockAgentData({
      baseTxCount: 100,
      solanaTxCount: 0,
    });
    const reasonCodes: any[] = [];
    const result = calculateCrossChainScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("SINGLE_CHAIN");
    expect(result.details.activeOnBase).toBe(true);
    expect(result.details.activeOnSolana).toBe(false);
  });

  it("returns 0 for single chain (Solana only)", () => {
    const agent = createMockAgentData({
      baseTxCount: 0,
      solanaTxCount: 100,
    });
    const reasonCodes: any[] = [];
    const result = calculateCrossChainScore(agent, reasonCodes);
    expect(result.score).toBe(0);
    expect(reasonCodes).toContain("SINGLE_CHAIN");
    expect(result.details.activeOnBase).toBe(false);
    expect(result.details.activeOnSolana).toBe(true);
  });

  it("returns 25 for both chains active", () => {
    const agent = createMockAgentData({
      baseTxCount: 100,
      solanaTxCount: 100,
    });
    const reasonCodes: any[] = [];
    const result = calculateCrossChainScore(agent, reasonCodes);
    expect(result.score).toBe(25);
    expect(reasonCodes).toContain("MULTI_CHAIN");
    expect(result.details.activeOnBase).toBe(true);
    expect(result.details.activeOnSolana).toBe(true);
    expect(result.details.chainsActive).toEqual(["base", "solana"]);
  });
});
