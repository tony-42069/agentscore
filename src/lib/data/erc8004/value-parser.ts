/**
 * Value Parser Utilities for ERC-8004 Reputation Format
 * 
 * Handles parsing of value/valueDecimals to human-readable numbers
 * and formatting based on standard tag types.
 */

// Standard tag definitions
export const STANDARD_TAGS = {
  STARRED: "starred",
  REACHABLE: "reachable",
  OWNER_VERIFIED: "ownerVerified",
  UPTIME: "uptime",
  SUCCESS_RATE: "successRate",
  RESPONSE_TIME: "responseTime",
  BLOCKTIME_FRESHNESS: "blocktimeFreshness",
  REVENUES: "revenues",
  TRADING_YIELD: "tradingYield",
} as const;

// Type for standard tag values
export type StandardTag = (typeof STANDARD_TAGS)[keyof typeof STANDARD_TAGS];

/**
 * Parse value/valueDecimals to human-readable number
 * 
 * @param value - The raw value (can be negative!)
 * @param valueDecimals - Number of decimal places (0-18)
 * @returns Human-readable number
 * 
 * Examples:
 * - parseValue(87n, 0) → 87 (star rating)
 * - parseValue(9977n, 2) → 99.77 (uptime %)
 * - parseValue(-32n, 1) → -3.2 (trading yield %)
 * - parseValue(556000n, 0) → 556000 (revenue USD)
 */
export function parseValue(value: bigint, valueDecimals: number): number {
  if (valueDecimals === 0) {
    return Number(value);
  }
  
  const divisor = 10 ** valueDecimals;
  return Number(value) / divisor;
}

/**
 * Format human-readable number to value/valueDecimals
 * 
 * @param num - The human-readable number
 * @param decimals - Number of decimal places (0-18)
 * @returns Object with value (bigint) and valueDecimals
 * 
 * Examples:
 * - formatValue(87, 0) → { value: 87n, valueDecimals: 0 }
 * - formatValue(99.77, 2) → { value: 9977n, valueDecimals: 2 }
 * - formatValue(-3.2, 1) → { value: -32n, valueDecimals: 1 }
 */
export function formatValue(
  num: number,
  decimals: number
): { value: bigint; valueDecimals: number } {
  const multiplier = 10 ** decimals;
  const value = BigInt(Math.round(num * multiplier));
  
  return {
    value,
    valueDecimals: decimals,
  };
}

/**
 * Get the unit for a given tag
 */
function getUnitForTag(tag: string): string {
  const lowerTag = tag.toLowerCase();
  
  switch (lowerTag) {
    case STANDARD_TAGS.UPTIME:
    case STANDARD_TAGS.SUCCESS_RATE:
    case STANDARD_TAGS.TRADING_YIELD:
      return "%";
    case STANDARD_TAGS.REVENUES:
      return "USD";
    case STANDARD_TAGS.RESPONSE_TIME:
      return "ms";
    case STANDARD_TAGS.BLOCKTIME_FRESHNESS:
      return "blocks";
    case STANDARD_TAGS.STARRED:
      return "stars";
    case STANDARD_TAGS.REACHABLE:
    case STANDARD_TAGS.OWNER_VERIFIED:
      return "status";
    default:
      return "";
  }
}

/**
 * Format a value based on its tag for display
 */
function formatDisplayValue(value: number, tag: string): string {
  const lowerTag = tag.toLowerCase();
  
  switch (lowerTag) {
    case STANDARD_TAGS.UPTIME:
    case STANDARD_TAGS.SUCCESS_RATE:
      // Percentage with 2 decimal places
      return `${value.toFixed(2)}%`;
    
    case STANDARD_TAGS.TRADING_YIELD:
      // Percentage with sign
      return value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
    
    case STANDARD_TAGS.REVENUES:
      // USD with commas for thousands
      return `$${value.toLocaleString("en-US")}`;
    
    case STANDARD_TAGS.RESPONSE_TIME:
      // Milliseconds
      return `${Math.round(value)}ms`;
    
    case STANDARD_TAGS.BLOCKTIME_FRESHNESS:
      // Blocks
      return `${Math.round(value)} blocks`;
    
    case STANDARD_TAGS.STARRED:
      // Star rating
      return `${value.toFixed(1)} ★`;
    
    case STANDARD_TAGS.REACHABLE:
    case STANDARD_TAGS.OWNER_VERIFIED:
      // Boolean-like status
      return value > 0 ? "Verified" : "Unverified";
    
    default:
      // Default formatting
      if (Number.isInteger(value)) {
        return `${value}`;
      }
      return `${value.toFixed(2)}`;
  }
}

/**
 * Parse feedback entry to human-readable format with display formatting
 */
export function parseFeedbackEntry(entry: {
  value: bigint;
  valueDecimals: number;
  tag1: string;
}): {
  humanReadableValue: number;
  displayValue: string;
  unit: string;
} {
  const humanReadableValue = parseValue(entry.value, entry.valueDecimals);
  const unit = getUnitForTag(entry.tag1);
  const displayValue = formatDisplayValue(humanReadableValue, entry.tag1);
  
  return {
    humanReadableValue,
    displayValue,
    unit,
  };
}

/**
 * Parse a summary value to human-readable format
 */
export function parseSummaryValue(summary: {
  summaryValue: bigint;
  summaryValueDecimals: number;
}): number {
  return parseValue(summary.summaryValue, summary.summaryValueDecimals);
}

/**
 * Format value for a specific tag type
 */
export function formatValueForTag(
  value: number,
  tag: StandardTag | string
): { value: bigint; valueDecimals: number } {
  const lowerTag = tag.toLowerCase();
  
  switch (lowerTag) {
    case STANDARD_TAGS.UPTIME:
    case STANDARD_TAGS.SUCCESS_RATE:
    case STANDARD_TAGS.TRADING_YIELD:
      // Percentages use 2 decimal places
      return formatValue(value, 2);
    
    case STANDARD_TAGS.REVENUES:
      // Revenues use 0 decimal places (whole dollars)
      return formatValue(value, 0);
    
    case STANDARD_TAGS.RESPONSE_TIME:
      // Response time in ms uses 0 decimal places
      return formatValue(value, 0);
    
    case STANDARD_TAGS.BLOCKTIME_FRESHNESS:
      // Block count uses 0 decimal places
      return formatValue(value, 0);
    
    case STANDARD_TAGS.STARRED:
      // Star ratings use 1 decimal place
      return formatValue(value, 1);
    
    case STANDARD_TAGS.REACHABLE:
    case STANDARD_TAGS.OWNER_VERIFIED:
      // Boolean status uses 0 decimal places
      return formatValue(value > 0 ? 1 : 0, 0);
    
    default:
      // Default to 2 decimal places
      return formatValue(value, 2);
  }
}
