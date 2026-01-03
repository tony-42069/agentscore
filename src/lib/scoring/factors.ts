/**
 * Scoring Factors
 *
 * Each factor calculates a portion of the total score based on specific metrics.
 * Total possible points: 550 (300 base + 550 = 850 max)
 */

import type { AgentData, FactorScore, ReasonCode } from "./types";

/**
 * Factor 1: Transaction History (max 150 points)
 * Measures total USD volume across both chains
 */
export function calculateTransactionHistoryScore(
  agent: AgentData,
  reasonCodes: ReasonCode[]
): FactorScore {
  const MAX_SCORE = 150;
  const totalVolume = agent.baseVolumeUsd + agent.solanaVolumeUsd;

  let score = 0;

  if (totalVolume === 0) {
    reasonCodes.push("NO_TRANSACTION_HISTORY");
    score = 0;
  } else if (totalVolume < 100) {
    reasonCodes.push("LOW_VOLUME");
    score = 10;
  } else if (totalVolume < 1000) {
    score = 30;
  } else if (totalVolume < 10000) {
    score = 60;
  } else if (totalVolume < 100000) {
    score = 100;
    reasonCodes.push("HIGH_VOLUME");
  } else {
    score = 150;
    reasonCodes.push("EXCELLENT_HISTORY");
  }

  return {
    score,
    maxScore: MAX_SCORE,
    percentage: (score / MAX_SCORE) * 100,
    details: {
      totalVolumeUsd: totalVolume,
      baseVolumeUsd: agent.baseVolumeUsd,
      solanaVolumeUsd: agent.solanaVolumeUsd,
    },
  };
}

/**
 * Factor 2: Activity Level (max 100 points)
 * Measures transaction count and consistency
 */
export function calculateActivityLevelScore(
  agent: AgentData,
  reasonCodes: ReasonCode[]
): FactorScore {
  const MAX_SCORE = 100;
  const totalTxCount = agent.baseTxCount + agent.solanaTxCount;

  let score = 0;

  if (totalTxCount === 0) {
    score = 0;
  } else if (totalTxCount < 10) {
    reasonCodes.push("FEW_TRANSACTIONS");
    score = 10;
  } else if (totalTxCount < 100) {
    score = 25;
  } else if (totalTxCount < 1000) {
    score = 50;
  } else if (totalTxCount < 10000) {
    score = 75;
    reasonCodes.push("HIGH_ACTIVITY");
  } else {
    score = 100;
    reasonCodes.push("HIGH_ACTIVITY");
  }

  // Check for recent inactivity (penalty if no tx in last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const lastBaseTx = agent.baseLastTxAt;
  const lastSolanaTx = agent.solanaLastTxAt;
  const lastTxDate = [lastBaseTx, lastSolanaTx]
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (lastTxDate && lastTxDate < thirtyDaysAgo) {
    reasonCodes.push("INACTIVE_RECENTLY");
    score = Math.max(0, score - 15);
  }

  return {
    score,
    maxScore: MAX_SCORE,
    percentage: (score / MAX_SCORE) * 100,
    details: {
      totalTransactionCount: totalTxCount,
      baseTxCount: agent.baseTxCount,
      solanaTxCount: agent.solanaTxCount,
      lastTransactionAt: lastTxDate || null,
    },
  };
}

/**
 * Factor 3: Buyer Diversity (max 75 points)
 * Measures number of unique buyers
 */
export function calculateBuyerDiversityScore(
  agent: AgentData,
  reasonCodes: ReasonCode[]
): FactorScore {
  const MAX_SCORE = 75;
  const totalUniqueBuyers = agent.baseUniqueBuyers + agent.solanaUniqueBuyers;

  let score = 0;

  if (totalUniqueBuyers === 0) {
    score = 0;
  } else if (totalUniqueBuyers <= 5) {
    reasonCodes.push("FEW_BUYERS");
    score = 15;
  } else if (totalUniqueBuyers <= 20) {
    score = 35;
  } else if (totalUniqueBuyers <= 100) {
    score = 55;
    reasonCodes.push("DIVERSE_BUYERS");
  } else {
    score = 75;
    reasonCodes.push("DIVERSE_BUYERS");
  }

  return {
    score,
    maxScore: MAX_SCORE,
    percentage: (score / MAX_SCORE) * 100,
    details: {
      totalUniqueBuyers,
      baseUniqueBuyers: agent.baseUniqueBuyers,
      solanaUniqueBuyers: agent.solanaUniqueBuyers,
    },
  };
}

/**
 * Factor 4: Reputation (max 100 points)
 * Based on ERC-8004 Reputation Registry feedback
 */
