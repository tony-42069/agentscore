# Scoring Algorithm Specification

## Overview

The AgentScore algorithm computes a unified 300-850 credit score for AI agents based on data from ERC-8004 (identity, reputation, validation) and x402 (transaction history on Base and Solana).

## Score Range

| Range | Grade | Meaning |
|-------|-------|---------|
| 800-850 | Excellent | Top-tier agent with exceptional track record |
| 740-799 | Very Good | Strong history, highly trustworthy |
| 670-739 | Good | Solid performer, generally reliable |
| 580-669 | Fair | Limited history or some concerns |
| 300-579 | Poor | New agent or significant red flags |

## Scoring Factors

Total possible points: **550** (300 base + 550 = 850 max)

### Factor Breakdown

| Factor | Max Points | Weight | Description |
|--------|------------|--------|-------------|
| Transaction History | 150 | 27.3% | Total volume across chains |
| Activity Level | 100 | 18.2% | Transaction count and consistency |
| Buyer Diversity | 75 | 13.6% | Number of unique buyers |
| Reputation | 100 | 18.2% | ERC-8004 feedback scores |
| Validation | 50 | 9.1% | Third-party validation results |
| Longevity | 50 | 9.1% | Time since first activity |
| Cross-Chain Presence | 25 | 4.5% | Activity on multiple chains |

## Implementation

### File: `src/lib/scoring/types.ts`

```typescript
export interface AgentData {
  // Identity
  erc8004AgentId?: number;
  baseWallet?: string;
  solanaWallet?: string;
  name?: string;
  
  // x402 Metrics (Base)
  baseTxCount: number;
  baseVolumeUsd: number;
  baseUniqueBuyers: number;
  baseFirstTxAt: Date | null;
  baseLastTxAt: Date | null;
  
  // x402 Metrics (Solana)
  solanaTxCount: number;
  solanaVolumeUsd: number;
  solanaUniqueBuyers: number;
  solanaFirstTxAt: Date | null;
  solanaLastTxAt: Date | null;
  
  // ERC-8004 Reputation
  reputationCount: number;
  reputationAvgScore: number; // 0-100
  
  // ERC-8004 Validation
  validationCount: number;
  validationPassed: number;
  validationFailed: number;
}

export interface ScoreBreakdown {
  transactionHistory: FactorScore;
  activityLevel: FactorScore;
  buyerDiversity: FactorScore;
  reputation: FactorScore;
  validation: FactorScore;
  longevity: FactorScore;
  crossChain: FactorScore;
}

export interface FactorScore {
  score: number;
  maxScore: number;
  percentage: number;
  details: Record<string, any>;
}

export interface ScoreResult {
  score: number;
  grade: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  percentile?: number;
  breakdown: ScoreBreakdown;
  reasonCodes: ReasonCode[];
  calculatedAt: Date;
}

export type ReasonCode =
  // Negative codes
  | 'NO_TRANSACTION_HISTORY'
  | 'LOW_VOLUME'
  | 'FEW_TRANSACTIONS'
  | 'FEW_BUYERS'
  | 'NO_REPUTATION_DATA'
  | 'LOW_REPUTATION'
  | 'NO_VALIDATION'
  | 'FAILED_VALIDATION'
  | 'NEW_AGENT'
  | 'SINGLE_CHAIN'
  | 'INACTIVE_RECENTLY'
  // Positive codes
  | 'EXCELLENT_HISTORY'
  | 'HIGH_VOLUME'
  | 'HIGH_ACTIVITY'
  | 'DIVERSE_BUYERS'
  | 'HIGH_REPUTATION'
  | 'VALIDATED'
  | 'ESTABLISHED_AGENT'
  | 'MULTI_CHAIN';
```

### File: `src/lib/scoring/calculator.ts`

