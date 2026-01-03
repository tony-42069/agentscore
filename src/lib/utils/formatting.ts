/**
 * Formatting utilities for numbers, dates, and display
 */

/**
 * Format a number as USD currency
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with commas (e.g., 1,234,567)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format a number as compact (e.g., 1.2K, 3.4M)
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) {
        return "just now";
      }
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? "" : "s"} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? "" : "s"} ago`;

  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) === 1 ? "" : "s"} ago`;
}

/**
 * Format a date as short date string (e.g., "Jan 15, 2025")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date as ISO string for API responses
 */
export function formatISODate(date: Date): string {
  return date.toISOString();
}

/**
 * Calculate days since a date
 */
export function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get color for a score grade
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case "Excellent":
      return "#22c55e"; // green-500
    case "Very Good":
      return "#84cc16"; // lime-500
    case "Good":
      return "#eab308"; // yellow-500
    case "Fair":
      return "#f97316"; // orange-500
    case "Poor":
    default:
      return "#ef4444"; // red-500
  }
}

/**
 * Get color for a numeric score
 */
export function getScoreColor(score: number): string {
  if (score >= 800) return "#22c55e"; // Excellent - green
  if (score >= 740) return "#84cc16"; // Very Good - lime
  if (score >= 670) return "#eab308"; // Good - yellow
  if (score >= 580) return "#f97316"; // Fair - orange
  return "#ef4444"; // Poor - red
}

/**
 * Get grade from numeric score
 */
export function getGradeFromScore(
  score: number
): "Excellent" | "Very Good" | "Good" | "Fair" | "Poor" {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}