export function calculateReputationScore(
  agent: AgentData,
  reasonCodes: ReasonCode[]
): FactorScore {
  const MAX_SCORE = 100;

  let score = 0;

  if (agent.reputationCount === 0) {
    reasonCodes.push("NO_REPUTATION_DATA");
    score = 0;
  } else {
    const avgScore = agent.reputationAvgScore;

    if (avgScore < 50) {
      reasonCodes.push("LOW_REPUTATION");
      score = 10;
    } else if (avgScore < 70) {
      reasonCodes.push("LOW_REPUTATION");
      score = 30;
    } else if (avgScore < 80) {
      score = 50;
    } else if (avgScore < 90) {
      score = 75;
    } else {
      score = 100;
      reasonCodes.push("HIGH_REPUTATION");
    }

    // Bonus for high feedback count
    if (agent.reputationCount >= 10) {
      score = Math.min(MAX_SCORE, score + 5);
    }
    if (agent.reputationCount >= 50) {
      score = Math.min(MAX_SCORE, score + 5);
    }
  }

  return {
    score,
    maxScore: MAX_SCORE,
    percentage: (score / MAX_SCORE) * 100,
    details: {
      feedbackCount: agent.reputationCount,
      averageScore: agent.reputationAvgScore,
    },
  };
}

/**
 * Factor 5: Validation (max 50 points)
 * Based on ERC-8004 Validation Registry results
 */
export function calculateValidationScore(
  agent: AgentData,
  reasonCodes: ReasonCode[]
): FactorScore {
  const MAX_SCORE = 50;

  let score = 0;

  if (agent.validationCount === 0) {
    reasonCodes.push("NO_VALIDATION");
    score = 0;
  } else if (agent.validationFailed > 0) {
    reasonCodes.push("FAILED_VALIDATION");
    score = 0;
  } else if (agent.validationPassed === 1) {
    score = 25;
    reasonCodes.push("VALIDATED");
  } else if (agent.validationPassed > 1) {
    score = 50;
    reasonCodes.push("VALIDATED");
  }

  return {
    score: Math.max(0, score),
    maxScore: MAX_SCORE,
    percentage: (Math.max(0, score) / MAX_SCORE) * 100,
    details: {
      totalValidations: agent.validationCount,
      passed: agent.validationPassed,
      failed: agent.validationFailed,
    },
  };
}

/**
 * Factor 6: Longevity (max 50 points)
 * Time since first recorded activity
 */
export function calculateLongevityScore(
  agent: AgentData,
  reasonCodes: ReasonCode[]
): FactorScore {
  const MAX_SCORE = 50;

  // Find earliest transaction date
  const firstDates = [agent.baseFirstTxAt, agent.solanaFirstTxAt].filter(
    (d): d is Date => d !== null
  );

  if (firstDates.length === 0) {
    return {
      score: 0,
      maxScore: MAX_SCORE,
      percentage: 0,
      details: { daysSinceFirst: 0, firstTransactionAt: null },
    };
  }

  const firstTx = new Date(Math.min(...firstDates.map((d) => d.getTime())));
  const now = new Date();
  const daysSinceFirst = Math.floor(
    (now.getTime() - firstTx.getTime()) / (1000 * 60 * 60 * 24)
  );

  let score = 0;

  if (daysSinceFirst < 7) {
    reasonCodes.push("NEW_AGENT");
    score = 0;
  } else if (daysSinceFirst < 30) {
    reasonCodes.push("NEW_AGENT");
    score = 15;
  } else if (daysSinceFirst < 90) {
    score = 30;
  } else if (daysSinceFirst < 180) {
    score = 40;
  } else {
    score = 50;
    reasonCodes.push("ESTABLISHED_AGENT");
  }

  return {
    score,
    maxScore: MAX_SCORE,
    percentage: (score / MAX_SCORE) * 100,
    details: {
      daysSinceFirst,
      firstTransactionAt: firstTx,
    },
  };
}

/**
 * Factor 7: Cross-Chain Presence (max 25 points)
 * Bonus for activity on multiple chains
 */
export function calculateCrossChainScore(
  agent: AgentData,
  reasonCodes: ReasonCode[]
): FactorScore {
  const MAX_SCORE = 25;

  const activeOnBase = agent.baseTxCount > 0;
  const activeOnSolana = agent.solanaTxCount > 0;

  let score = 0;

  if (activeOnBase && activeOnSolana) {
    score = 25;
    reasonCodes.push("MULTI_CHAIN");
  } else if (activeOnBase || activeOnSolana) {
    reasonCodes.push("SINGLE_CHAIN");
    score = 0;
  }

  return {
    score,
    maxScore: MAX_SCORE,
    percentage: (score / MAX_SCORE) * 100,
    details: {
      activeOnBase,
      activeOnSolana,
      chainsActive: [
        activeOnBase ? "base" : null,
        activeOnSolana ? "solana" : null,
      ].filter(Boolean),
    },
  };
}
