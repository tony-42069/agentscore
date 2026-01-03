/**
 * Core types for the AgentScore scoring system
 */

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
  details: Record<string, unknown>;
}

export type ScoreGrade = "Excellent" | "Very Good" | "Good" | "Fair" | "Poor";

export interface ScoreResult {
  score: number;
  grade: ScoreGrade;
  percentile?: number;
  breakdown: ScoreBreakdown;
  reasonCodes: ReasonCode[];
  calculatedAt: Date;
}

export type ReasonCode =
  // Negative codes
  | "NO_TRANSACTION_HISTORY"
  | "LOW_VOLUME"
  | "FEW_TRANSACTIONS"
  | "FEW_BUYERS"
  | "NO_REPUTATION_DATA"
  | "LOW_REPUTATION"
  | "NO_VALIDATION"
  | "FAILED_VALIDATION"
  | "NEW_AGENT"
  | "SINGLE_CHAIN"
  | "INACTIVE_RECENTLY"
  // Positive codes
  | "EXCELLENT_HISTORY"
  | "HIGH_VOLUME"
  | "HIGH_ACTIVITY"
  | "DIVERSE_BUYERS"
  | "HIGH_REPUTATION"
  | "VALIDATED"
  | "ESTABLISHED_AGENT"
  | "MULTI_CHAIN";

export interface ReasonCodeInfo {
  code: ReasonCode;
  label: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  category: "transaction" | "reputation" | "validation" | "longevity" | "chain";
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ScoreResponse {
  address: string;
  chain: "base" | "solana";
  score: number;
  grade: ScoreGrade;
  reasonCodes: ReasonCode[];
  calculatedAt: string;
  cached: boolean;
}

export interface ReportResponse {
  agent: {
    address: string;
    name: string | null;
    description: string | null;
    imageUrl: string | null;
    erc8004AgentId: number | null;
    wallets: {
      base: string | null;
      solana: string | null;
    };
    registeredAt: string | null;
  };
  score: {
    value: number;
    grade: ScoreGrade;
    breakdown: ScoreBreakdown;
    reasonCodes: ReasonCode[];
  };
  metrics: {
    base: ChainMetrics;
    solana: ChainMetrics;
  };
  reputation: {
    feedbackCount: number;
    averageScore: number;
  };
  validation: {
    totalValidations: number;
    passed: number;
    failed: number;
  };
  history: Array<{ date: string; score: number }>;
  calculatedAt: string;
}

export interface ChainMetrics {
  transactionCount: number;
  volumeUsd: number;
  uniqueBuyers: number;
  firstTransactionAt: string | null;
  lastTransactionAt: string | null;
}

export interface AgentListItem {
  address: string;
  name: string | null;
  score: number;
  grade: ScoreGrade;
  totalVolumeUsd: number;
  transactionCount: number;
  chains: string[];
  lastActiveAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
