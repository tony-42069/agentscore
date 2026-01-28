import type { ScoreResult, ScoreBreakdown, ScoreGrade } from "@/lib/scoring/types";
import type { AgentRow } from "@/lib/db/queries";

/**
 * Create mock score result
 */
export function createMockScoreResult(overrides?: Partial<ScoreResult>): ScoreResult {
  const breakdown: ScoreBreakdown = {
    transactionHistory: { 
      score: 100, 
      maxScore: 150, 
      percentage: 66.7, 
      details: { totalVolumeUsd: 50000 } 
    },
    activityLevel: { 
      score: 75, 
      maxScore: 100, 
      percentage: 75, 
      details: { totalTransactionCount: 100 } 
    },
    buyerDiversity: { 
      score: 55, 
      maxScore: 75, 
      percentage: 73.3, 
      details: { totalUniqueBuyers: 25 } 
    },
    reputation: { 
      score: 85, 
      maxScore: 100, 
      percentage: 85, 
      details: { feedbackCount: 10, averageScore: 85 } 
    },
    validation: { 
      score: 50, 
      maxScore: 50, 
      percentage: 100, 
      details: { totalValidations: 2, passed: 2 } 
    },
    longevity: { 
      score: 40, 
      maxScore: 50, 
      percentage: 80, 
      details: { daysSinceFirst: 180 } 
    },
    crossChain: { 
      score: 0, 
      maxScore: 25, 
      percentage: 0, 
      details: { activeOnBase: true, activeOnSolana: false } 
    },
  };

  const totalScore = 300 +
    breakdown.transactionHistory.score +
    breakdown.activityLevel.score +
    breakdown.buyerDiversity.score +
    breakdown.reputation.score +
    breakdown.validation.score +
    breakdown.longevity.score +
    breakdown.crossChain.score;

  return {
    score: totalScore,
    grade: getGradeFromScore(totalScore),
    breakdown,
    reasonCodes: ["HIGH_VOLUME", "DIVERSE_BUYERS", "HIGH_REPUTATION"],
    calculatedAt: new Date(),
    ...overrides,
  };
}

function getGradeFromScore(score: number): ScoreGrade {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}

/**
 * Create mock database agent row
 */
export function createMockAgentRow(overrides?: Partial<AgentRow>): AgentRow {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    erc8004_agent_id: 1,
    base_wallet: "0x1234567890123456789012345678901234567890",
    solana_wallet: null,
    name: "Test Agent",
    description: "A test agent for development",
    image_url: "https://example.com/image.png",
    registration_uri: null,
    score: 742,
    score_breakdown: {},
    reason_codes: ["HIGH_VOLUME", "DIVERSE_BUYERS"],
    score_calculated_at: new Date().toISOString(),
    base_tx_count: 100,
    base_volume_usd: 50000,
    base_unique_buyers: 25,
    base_first_tx_at: new Date("2024-06-01").toISOString(),
    base_last_tx_at: new Date().toISOString(),
    solana_tx_count: 0,
    solana_volume_usd: 0,
    solana_unique_buyers: 0,
    solana_first_tx_at: null,
    solana_last_tx_at: null,
    reputation_count: 10,
    reputation_avg_score: 85,
    validation_count: 2,
    validation_passed: 2,
    validation_failed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