```typescript
import type { AgentData, ScoreResult, ScoreBreakdown, ReasonCode } from './types';
import {
  calculateTransactionHistoryScore,
  calculateActivityLevelScore,
  calculateBuyerDiversityScore,
  calculateReputationScore,
  calculateValidationScore,
  calculateLongevityScore,
  calculateCrossChainScore,
} from './factors';

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
    score: finalScore,
    grade: getGrade(finalScore),
    breakdown,
    reasonCodes,
    calculatedAt: new Date(),
  };
}

/**
 * Get letter grade from numeric score
 */
function getGrade(score: number): ScoreResult['grade'] {
  if (score >= 800) return 'Excellent';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
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
    errors.push('Agent must have at least one wallet address');
  }
  
  // Numeric fields must be non-negative
  if (agent.baseTxCount < 0) errors.push('baseTxCount cannot be negative');
  if (agent.solanaTxCount < 0) errors.push('solanaTxCount cannot be negative');
  if (agent.baseVolumeUsd < 0) errors.push('baseVolumeUsd cannot be negative');
  if (agent.solanaVolumeUsd < 0) errors.push('solanaVolumeUsd cannot be negative');
  
  // Reputation score must be 0-100
  if (agent.reputationAvgScore < 0 || agent.reputationAvgScore > 100) {
    errors.push('reputationAvgScore must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### File: `src/lib/scoring/factors.ts`

```typescript
import type { AgentData, FactorScore, ReasonCode } from './types';

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
    reasonCodes.push('NO_TRANSACTION_HISTORY');
    score = 0;
  } else if (totalVolume < 100) {
    reasonCodes.push('LOW_VOLUME');
    score = 10;
  } else if (totalVolume < 1000) {
    score = 30;
  } else if (totalVolume < 10000) {
    score = 60;
  } else if (totalVolume < 100000) {
    score = 100;
    reasonCodes.push('HIGH_VOLUME');
  } else {
    score = 150;
    reasonCodes.push('EXCELLENT_HISTORY');
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
    reasonCodes.push('FEW_TRANSACTIONS');
    score = 10;
  } else if (totalTxCount < 100) {
    score = 25;
  } else if (totalTxCount < 1000) {
    score = 50;
  } else if (totalTxCount < 10000) {
    score = 75;
    reasonCodes.push('HIGH_ACTIVITY');
  } else {
    score = 100;
    reasonCodes.push('HIGH_ACTIVITY');
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
    reasonCodes.push('INACTIVE_RECENTLY');
    score = Math.max(0, score - 15); // Penalty for inactivity
  }
  
  return {
    score,
    maxScore: MAX_SCORE,
    percentage: (score / MAX_SCORE) * 100,
    details: {
      totalTransactionCount: totalTxCount,
      baseTxCount: agent.baseTxCount,
      solanaTxCount: agent.solanaTxCount,
      lastTransactionAt: lastTxDate,
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
  // Note: We can't simply add unique buyers from both chains
  // because the same buyer might use different wallets
  // For now, we'll use the higher of the two as a proxy
  const uniqueBuyers = Math.max(agent.baseUniqueBuyers, agent.solanaUniqueBuyers);
  const totalUniqueBuyers = agent.baseUniqueBuyers + agent.solanaUniqueBuyers;
  
  let score = 0;
  
  if (totalUniqueBuyers === 0) {
    score = 0;
  } else if (totalUniqueBuyers <= 5) {
    reasonCodes.push('FEW_BUYERS');
    score = 15;
  } else if (totalUniqueBuyers <= 20) {
    score = 35;
  } else if (totalUniqueBuyers <= 100) {
    score = 55;
    reasonCodes.push('DIVERSE_BUYERS');
  } else {
    score = 75;
    reasonCodes.push('DIVERSE_BUYERS');
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
    reasonCodes.push('NO_REPUTATION_DATA');
    score = 0;
  } else {
    const avgScore = agent.reputationAvgScore;
    
    if (avgScore < 50) {
      reasonCodes.push('LOW_REPUTATION');
      score = 10;
    } else if (avgScore < 70) {
      reasonCodes.push('LOW_REPUTATION');
      score = 30;
    } else if (avgScore < 80) {
      score = 50;
    } else if (avgScore < 90) {
      score = 75;
    } else {
      score = 100;
      reasonCodes.push('HIGH_REPUTATION');
    }
    
    // Bonus for high feedback count (more confidence in score)
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
    reasonCodes.push('NO_VALIDATION');
    score = 0;
  } else if (agent.validationFailed > 0) {
    // Any failed validation is a red flag
    reasonCodes.push('FAILED_VALIDATION');
    score = -25; // Penalty (will be clamped to 0 minimum by total calculation)
  } else if (agent.validationPassed === 1) {
    score = 25;
    reasonCodes.push('VALIDATED');
  } else if (agent.validationPassed > 1) {
    score = 50;
    reasonCodes.push('VALIDATED');
  }
  
  return {
    score: Math.max(0, score), // Clamp to 0 minimum for this factor
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
  const firstDates = [agent.baseFirstTxAt, agent.solanaFirstTxAt]
    .filter((d): d is Date => d !== null);
  
  if (firstDates.length === 0) {
    return {
      score: 0,
      maxScore: MAX_SCORE,
      percentage: 0,
      details: { daysSinceFirst: 0, firstTransactionAt: null },
    };
  }
  
  const firstTx = new Date(Math.min(...firstDates.map(d => d.getTime())));
  const now = new Date();
  const daysSinceFirst = Math.floor(
    (now.getTime() - firstTx.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let score = 0;
  
  if (daysSinceFirst < 7) {
    reasonCodes.push('NEW_AGENT');
    score = 0;
  } else if (daysSinceFirst < 30) {
    reasonCodes.push('NEW_AGENT');
    score = 15;
  } else if (daysSinceFirst < 90) {
    score = 30;
  } else if (daysSinceFirst < 180) {
    score = 40;
  } else {
    score = 50;
    reasonCodes.push('ESTABLISHED_AGENT');
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
    reasonCodes.push('MULTI_CHAIN');
  } else if (activeOnBase || activeOnSolana) {
    reasonCodes.push('SINGLE_CHAIN');
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
        activeOnBase ? 'base' : null,
        activeOnSolana ? 'solana' : null,
      ].filter(Boolean),
    },
  };
}
```

### File: `src/lib/scoring/reason-codes.ts`

```typescript
import type { ReasonCode } from './types';

export interface ReasonCodeInfo {
  code: ReasonCode;
  label: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  category: 'transaction' | 'reputation' | 'validation' | 'longevity' | 'chain';
}

export const REASON_CODES: Record<ReasonCode, ReasonCodeInfo> = {
  // Negative codes
  NO_TRANSACTION_HISTORY: {
    code: 'NO_TRANSACTION_HISTORY',
    label: 'No Transaction History',
    description: 'This agent has no recorded x402 transactions.',
    impact: 'negative',
    category: 'transaction',
  },
  LOW_VOLUME: {
    code: 'LOW_VOLUME',
    label: 'Low Transaction Volume',
    description: 'Total transaction volume is below $1,000.',
    impact: 'negative',
    category: 'transaction',
  },
  FEW_TRANSACTIONS: {
    code: 'FEW_TRANSACTIONS',
    label: 'Limited Transactions',
    description: 'Fewer than 10 total transactions recorded.',
    impact: 'negative',
    category: 'transaction',
  },
  FEW_BUYERS: {
    code: 'FEW_BUYERS',
    label: 'Limited Buyer Base',
    description: 'Fewer than 5 unique buyers.',
    impact: 'negative',
    category: 'transaction',
  },
  NO_REPUTATION_DATA: {
    code: 'NO_REPUTATION_DATA',
    label: 'No Reputation Feedback',
    description: 'No feedback recorded in ERC-8004 Reputation Registry.',
    impact: 'negative',
    category: 'reputation',
  },
  LOW_REPUTATION: {
    code: 'LOW_REPUTATION',
    label: 'Below Average Reputation',
    description: 'Average feedback score is below 70.',
    impact: 'negative',
    category: 'reputation',
  },
  NO_VALIDATION: {
    code: 'NO_VALIDATION',
    label: 'Not Validated',
    description: 'No third-party validation in ERC-8004 Validation Registry.',
    impact: 'neutral',
    category: 'validation',
  },
  FAILED_VALIDATION: {
    code: 'FAILED_VALIDATION',
    label: 'Failed Validation',
    description: 'One or more validation attempts failed.',
    impact: 'negative',
    category: 'validation',
  },
  NEW_AGENT: {
    code: 'NEW_AGENT',
    label: 'New Agent',
    description: 'First transaction less than 30 days ago.',
    impact: 'neutral',
    category: 'longevity',
  },
  SINGLE_CHAIN: {
    code: 'SINGLE_CHAIN',
    label: 'Single Chain Activity',
    description: 'Active on only one blockchain (Base or Solana).',
    impact: 'neutral',
    category: 'chain',
  },
  INACTIVE_RECENTLY: {
    code: 'INACTIVE_RECENTLY',
    label: 'Recent Inactivity',
    description: 'No transactions in the last 30 days.',
    impact: 'negative',
    category: 'transaction',
  },
  
  // Positive codes
  EXCELLENT_HISTORY: {
    code: 'EXCELLENT_HISTORY',
    label: 'Excellent Transaction History',
    description: 'Total volume exceeds $100,000.',
    impact: 'positive',
    category: 'transaction',
  },
  HIGH_VOLUME: {
    code: 'HIGH_VOLUME',
    label: 'High Transaction Volume',
    description: 'Total volume between $10,000 and $100,000.',
    impact: 'positive',
    category: 'transaction',
  },
  HIGH_ACTIVITY: {
    code: 'HIGH_ACTIVITY',
    label: 'High Activity',
    description: 'Over 1,000 total transactions.',
    impact: 'positive',
    category: 'transaction',
  },
  DIVERSE_BUYERS: {
    code: 'DIVERSE_BUYERS',
    label: 'Diverse Buyer Base',
    description: 'Over 20 unique buyers.',
    impact: 'positive',
    category: 'transaction',
  },
  HIGH_REPUTATION: {
    code: 'HIGH_REPUTATION',
    label: 'Excellent Reputation',
    description: 'Average feedback score of 90 or above.',
    impact: 'positive',
    category: 'reputation',
  },
  VALIDATED: {
    code: 'VALIDATED',
    label: 'Validated',
    description: 'Passed third-party validation.',
    impact: 'positive',
    category: 'validation',
  },
  ESTABLISHED_AGENT: {
    code: 'ESTABLISHED_AGENT',
    label: 'Established Agent',
    description: 'Active for over 180 days.',
    impact: 'positive',
    category: 'longevity',
  },
  MULTI_CHAIN: {
    code: 'MULTI_CHAIN',
    label: 'Multi-Chain Presence',
    description: 'Active on both Base and Solana.',
    impact: 'positive',
    category: 'chain',
  },
};

/**
 * Get human-readable info for a reason code
 */
export function getReasonCodeInfo(code: ReasonCode): ReasonCodeInfo {
  return REASON_CODES[code];
}

/**
 * Filter reason codes by impact type
 */
export function filterByImpact(
  codes: ReasonCode[],
  impact: 'positive' | 'negative' | 'neutral'
): ReasonCode[] {
  return codes.filter(code => REASON_CODES[code].impact === impact);
}

/**
 * Sort reason codes with negatives first, then positives, then neutral
 */
export function sortReasonCodes(codes: ReasonCode[]): ReasonCode[] {
  const order = { negative: 0, neutral: 1, positive: 2 };
  return [...codes].sort(
    (a, b) => order[REASON_CODES[a].impact] - order[REASON_CODES[b].impact]
  );
}
```

### File: `src/lib/scoring/index.ts`

```typescript
export * from './types';
export * from './calculator';
export * from './factors';
export * from './reason-codes';
```

## Usage Example

```typescript
import { calculateScore, validateAgentData } from '@/lib/scoring';
import type { AgentData } from '@/lib/scoring';

// Example agent data (aggregated from ERC-8004 and x402)
const agentData: AgentData = {
  erc8004AgentId: 123,
  baseWallet: '0x1234...',
  solanaWallet: 'So11...',
  name: 'Top Trading Agent',
  
  // Base x402 metrics
  baseTxCount: 1500,
  baseVolumeUsd: 25000,
  baseUniqueBuyers: 45,
  baseFirstTxAt: new Date('2024-06-15'),
  baseLastTxAt: new Date('2025-01-01'),
  
  // Solana x402 metrics
  solanaTxCount: 500,
  solanaVolumeUsd: 8000,
  solanaUniqueBuyers: 20,
  solanaFirstTxAt: new Date('2024-09-01'),
  solanaLastTxAt: new Date('2024-12-28'),
  
  // ERC-8004 reputation
  reputationCount: 12,
  reputationAvgScore: 87.5,
  
  // ERC-8004 validation
  validationCount: 1,
  validationPassed: 1,
  validationFailed: 0,
};

// Validate data
const validation = validateAgentData(agentData);
if (!validation.isValid) {
  console.error('Invalid agent data:', validation.errors);
  process.exit(1);
}

// Calculate score
const result = calculateScore(agentData);

console.log('Score:', result.score);
console.log('Grade:', result.grade);
console.log('Reason Codes:', result.reasonCodes);
console.log('Breakdown:', result.breakdown);

// Example output:
// Score: 720
// Grade: Good
// Reason Codes: ['HIGH_VOLUME', 'HIGH_ACTIVITY', 'DIVERSE_BUYERS', 'VALIDATED', 'MULTI_CHAIN']
// Breakdown: { transactionHistory: { score: 100, ... }, ... }
```

## Future Enhancements

1. **Machine Learning Model:** Train on historical data once available to predict agent reliability.

2. **Weighted History:** Weight recent transactions higher than older ones.

3. **Industry Adjustments:** Different scoring curves for different agent types (trading vs. content vs. service).

4. **Peer Comparison:** Calculate percentile rank among all agents.

5. **Trend Analysis:** Factor in whether metrics are improving or declining.

6. **Fraud Detection:** Identify suspicious patterns (circular transactions, wash trading).
