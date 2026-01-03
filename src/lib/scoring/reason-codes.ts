/**
 * Reason Codes
 *
 * Human-readable explanations for score factors.
 */

import type { ReasonCode, ReasonCodeInfo } from "./types";

export const REASON_CODES: Record<ReasonCode, ReasonCodeInfo> = {
  // Negative codes
  NO_TRANSACTION_HISTORY: {
    code: "NO_TRANSACTION_HISTORY",
    label: "No Transaction History",
    description: "This agent has no recorded x402 transactions.",
    impact: "negative",
    category: "transaction",
  },
  LOW_VOLUME: {
    code: "LOW_VOLUME",
    label: "Low Transaction Volume",
    description: "Total transaction volume is below $1,000.",
    impact: "negative",
    category: "transaction",
  },
  FEW_TRANSACTIONS: {
    code: "FEW_TRANSACTIONS",
    label: "Limited Transactions",
    description: "Fewer than 10 total transactions recorded.",
    impact: "negative",
    category: "transaction",
  },
  FEW_BUYERS: {
    code: "FEW_BUYERS",
    label: "Limited Buyer Base",
    description: "Fewer than 5 unique buyers.",
    impact: "negative",
    category: "transaction",
  },
  NO_REPUTATION_DATA: {
    code: "NO_REPUTATION_DATA",
    label: "No Reputation Feedback",
    description: "No feedback recorded in ERC-8004 Reputation Registry.",
    impact: "negative",
    category: "reputation",
  },
  LOW_REPUTATION: {
    code: "LOW_REPUTATION",
    label: "Below Average Reputation",
    description: "Average feedback score is below 70.",
    impact: "negative",
    category: "reputation",
  },
  NO_VALIDATION: {
    code: "NO_VALIDATION",
    label: "Not Validated",
    description: "No third-party validation in ERC-8004 Validation Registry.",
    impact: "neutral",
    category: "validation",
  },
  FAILED_VALIDATION: {
    code: "FAILED_VALIDATION",
    label: "Failed Validation",
    description: "One or more validation attempts failed.",
    impact: "negative",
    category: "validation",
  },
  NEW_AGENT: {
    code: "NEW_AGENT",
    label: "New Agent",
    description: "First transaction less than 30 days ago.",
    impact: "neutral",
    category: "longevity",
  },
  SINGLE_CHAIN: {
    code: "SINGLE_CHAIN",
    label: "Single Chain Activity",
    description: "Active on only one blockchain (Base or Solana).",
    impact: "neutral",
    category: "chain",
  },
  INACTIVE_RECENTLY: {
    code: "INACTIVE_RECENTLY",
    label: "Recent Inactivity",
    description: "No transactions in the last 30 days.",
    impact: "negative",
    category: "transaction",
  },

  // Positive codes
  EXCELLENT_HISTORY: {
    code: "EXCELLENT_HISTORY",
    label: "Excellent Transaction History",
    description: "Total volume exceeds $100,000.",
    impact: "positive",
    category: "transaction",
  },
  HIGH_VOLUME: {
    code: "HIGH_VOLUME",
    label: "High Transaction Volume",
    description: "Total volume between $10,000 and $100,000.",
    impact: "positive",
    category: "transaction",
  },
  HIGH_ACTIVITY: {
    code: "HIGH_ACTIVITY",
    label: "High Activity",
    description: "Over 1,000 total transactions.",
    impact: "positive",
    category: "transaction",
  },
  DIVERSE_BUYERS: {
    code: "DIVERSE_BUYERS",
    label: "Diverse Buyer Base",
    description: "Over 20 unique buyers.",
    impact: "positive",
    category: "transaction",
  },
  HIGH_REPUTATION: {
    code: "HIGH_REPUTATION",
    label: "Excellent Reputation",
    description: "Average feedback score of 90 or above.",
    impact: "positive",
    category: "reputation",
  },
  VALIDATED: {
    code: "VALIDATED",
    label: "Validated",
    description: "Passed third-party validation.",
    impact: "positive",
    category: "validation",
  },
  ESTABLISHED_AGENT: {
    code: "ESTABLISHED_AGENT",
    label: "Established Agent",
    description: "Active for over 180 days.",
    impact: "positive",
    category: "longevity",
  },
  MULTI_CHAIN: {
    code: "MULTI_CHAIN",
    label: "Multi-Chain Presence",
    description: "Active on both Base and Solana.",
    impact: "positive",
    category: "chain",
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
  impact: "positive" | "negative" | "neutral"
): ReasonCode[] {
  return codes.filter((code) => REASON_CODES[code].impact === impact);
}

/**
 * Sort reason codes with negatives first, then positives, then neutral
 */
export function sortReasonCodes(codes: ReasonCode[]): ReasonCode[] {
  const order = { negative: 0, positive: 1, neutral: 2 };
  return [...codes].sort(
    (a, b) => order[REASON_CODES[a].impact] - order[REASON_CODES[b].impact]
  );
}
