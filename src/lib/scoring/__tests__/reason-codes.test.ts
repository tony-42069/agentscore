import { describe, it, expect } from "vitest";
import {
  REASON_CODES,
  getReasonCodeInfo,
  filterByImpact,
  sortReasonCodes,
} from "../reason-codes";
import type { ReasonCode } from "../types";

describe("REASON_CODES dictionary", () => {
  it("contains all expected reason codes", () => {
    // Negative codes
    expect(REASON_CODES).toHaveProperty("NO_TRANSACTION_HISTORY");
    expect(REASON_CODES).toHaveProperty("LOW_VOLUME");
    expect(REASON_CODES).toHaveProperty("FEW_TRANSACTIONS");
    expect(REASON_CODES).toHaveProperty("FEW_BUYERS");
    expect(REASON_CODES).toHaveProperty("NO_REPUTATION_DATA");
    expect(REASON_CODES).toHaveProperty("LOW_REPUTATION");
    expect(REASON_CODES).toHaveProperty("NO_VALIDATION");
    expect(REASON_CODES).toHaveProperty("FAILED_VALIDATION");
    expect(REASON_CODES).toHaveProperty("NEW_AGENT");
    expect(REASON_CODES).toHaveProperty("SINGLE_CHAIN");
    expect(REASON_CODES).toHaveProperty("INACTIVE_RECENTLY");

    // Positive codes
    expect(REASON_CODES).toHaveProperty("EXCELLENT_HISTORY");
    expect(REASON_CODES).toHaveProperty("HIGH_VOLUME");
    expect(REASON_CODES).toHaveProperty("HIGH_ACTIVITY");
    expect(REASON_CODES).toHaveProperty("DIVERSE_BUYERS");
    expect(REASON_CODES).toHaveProperty("HIGH_REPUTATION");
    expect(REASON_CODES).toHaveProperty("VALIDATED");
    expect(REASON_CODES).toHaveProperty("ESTABLISHED_AGENT");
    expect(REASON_CODES).toHaveProperty("MULTI_CHAIN");
  });

  it("each code has required properties", () => {
    Object.values(REASON_CODES).forEach((info) => {
      expect(info).toHaveProperty("code");
      expect(info).toHaveProperty("label");
      expect(info).toHaveProperty("description");
      expect(info).toHaveProperty("impact");
      expect(info).toHaveProperty("category");
    });
  });

  it("each code matches its key", () => {
    Object.entries(REASON_CODES).forEach(([key, info]) => {
      expect(info.code).toBe(key);
    });
  });

  it("has correct impact values", () => {
    const negativeCodes = [
      "NO_TRANSACTION_HISTORY",
      "LOW_VOLUME",
      "FEW_TRANSACTIONS",
      "FEW_BUYERS",
      "NO_REPUTATION_DATA",
      "LOW_REPUTATION",
      "FAILED_VALIDATION",
      "INACTIVE_RECENTLY",
    ];
    const positiveCodes = [
      "EXCELLENT_HISTORY",
      "HIGH_VOLUME",
      "HIGH_ACTIVITY",
      "DIVERSE_BUYERS",
      "HIGH_REPUTATION",
      "VALIDATED",
      "ESTABLISHED_AGENT",
      "MULTI_CHAIN",
    ];
    const neutralCodes = ["NO_VALIDATION", "NEW_AGENT", "SINGLE_CHAIN"];

    negativeCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].impact).toBe("negative");
    });
    positiveCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].impact).toBe("positive");
    });
    neutralCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].impact).toBe("neutral");
    });
  });

  it("has correct categories", () => {
    // Transaction category
    const transactionCodes = [
      "NO_TRANSACTION_HISTORY",
      "LOW_VOLUME",
      "FEW_TRANSACTIONS",
      "FEW_BUYERS",
      "INACTIVE_RECENTLY",
      "EXCELLENT_HISTORY",
      "HIGH_VOLUME",
      "HIGH_ACTIVITY",
      "DIVERSE_BUYERS",
    ];
    transactionCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].category).toBe("transaction");
    });

    // Reputation category
    const reputationCodes = ["NO_REPUTATION_DATA", "LOW_REPUTATION", "HIGH_REPUTATION"];
    reputationCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].category).toBe("reputation");
    });

    // Validation category
    const validationCodes = ["NO_VALIDATION", "FAILED_VALIDATION", "VALIDATED"];
    validationCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].category).toBe("validation");
    });

    // Longevity category
    const longevityCodes = ["NEW_AGENT", "ESTABLISHED_AGENT"];
    longevityCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].category).toBe("longevity");
    });

    // Chain category
    const chainCodes = ["SINGLE_CHAIN", "MULTI_CHAIN"];
    chainCodes.forEach((code) => {
      expect(REASON_CODES[code as ReasonCode].category).toBe("chain");
    });
  });
});

describe("getReasonCodeInfo", () => {
  it("returns correct info for valid reason code", () => {
    const info = getReasonCodeInfo("NO_TRANSACTION_HISTORY");
    expect(info.code).toBe("NO_TRANSACTION_HISTORY");
    expect(info.label).toBe("No Transaction History");
    expect(info.impact).toBe("negative");
    expect(info.category).toBe("transaction");
  });

  it("returns correct info for positive reason code", () => {
    const info = getReasonCodeInfo("HIGH_REPUTATION");
    expect(info.code).toBe("HIGH_REPUTATION");
    expect(info.label).toBe("Excellent Reputation");
    expect(info.impact).toBe("positive");
    expect(info.category).toBe("reputation");
  });

  it("returns correct info for neutral reason code", () => {
    const info = getReasonCodeInfo("NO_VALIDATION");
    expect(info.code).toBe("NO_VALIDATION");
    expect(info.impact).toBe("neutral");
    expect(info.category).toBe("validation");
  });

  it("returns info with description", () => {
    const info = getReasonCodeInfo("MULTI_CHAIN");
    expect(info.description).toContain("both");
  });
});

