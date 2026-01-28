import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock database
vi.mock("@/lib/db/queries", () => ({
  getAgentWithCache: vi.fn(),
  upsertAgent: vi.fn(),
  logScoreQuery: vi.fn(),
}));

// Mock aggregator
vi.mock("@/lib/data/aggregator", () => ({
  aggregateAgentData: vi.fn(),
  detectChain: vi.fn(),
}));

// Mock scoring
vi.mock("@/lib/scoring", () => ({
  calculateScore: vi.fn(),
}));

// Mock address validation
vi.mock("@/lib/utils/addresses", () => ({
  isValidAddress: vi.fn(),
}));

import {
  getAgentWithCache,
  upsertAgent,
  logScoreQuery,
} from "@/lib/db/queries";
import { aggregateAgentData, detectChain } from "@/lib/data/aggregator";
import { calculateScore } from "@/lib/scoring";
import { isValidAddress } from "@/lib/utils/addresses";

const mockGetAgentWithCache = getAgentWithCache as ReturnType<typeof vi.fn>;
const mockAggregateAgentData = aggregateAgentData as ReturnType<typeof vi.fn>;
const mockCalculateScore = calculateScore as ReturnType<typeof vi.fn>;
const mockDetectChain = detectChain as ReturnType<typeof vi.fn>;
const mockIsValidAddress = isValidAddress as ReturnType<typeof vi.fn>;
const mockUpsertAgent = upsertAgent as ReturnType<typeof vi.fn>;
const mockLogScoreQuery = logScoreQuery as ReturnType<typeof vi.fn>;

// Helper to create NextRequest
function createNextRequest(url: string): NextRequest {
  return new NextRequest(new URL(url));
}

