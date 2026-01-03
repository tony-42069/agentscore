/**
 * Score Calculator
 *
 * Main entry point for calculating AgentScore credit scores.
 */

import type { AgentData, ScoreResult, ScoreBreakdown, ReasonCode, ScoreGrade } from "./types";
import {
  calculateTransactionHistoryScore,
  calculateActivityLevelScore,
  calculateBuyerDiversityScore,
  calculateReputationScore,
  calculateValidationScore,
  calculateLongevityScore,
  calculateCrossChainScore,
} from "./factors";

const BASE_SCORE = 300;

/**
 * Calculate the complete AgentScore for an agent
 */
export function calculateScore(agent: AgentData): ScoreResult {
  const reasonCodes: ReasonCode[] = [];

  // Calculate each factor
  const transactionHistory = calculateTransactionHistoryScore(agent, reasonCodes);
  const activityLevel = calculateActivityLevelScore(agent, reasonCodes);
  const buyerDiversity = calculateBuyerDiversityScore(agent, reasonCodes);
  const reputation = calculateReputationScore(agent, reasonCodes);
  const validation = calculateValidationScore(agent, reasonCodes);
  const longevity = calculateLongevityScore(agent, reasonCodes);
  const crossChain = calculateCrossChainScore(agent, reasonCodes);

  // Sum all factor scores
  const breakdown: ScoreBreakdown = {
    transactionHistory,
    activityLevel,
    buyerDiversity,
    reputation,
    validation,
    longevity,
    crossChain,
  };

  const totalEarnedPoints =
    transactionHistory.score +
    activityLevel.score +
    buyerDiversity.score +
    reputation.score +
    validation.score +
    longevity.score +
    crossChain.score;

  const finalScore = Math.min(850, Math.max(300, BASE_SCORE + totalEarnedPoints));

  return {
    score: Math.round(finalScore),
    grade: getGrade(finalScore),
    breakdown,
    reasonCodes,
    calculatedAt: new Date(),
  };
}

/**
 * Get letter grade from numeric score
 */
function getGrade(score: number): ScoreGrade {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}

/**
 * Validate agent data before scoring
 */
export function validateAgentData(agent: AgentData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Must have at least one wallet
  if (!agent.baseWallet && !agent.solanaWallet) {
    errors.push("Agent must have at least one wallet address");
  }

  // Numeric fields must be non-negative
  if (agent.baseTxCount < 0) errors.push("baseTxCount cannot be negative");
  if (agent.solanaTxCount < 0) errors.push("solanaTxCount cannot be negative");
  if (agent.baseVolumeUsd < 0) errors.push("baseVolumeUsd cannot be negative");
  if (agent.solanaVolumeUsd < 0) errors.push("solanaVolumeUsd cannot be negative");

  // Reputation score must be 0-100
  if (agent.reputationAvgScore < 0 || agent.reputationAvgScore > 100) {
    errors.push("reputationAvgScore must be between 0 and 100");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create empty agent data with default values
 */
export function createEmptyAgentData(): AgentData {
  return {
    erc8004AgentId: undefined,
    baseWallet: undefined,
    solanaWallet: undefined,
    name: undefined,
    baseTxCount: 0,
    baseVolumeUsd: 0,
    baseUniqueBuyers: 0,
    baseFirstTxAt: null,
    baseLastTxAt: null,
    solanaTxCount: 0,
    solanaVolumeUsd: 0,
    solanaUniqueBuyers: 0,
    solanaFirstTxAt: null,
    solanaLastTxAt: null,
    reputationCount: 0,
    reputationAvgScore: 0,
    validationCount: 0,
    validationPassed: 0,
    validationFailed: 0,
  };
}
