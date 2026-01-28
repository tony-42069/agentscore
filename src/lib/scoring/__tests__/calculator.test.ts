import { describe, it, expect } from "vitest";
import { calculateScore, validateAgentData, createEmptyAgentData } from "../calculator";
import { createMockAgentData } from "@/test/utils";

describe("calculateScore", () => {
  it("returns minimum score (300) for new agent with no activity", () => {
    const agent = createEmptyAgentData();
    const result = calculateScore(agent);
    expect(result.score).toBe(300);
  });

  it("returns maximum score (850) for perfect agent", () => {
    const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agent = createMockAgentData({
      // Transaction History: 150 (>$100K)
      baseVolumeUsd: 100000,
      solanaVolumeUsd: 10000,
      // Activity Level: 100 (>10K tx)
      baseTxCount: 15000,
      baseLastTxAt: yesterday,
      // Buyer Diversity: 75 (>100 buyers)
      baseUniqueBuyers: 150,
      solanaUniqueBuyers: 0,
      // Reputation: 100 (>=90 avg + bonuses)
      reputationCount: 50,
      reputationAvgScore: 95,
      // Validation: 50 (multiple passed)
      validationCount: 3,
      validationPassed: 3,
      validationFailed: 0,
      // Longevity: 50 (>180 days)
      baseFirstTxAt: twoHundredDaysAgo,
      solanaFirstTxAt: null,
      // Cross-Chain: 25 (both chains) - need solana tx
      solanaTxCount: 1,
    });
    const result = calculateScore(agent);
    expect(result.score).toBe(850);
  });

  it("returns Poor grade for score < 580", () => {
    const agent = createEmptyAgentData();
    const result = calculateScore(agent);
    expect(result.score).toBe(300);
    expect(result.grade).toBe("Poor");
  });

  it("returns Fair grade for score 580-669", () => {
    const thirtyDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Target: ~600-650 points (base 300 + 300-350 earned)
    // Current: 300 + 60 + 50 + 75 + 50 + 25 + 15 = 575 (need more)
    // Let's add cross-chain for +25: 600 total
    const agent = createMockAgentData({
      // Transaction History: 60 ($1K-$10K)
      baseVolumeUsd: 5000,
      // Activity Level: 50 (100-1K tx)
      baseTxCount: 500,
      baseLastTxAt: yesterday,
      // Buyer Diversity: 75 (>100 buyers)
      baseUniqueBuyers: 150,
      // Reputation: 50 (70-79 avg)
      reputationCount: 5,
      reputationAvgScore: 75,
      // Validation: 25 (1 passed)
      validationCount: 1,
      validationPassed: 1,
      validationFailed: 0,
      // Longevity: 15 (7-30 days)
      baseFirstTxAt: thirtyDaysAgo,
      // Cross-Chain: 25 (both chains)
      solanaTxCount: 1,
    });
    const result = calculateScore(agent);
    expect(result.score).toBeGreaterThanOrEqual(580);
    expect(result.score).toBeLessThan(670);
    expect(result.grade).toBe("Fair");
  });

  it("returns Good grade for score 670-739", () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Target: ~700-720 points (base 300 + 400-420 earned)
    const agent = createMockAgentData({
      // Transaction History: 100 ($10K-$100K)
      baseVolumeUsd: 50000,
      // Activity Level: 75 (1K-10K tx)
      baseTxCount: 5000,
      baseLastTxAt: yesterday,
      // Buyer Diversity: 55 (21-100 buyers)
      baseUniqueBuyers: 50,
      // Reputation: 75 (80-89 avg)
      reputationCount: 5,
      reputationAvgScore: 85,
      // Validation: 50 (multiple passed)
      validationCount: 2,
      validationPassed: 2,
      validationFailed: 0,
      // Longevity: 30 (30-90 days)
      baseFirstTxAt: sixtyDaysAgo,
    });
    const result = calculateScore(agent);
    expect(result.score).toBeGreaterThanOrEqual(670);
    expect(result.score).toBeLessThan(740);
    expect(result.grade).toBe("Good");
  });

  it("returns Very Good grade for score 740-799", () => {
    const hundredDaysAgo = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Target: ~760-780 points (base 300 + 460-480 earned)
    const agent = createMockAgentData({
      // Transaction History: 150 (>$100K)
      baseVolumeUsd: 150000,
      // Activity Level: 75 (1K-10K tx)
      baseTxCount: 5000,
      baseLastTxAt: yesterday,
      // Buyer Diversity: 75 (>100 buyers)
      baseUniqueBuyers: 150,
      // Reputation: 100 (>=90 avg + bonuses)
      reputationCount: 50,
      reputationAvgScore: 95,
      // Validation: 50 (multiple passed)
      validationCount: 2,
      validationPassed: 2,
      validationFailed: 0,
      // Longevity: 40 (90-180 days)
      baseFirstTxAt: hundredDaysAgo,
    });
    const result = calculateScore(agent);
    expect(result.score).toBeGreaterThanOrEqual(740);
    expect(result.score).toBeLessThan(800);
    expect(result.grade).toBe("Very Good");
  });

  it("returns Excellent grade for score >= 800", () => {
    const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Target: 800+ points
    const agent = createMockAgentData({
      // Transaction History: 150 (>$100K)
      baseVolumeUsd: 150000,
      // Activity Level: 75 (1K-10K tx)
      baseTxCount: 5000,
      baseLastTxAt: yesterday,
      // Buyer Diversity: 75 (>100 buyers)
      baseUniqueBuyers: 150,
      // Reputation: 100 (>=90 avg with bonuses)
      reputationCount: 50,
      reputationAvgScore: 95,
      // Validation: 50 (multiple passed)
      validationCount: 2,
      validationPassed: 2,
      validationFailed: 0,
      // Longevity: 50 (>180 days)
      baseFirstTxAt: twoHundredDaysAgo,
    });
    const result = calculateScore(agent);
    expect(result.score).toBeGreaterThanOrEqual(800);
    expect(result.grade).toBe("Excellent");
  });

  it("includes all 7 factors in breakdown", () => {
    const agent = createMockAgentData();
    const result = calculateScore(agent);
    expect(result.breakdown).toHaveProperty("transactionHistory");
    expect(result.breakdown).toHaveProperty("activityLevel");
    expect(result.breakdown).toHaveProperty("buyerDiversity");
    expect(result.breakdown).toHaveProperty("reputation");
    expect(result.breakdown).toHaveProperty("validation");
    expect(result.breakdown).toHaveProperty("longevity");
    expect(result.breakdown).toHaveProperty("crossChain");
  });

  it("each factor has correct maxScore", () => {
    const agent = createMockAgentData();
    const result = calculateScore(agent);
    expect(result.breakdown.transactionHistory.maxScore).toBe(150);
    expect(result.breakdown.activityLevel.maxScore).toBe(100);
    expect(result.breakdown.buyerDiversity.maxScore).toBe(75);
    expect(result.breakdown.reputation.maxScore).toBe(100);
    expect(result.breakdown.validation.maxScore).toBe(50);
    expect(result.breakdown.longevity.maxScore).toBe(50);
    expect(result.breakdown.crossChain.maxScore).toBe(25);
  });

  it("is deterministic (same input = same output)", () => {
    const agent = createMockAgentData();
    const result1 = calculateScore(agent);
    const result2 = calculateScore(agent);
    expect(result1.score).toBe(result2.score);
    expect(result1.grade).toBe(result2.grade);
    expect(result1.reasonCodes).toEqual(result2.reasonCodes);
  });

  it("returns calculatedAt timestamp", () => {
    const agent = createMockAgentData();
    const before = new Date();
    const result = calculateScore(agent);
    const after = new Date();
    expect(result.calculatedAt).toBeInstanceOf(Date);
    expect(result.calculatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.calculatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("includes reason codes", () => {
    const agent = createMockAgentData({
      baseVolumeUsd: 50000,
      baseTxCount: 5000,
      baseUniqueBuyers: 50,
      reputationCount: 5,
      reputationAvgScore: 85,
    });
    const result = calculateScore(agent);
    expect(result.reasonCodes.length).toBeGreaterThan(0);
  });
});

describe("validateAgentData", () => {
  it("returns valid for correct agent data", () => {
    const agent = createMockAgentData();
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("returns invalid when no wallet addresses", () => {
    const agent = createMockAgentData({
      baseWallet: undefined,
      solanaWallet: undefined,
    });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("Agent must have at least one wallet address");
  });

  it("returns invalid for negative baseTxCount", () => {
    const agent = createMockAgentData({ baseTxCount: -1 });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("baseTxCount cannot be negative");
  });

  it("returns invalid for negative solanaTxCount", () => {
    const agent = createMockAgentData({ solanaTxCount: -1 });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("solanaTxCount cannot be negative");
  });

  it("returns invalid for negative baseVolumeUsd", () => {
    const agent = createMockAgentData({ baseVolumeUsd: -100 });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("baseVolumeUsd cannot be negative");
  });

  it("returns invalid for negative solanaVolumeUsd", () => {
    const agent = createMockAgentData({ solanaVolumeUsd: -100 });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("solanaVolumeUsd cannot be negative");
  });

  it("returns invalid for reputationAvgScore < 0", () => {
    const agent = createMockAgentData({ reputationAvgScore: -10 });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("reputationAvgScore must be between 0 and 100");
  });

  it("returns invalid for reputationAvgScore > 100", () => {
    const agent = createMockAgentData({ reputationAvgScore: 101 });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain("reputationAvgScore must be between 0 and 100");
  });

  it("returns multiple errors for multiple invalid fields", () => {
    const agent = createMockAgentData({
      baseWallet: undefined,
      solanaWallet: undefined,
      baseTxCount: -1,
      baseVolumeUsd: -100,
      reputationAvgScore: 150,
    });
    const validation = validateAgentData(agent);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(1);
  });
});

describe("createEmptyAgentData", () => {
  it("returns agent with all zero/empty values", () => {
    const agent = createEmptyAgentData();
    expect(agent.baseTxCount).toBe(0);
    expect(agent.baseVolumeUsd).toBe(0);
    expect(agent.baseUniqueBuyers).toBe(0);
    expect(agent.solanaTxCount).toBe(0);
    expect(agent.solanaVolumeUsd).toBe(0);
    expect(agent.solanaUniqueBuyers).toBe(0);
    expect(agent.reputationCount).toBe(0);
    expect(agent.reputationAvgScore).toBe(0);
    expect(agent.validationCount).toBe(0);
    expect(agent.validationPassed).toBe(0);
    expect(agent.validationFailed).toBe(0);
    expect(agent.baseFirstTxAt).toBeNull();
    expect(agent.baseLastTxAt).toBeNull();
    expect(agent.solanaFirstTxAt).toBeNull();
    expect(agent.solanaLastTxAt).toBeNull();
  });

  it("returns agent with undefined identity fields", () => {
    const agent = createEmptyAgentData();
    expect(agent.erc8004AgentId).toBeUndefined();
    expect(agent.baseWallet).toBeUndefined();
    expect(agent.solanaWallet).toBeUndefined();
    expect(agent.name).toBeUndefined();
  });
});