describe("filterByImpact", () => {
  const testCodes: ReasonCode[] = [
    "NO_TRANSACTION_HISTORY",
    "HIGH_VOLUME",
    "NO_VALIDATION",
    "LOW_REPUTATION",
    "VALIDATED",
    "SINGLE_CHAIN",
  ];

  it("filters positive codes correctly", () => {
    const positive = filterByImpact(testCodes, "positive");
    expect(positive).toContain("HIGH_VOLUME");
    expect(positive).toContain("VALIDATED");
    expect(positive).not.toContain("NO_TRANSACTION_HISTORY");
    expect(positive).not.toContain("NO_VALIDATION");
  });

  it("filters negative codes correctly", () => {
    const negative = filterByImpact(testCodes, "negative");
    expect(negative).toContain("NO_TRANSACTION_HISTORY");
    expect(negative).toContain("LOW_REPUTATION");
    expect(negative).not.toContain("HIGH_VOLUME");
    expect(negative).not.toContain("NO_VALIDATION");
  });

  it("filters neutral codes correctly", () => {
    const neutral = filterByImpact(testCodes, "neutral");
    expect(neutral).toContain("NO_VALIDATION");
    expect(neutral).toContain("SINGLE_CHAIN");
    expect(neutral).not.toContain("HIGH_VOLUME");
    expect(neutral).not.toContain("NO_TRANSACTION_HISTORY");
  });

  it("returns empty array when no matching codes", () => {
    const onlyNegative: ReasonCode[] = ["NO_TRANSACTION_HISTORY", "LOW_VOLUME"];
    const positive = filterByImpact(onlyNegative, "positive");
    expect(positive).toHaveLength(0);
  });

  it("returns all codes for matching impact", () => {
    const onlyPositive: ReasonCode[] = ["HIGH_VOLUME", "VALIDATED"];
    const positive = filterByImpact(onlyPositive, "positive");
    expect(positive).toHaveLength(2);
    expect(positive).toContain("HIGH_VOLUME");
    expect(positive).toContain("VALIDATED");
  });

  it("does not mutate original array", () => {
    const original = [...testCodes];
    filterByImpact(testCodes, "positive");
    expect(testCodes).toEqual(original);
  });
});

describe("sortReasonCodes", () => {
  it("sorts negative codes first", () => {
    const codes: ReasonCode[] = ["HIGH_VOLUME", "NO_TRANSACTION_HISTORY"];
    const sorted = sortReasonCodes(codes);
    expect(sorted[0]).toBe("NO_TRANSACTION_HISTORY");
    expect(sorted[1]).toBe("HIGH_VOLUME");
  });

  it("sorts positive codes second", () => {
    const codes: ReasonCode[] = ["NO_VALIDATION", "HIGH_VOLUME"];
    const sorted = sortReasonCodes(codes);
    expect(sorted[0]).toBe("HIGH_VOLUME");
    expect(sorted[1]).toBe("NO_VALIDATION");
  });

  it("sorts neutral codes last", () => {
    const codes: ReasonCode[] = ["NO_VALIDATION", "NO_TRANSACTION_HISTORY", "HIGH_VOLUME"];
    const sorted = sortReasonCodes(codes);
    expect(sorted[0]).toBe("NO_TRANSACTION_HISTORY"); // negative
    expect(sorted[1]).toBe("HIGH_VOLUME"); // positive
    expect(sorted[2]).toBe("NO_VALIDATION"); // neutral
  });

  it("maintains relative order within same impact", () => {
    const codes: ReasonCode[] = ["LOW_VOLUME", "FEW_TRANSACTIONS", "HIGH_VOLUME"];
    const sorted = sortReasonCodes(codes);
    // Negative codes should stay in their original relative order
    expect(sorted[0]).toBe("LOW_VOLUME");
    expect(sorted[1]).toBe("FEW_TRANSACTIONS");
    expect(sorted[2]).toBe("HIGH_VOLUME");
  });

  it("handles empty array", () => {
    const sorted = sortReasonCodes([]);
    expect(sorted).toHaveLength(0);
  });

  it("handles single code", () => {
    const sorted = sortReasonCodes(["NO_TRANSACTION_HISTORY"]);
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toBe("NO_TRANSACTION_HISTORY");
  });

  it("handles all same impact codes", () => {
    const codes: ReasonCode[] = ["LOW_VOLUME", "FEW_TRANSACTIONS", "FEW_BUYERS"];
    const sorted = sortReasonCodes(codes);
    expect(sorted).toHaveLength(3);
    // All negative, should maintain order
    expect(sorted[0]).toBe("LOW_VOLUME");
    expect(sorted[1]).toBe("FEW_TRANSACTIONS");
    expect(sorted[2]).toBe("FEW_BUYERS");
  });

  it("does not mutate original array", () => {
    const codes: ReasonCode[] = ["HIGH_VOLUME", "NO_TRANSACTION_HISTORY"];
    const original = [...codes];
    sortReasonCodes(codes);
    expect(codes).toEqual(original);
  });

  it("returns new array instance", () => {
    const codes: ReasonCode[] = ["NO_TRANSACTION_HISTORY"];
    const sorted = sortReasonCodes(codes);
    expect(sorted).not.toBe(codes);
  });
});