describe("/api/score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBaseAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const validSolanaAddress = "DRtqa8fKDHhEYPcMXpXzXqN54HZkFhNLQ6PQAaqrR1qQ";

  describe("success cases", () => {
    it("returns 200 with score data for valid Base address (cache miss)", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentWithCache.mockResolvedValue(null);
      mockAggregateAgentData.mockResolvedValue({
        baseWallet: validBaseAddress,
        baseTxCount: 100,
        baseVolumeUsd: 50000,
        baseUniqueBuyers: 25,
        baseFirstTxAt: new Date("2024-01-01"),
        baseLastTxAt: new Date("2024-06-01"),
        solanaTxCount: 0,
        solanaVolumeUsd: 0,
        solanaUniqueBuyers: 0,
        solanaFirstTxAt: null,
        solanaLastTxAt: null,
        reputationCount: 10,
        reputationAvgScore: 85,
        validationCount: 5,
        validationPassed: 4,
        validationFailed: 1,
      });
      mockCalculateScore.mockReturnValue({
        score: 720,
        grade: "Good",
        breakdown: {
          transactionHistory: { score: 120, maxScore: 150, percentage: 80, details: {} },
          activityLevel: { score: 100, maxScore: 150, percentage: 67, details: {} },
          buyerDiversity: { score: 80, maxScore: 100, percentage: 80, details: {} },
          reputation: { score: 60, maxScore: 100, percentage: 60, details: {} },
          validation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: ["HIGH_VOLUME", "ESTABLISHED_AGENT"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockUpsertAgent.mockResolvedValue({ id: "agent-1" });
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        address: validBaseAddress,
        chain: "base",
        score: 720,
        grade: "Good",
        reasonCodes: ["HIGH_VOLUME", "ESTABLISHED_AGENT"],
        cached: false,
      });
      expect(data.data.calculatedAt).toBeDefined();
    });

    it("returns 200 with score data for valid Solana address (cache miss)", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("solana");
      mockGetAgentWithCache.mockResolvedValue(null);
      mockAggregateAgentData.mockResolvedValue({
        solanaWallet: validSolanaAddress,
        baseTxCount: 0,
        baseVolumeUsd: 0,
        baseUniqueBuyers: 0,
        baseFirstTxAt: null,
        baseLastTxAt: null,
        solanaTxCount: 200,
        solanaVolumeUsd: 100000,
        solanaUniqueBuyers: 50,
        solanaFirstTxAt: new Date("2024-01-01"),
        solanaLastTxAt: new Date("2024-06-01"),
        reputationCount: 20,
        reputationAvgScore: 90,
        validationCount: 10,
        validationPassed: 9,
        validationFailed: 1,
      });
      mockCalculateScore.mockReturnValue({
        score: 780,
        grade: "Very Good",
        breakdown: {
          transactionHistory: { score: 140, maxScore: 150, percentage: 93, details: {} },
          activityLevel: { score: 130, maxScore: 150, percentage: 87, details: {} },
          buyerDiversity: { score: 90, maxScore: 100, percentage: 90, details: {} },
          reputation: { score: 70, maxScore: 100, percentage: 70, details: {} },
          validation: { score: 50, maxScore: 100, percentage: 50, details: {} },
          longevity: { score: 0, maxScore: 100, percentage: 0, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: ["HIGH_VOLUME", "HIGH_REPUTATION", "VALIDATED"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockUpsertAgent.mockResolvedValue({ id: "agent-2" });
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validSolanaAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        address: validSolanaAddress,
        chain: "solana",
        score: 780,
        grade: "Very Good",
        reasonCodes: ["HIGH_VOLUME", "HIGH_REPUTATION", "VALIDATED"],
        cached: false,
      });
      expect(data.data.calculatedAt).toBeDefined();
    });

    it("returns 200 with cached score data (cache hit)", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentWithCache.mockResolvedValue({
        agent: {
          id: "agent-1",
          score: 750,
          reason_codes: ["HIGH_VOLUME", "DIVERSE_BUYERS"],
          score_calculated_at: "2024-06-14T10:00:00Z",
        },
        cached: true,
      });
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        address: validBaseAddress,
        chain: "base",
        score: 750,
        grade: "Very Good",
        reasonCodes: ["HIGH_VOLUME", "DIVERSE_BUYERS"],
        calculatedAt: "2024-06-14T10:00:00Z",
        cached: true,
      });
      expect(mockAggregateAgentData).not.toHaveBeenCalled();
      expect(mockCalculateScore).not.toHaveBeenCalled();
    });

    it("calculates fresh score when cache lookup fails", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentWithCache.mockRejectedValue(new Error("DB connection failed"));
      mockAggregateAgentData.mockResolvedValue({
        baseWallet: validBaseAddress,
        baseTxCount: 50,
        baseVolumeUsd: 25000,
        baseUniqueBuyers: 15,
        baseFirstTxAt: new Date("2024-01-01"),
        baseLastTxAt: new Date("2024-06-01"),
        solanaTxCount: 0,
        solanaVolumeUsd: 0,
        solanaUniqueBuyers: 0,
        solanaFirstTxAt: null,
        solanaLastTxAt: null,
        reputationCount: 5,
        reputationAvgScore: 75,
        validationCount: 3,
        validationPassed: 3,
        validationFailed: 0,
      });
      mockCalculateScore.mockReturnValue({
        score: 680,
        grade: "Good",
        breakdown: {
          transactionHistory: { score: 100, maxScore: 150, percentage: 67, details: {} },
          activityLevel: { score: 80, maxScore: 150, percentage: 53, details: {} },
          buyerDiversity: { score: 60, maxScore: 100, percentage: 60, details: {} },
          reputation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          validation: { score: 50, maxScore: 100, percentage: 50, details: {} },
          longevity: { score: 50, maxScore: 100, percentage: 50, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: ["ESTABLISHED_AGENT"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockUpsertAgent.mockResolvedValue({ id: "agent-3" });
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.score).toBe(680);
      expect(data.data.cached).toBe(false);
    });

    it("accepts explicit chain parameter", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockGetAgentWithCache.mockResolvedValue({
        agent: {
          id: "agent-1",
          score: 700,
          reason_codes: [],
          score_calculated_at: "2024-06-14T10:00:00Z",
        },
        cached: true,
      });
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validBaseAddress}&chain=base`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockDetectChain).not.toHaveBeenCalled();
    });
  });

  describe("error cases", () => {
    it("returns 400 when address is missing", async () => {
      const request = createNextRequest("http://localhost:3000/api/score");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when address is empty string", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/score?address="
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid address format", async () => {
      mockIsValidAddress.mockReturnValue(false);

      const request = createNextRequest(
        "http://localhost:3000/api/score?address=invalid-address"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_ADDRESS");
    });

    it("returns 400 when chain detection returns unknown", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("unknown");

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("UNKNOWN_CHAIN");
    });

    it("returns 500 for unexpected errors", async () => {
      mockIsValidAddress.mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("response structure", () => {
    it("returns all required fields in response", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentWithCache.mockResolvedValue(null);
      mockAggregateAgentData.mockResolvedValue({
        baseWallet: validBaseAddress,
        baseTxCount: 100,
        baseVolumeUsd: 50000,
        baseUniqueBuyers: 25,
        baseFirstTxAt: new Date("2024-01-01"),
        baseLastTxAt: new Date("2024-06-01"),
        solanaTxCount: 0,
        solanaVolumeUsd: 0,
        solanaUniqueBuyers: 0,
        solanaFirstTxAt: null,
        solanaLastTxAt: null,
        reputationCount: 10,
        reputationAvgScore: 85,
        validationCount: 5,
        validationPassed: 4,
        validationFailed: 1,
      });
      mockCalculateScore.mockReturnValue({
        score: 720,
        grade: "Good",
        breakdown: {
          transactionHistory: { score: 120, maxScore: 150, percentage: 80, details: {} },
          activityLevel: { score: 100, maxScore: 150, percentage: 67, details: {} },
          buyerDiversity: { score: 80, maxScore: 100, percentage: 80, details: {} },
          reputation: { score: 60, maxScore: 100, percentage: 60, details: {} },
          validation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: ["HIGH_VOLUME"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockUpsertAgent.mockResolvedValue({ id: "agent-1" });
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/score?address=${validBaseAddress}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data).toHaveProperty("address");
      expect(data.data).toHaveProperty("chain");
      expect(data.data).toHaveProperty("score");
      expect(data.data).toHaveProperty("grade");
      expect(data.data).toHaveProperty("reasonCodes");
      expect(data.data).toHaveProperty("calculatedAt");
      expect(data.data).toHaveProperty("cached");
      expect(typeof data.data.score).toBe("number");
      expect(typeof data.data.cached).toBe("boolean");
      expect(Array.isArray(data.data.reasonCodes)).toBe(true);
    });

    it("correctly maps grade based on score", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentWithCache.mockResolvedValue(null);
      mockAggregateAgentData.mockResolvedValue({
        baseWallet: validBaseAddress,
        baseTxCount: 100,
        baseVolumeUsd: 50000,
        baseUniqueBuyers: 25,
        baseFirstTxAt: new Date("2024-01-01"),
        baseLastTxAt: new Date("2024-06-01"),
        solanaTxCount: 0,
        solanaVolumeUsd: 0,
        solanaUniqueBuyers: 0,
        solanaFirstTxAt: null,
        solanaLastTxAt: null,
        reputationCount: 10,
        reputationAvgScore: 85,
        validationCount: 5,
        validationPassed: 4,
        validationFailed: 1,
      });
      mockUpsertAgent.mockResolvedValue({ id: "agent-1" });
      mockLogScoreQuery.mockResolvedValue(undefined);

      // Test different score ranges
      const testCases = [
        { score: 820, expectedGrade: "Excellent" },
        { score: 760, expectedGrade: "Very Good" },
        { score: 700, expectedGrade: "Good" },
        { score: 600, expectedGrade: "Fair" },
        { score: 500, expectedGrade: "Poor" },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        mockIsValidAddress.mockReturnValue(true);
        mockDetectChain.mockReturnValue("base");
        mockGetAgentWithCache.mockResolvedValue(null);
        mockAggregateAgentData.mockResolvedValue({
          baseWallet: validBaseAddress,
          baseTxCount: 100,
          baseVolumeUsd: 50000,
          baseUniqueBuyers: 25,
          baseFirstTxAt: new Date("2024-01-01"),
          baseLastTxAt: new Date("2024-06-01"),
          solanaTxCount: 0,
          solanaVolumeUsd: 0,
          solanaUniqueBuyers: 0,
          solanaFirstTxAt: null,
          solanaLastTxAt: null,
          reputationCount: 10,
          reputationAvgScore: 85,
          validationCount: 5,
          validationPassed: 4,
          validationFailed: 1,
        });
        mockUpsertAgent.mockResolvedValue({ id: "agent-1" });
        mockLogScoreQuery.mockResolvedValue(undefined);
        mockCalculateScore.mockReturnValue({
          score: testCase.score,
          grade: testCase.expectedGrade,
          breakdown: {
            transactionHistory: { score: 120, maxScore: 150, percentage: 80, details: {} },
            activityLevel: { score: 100, maxScore: 150, percentage: 67, details: {} },
            buyerDiversity: { score: 80, maxScore: 100, percentage: 80, details: {} },
            reputation: { score: 60, maxScore: 100, percentage: 60, details: {} },
            validation: { score: 40, maxScore: 100, percentage: 40, details: {} },
            longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
            crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
          },
          reasonCodes: [],
          calculatedAt: new Date("2024-06-15T10:00:00Z"),
        });

        const request = createNextRequest(
          `http://localhost:3000/api/score?address=${validBaseAddress}`
        );
        const response = await GET(request);
        const data = await response.json();

        expect(data.data.grade).toBe(testCase.expectedGrade);
      }
    });
  });
});
