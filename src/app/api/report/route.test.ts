import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock database
vi.mock("@/lib/db/queries", () => ({
  getScoreHistory: vi.fn(),
  logScoreQuery: vi.fn(),
}));

// Mock aggregator
vi.mock("@/lib/data/aggregator", () => ({
  aggregateAgentData: vi.fn(),
  detectChain: vi.fn(),
  getAgentIdentity: vi.fn(),
}));

// Mock scoring
vi.mock("@/lib/scoring", () => ({
  calculateScore: vi.fn(),
}));

// Mock address validation
vi.mock("@/lib/utils/addresses", () => ({
  isValidAddress: vi.fn(),
}));

import { getScoreHistory, logScoreQuery } from "@/lib/db/queries";
import {
  aggregateAgentData,
  detectChain,
  getAgentIdentity,
} from "@/lib/data/aggregator";
import { calculateScore } from "@/lib/scoring";
import { isValidAddress } from "@/lib/utils/addresses";

const mockGetScoreHistory = getScoreHistory as ReturnType<typeof vi.fn>;
const mockAggregateAgentData = aggregateAgentData as ReturnType<typeof vi.fn>;
const mockCalculateScore = calculateScore as ReturnType<typeof vi.fn>;
const mockDetectChain = detectChain as ReturnType<typeof vi.fn>;
const mockGetAgentIdentity = getAgentIdentity as ReturnType<typeof vi.fn>;
const mockIsValidAddress = isValidAddress as ReturnType<typeof vi.fn>;
const mockLogScoreQuery = logScoreQuery as ReturnType<typeof vi.fn>;

// Helper to create NextRequest
function createNextRequest(url: string): NextRequest {
  return new NextRequest(new URL(url));
}

describe("/api/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBaseAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const validSolanaAddress = "DRtqa8fKDHhEYPcMXpXzXqN54HZkFhNLQ6PQAaqrR1qQ";

  describe("success cases", () => {
    it("returns 200 with full report for valid address", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentIdentity.mockResolvedValue({
        agentId: 123,
        name: "Test Agent",
        description: "A test agent",
        imageUrl: "https://example.com/image.png",
        registeredAt: "2024-01-01T00:00:00Z",
      });
      mockAggregateAgentData.mockResolvedValue({
        erc8004AgentId: 123,
        baseWallet: validBaseAddress,
        solanaWallet: undefined,
        name: "Test Agent",
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
          transactionHistory: { score: 120, maxScore: 150, percentage: 80, details: { txCount: 100 } },
          activityLevel: { score: 100, maxScore: 150, percentage: 67, details: { volumeUsd: 50000 } },
          buyerDiversity: { score: 80, maxScore: 100, percentage: 80, details: { uniqueBuyers: 25 } },
          reputation: { score: 60, maxScore: 100, percentage: 60, details: { avgScore: 85 } },
          validation: { score: 40, maxScore: 100, percentage: 40, details: { passed: 4, failed: 1 } },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: ["HIGH_VOLUME", "ESTABLISHED_AGENT"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockResolvedValue([
        { date: "2024-06-01T00:00:00Z", score: 710 },
        { date: "2024-05-01T00:00:00Z", score: 700 },
        { date: "2024-04-01T00:00:00Z", score: 690 },
      ]);
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        agent: {
          address: validBaseAddress,
          name: "Test Agent",
          description: "A test agent",
          imageUrl: "https://example.com/image.png",
          erc8004AgentId: 123,
          wallets: {
            base: validBaseAddress,
            solana: null,
          },
          registeredAt: "2024-01-01T00:00:00Z",
        },
        score: {
          value: 720,
          grade: "Good",
          reasonCodes: ["HIGH_VOLUME", "ESTABLISHED_AGENT"],
        },
        metrics: {
          base: {
            transactionCount: 100,
            volumeUsd: 50000,
            uniqueBuyers: 25,
            firstTransactionAt: "2024-01-01T00:00:00.000Z",
            lastTransactionAt: "2024-06-01T00:00:00.000Z",
          },
          solana: {
            transactionCount: 0,
            volumeUsd: 0,
            uniqueBuyers: 0,
            firstTransactionAt: null,
            lastTransactionAt: null,
          },
        },
        reputation: {
          feedbackCount: 10,
          averageScore: 85,
        },
        validation: {
          totalValidations: 5,
          passed: 4,
          failed: 1,
        },
      });
      expect(data.data.history).toHaveLength(3);
      expect(data.data.calculatedAt).toBeDefined();
    });

    it("returns full report for Solana address with cross-chain data", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("solana");
      mockGetAgentIdentity.mockResolvedValue({
        agentId: 456,
        name: "Cross-Chain Agent",
        description: null,
        imageUrl: null,
        registeredAt: null,
      });
      mockAggregateAgentData.mockResolvedValue({
        erc8004AgentId: 456,
        baseWallet: "0xBaseWallet123",
        solanaWallet: validSolanaAddress,
        name: "Cross-Chain Agent",
        baseTxCount: 50,
        baseVolumeUsd: 25000,
        baseUniqueBuyers: 15,
        baseFirstTxAt: new Date("2024-02-01"),
        baseLastTxAt: new Date("2024-06-01"),
        solanaTxCount: 100,
        solanaVolumeUsd: 50000,
        solanaUniqueBuyers: 30,
        solanaFirstTxAt: new Date("2024-01-01"),
        solanaLastTxAt: new Date("2024-06-15"),
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
          activityLevel: { score: 120, maxScore: 150, percentage: 80, details: {} },
          buyerDiversity: { score: 90, maxScore: 100, percentage: 90, details: {} },
          reputation: { score: 70, maxScore: 100, percentage: 70, details: {} },
          validation: { score: 60, maxScore: 100, percentage: 60, details: {} },
          longevity: { score: 50, maxScore: 100, percentage: 50, details: {} },
          crossChain: { score: 50, maxScore: 100, percentage: 50, details: {} },
        },
        reasonCodes: ["HIGH_VOLUME", "MULTI_CHAIN", "HIGH_REPUTATION"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockResolvedValue([]);
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validSolanaAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.agent.wallets).toMatchObject({
        base: "0xBaseWallet123",
        solana: validSolanaAddress,
      });
      expect(data.data.metrics.base.transactionCount).toBe(50);
      expect(data.data.metrics.solana.transactionCount).toBe(100);
      expect(data.data.score.reasonCodes).toContain("MULTI_CHAIN");
    });

    it("handles missing identity gracefully", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentIdentity.mockResolvedValue(null);
      mockAggregateAgentData.mockResolvedValue({
        erc8004AgentId: undefined,
        baseWallet: validBaseAddress,
        solanaWallet: undefined,
        name: "Unregistered Agent",
        baseTxCount: 10,
        baseVolumeUsd: 5000,
        baseUniqueBuyers: 5,
        baseFirstTxAt: new Date("2024-05-01"),
        baseLastTxAt: new Date("2024-06-01"),
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
      });
      mockCalculateScore.mockReturnValue({
        score: 450,
        grade: "Poor",
        breakdown: {
          transactionHistory: { score: 50, maxScore: 150, percentage: 33, details: {} },
          activityLevel: { score: 30, maxScore: 150, percentage: 20, details: {} },
          buyerDiversity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          reputation: { score: 0, maxScore: 100, percentage: 0, details: {} },
          validation: { score: 0, maxScore: 100, percentage: 0, details: {} },
          longevity: { score: 50, maxScore: 100, percentage: 50, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: ["NEW_AGENT", "NO_REPUTATION_DATA", "NO_VALIDATION"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockResolvedValue([]);
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.agent).toMatchObject({
        address: validBaseAddress,
        name: "Unregistered Agent",
        description: null,
        imageUrl: null,
        erc8004AgentId: null,
        registeredAt: null,
      });
    });

    it("handles history fetch failure gracefully", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentIdentity.mockResolvedValue(null);
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
        score: 650,
        grade: "Fair",
        breakdown: {
          transactionHistory: { score: 100, maxScore: 150, percentage: 67, details: {} },
          activityLevel: { score: 80, maxScore: 150, percentage: 53, details: {} },
          buyerDiversity: { score: 60, maxScore: 100, percentage: 60, details: {} },
          reputation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          validation: { score: 50, maxScore: 100, percentage: 50, details: {} },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: [],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockRejectedValue(new Error("DB error"));
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.history).toEqual([]);
    });
  });

  describe("error cases", () => {
    it("returns 400 when address is missing", async () => {
      const request = createNextRequest("http://localhost:3000/api/report");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid address", async () => {
      mockIsValidAddress.mockReturnValue(false);

      const request = createNextRequest(
        "http://localhost:3000/api/report?address=invalid"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_ADDRESS");
    });

    it("returns 400 when chain cannot be detected", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("unknown");

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
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
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("response structure", () => {
    it("returns all required fields in agent section", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentIdentity.mockResolvedValue({
        agentId: 123,
        name: "Test Agent",
        description: "Description",
        imageUrl: "https://example.com/image.png",
        registeredAt: "2024-01-01T00:00:00Z",
      });
      mockAggregateAgentData.mockResolvedValue({
        baseWallet: validBaseAddress,
        solanaWallet: null,
        name: "Test Agent",
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
        score: 650,
        grade: "Fair",
        breakdown: {
          transactionHistory: { score: 100, maxScore: 150, percentage: 67, details: {} },
          activityLevel: { score: 80, maxScore: 150, percentage: 53, details: {} },
          buyerDiversity: { score: 60, maxScore: 100, percentage: 60, details: {} },
          reputation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          validation: { score: 50, maxScore: 100, percentage: 50, details: {} },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: [],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockResolvedValue([]);
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.agent).toHaveProperty("address");
      expect(data.data.agent).toHaveProperty("name");
      expect(data.data.agent).toHaveProperty("description");
      expect(data.data.agent).toHaveProperty("imageUrl");
      expect(data.data.agent).toHaveProperty("erc8004AgentId");
      expect(data.data.agent).toHaveProperty("wallets");
      expect(data.data.agent).toHaveProperty("registeredAt");
      expect(data.data.agent.wallets).toHaveProperty("base");
      expect(data.data.agent.wallets).toHaveProperty("solana");
    });

    it("returns all required fields in score section", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentIdentity.mockResolvedValue(null);
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
        score: 650,
        grade: "Fair",
        breakdown: {
          transactionHistory: { score: 100, maxScore: 150, percentage: 67, details: {} },
          activityLevel: { score: 80, maxScore: 150, percentage: 53, details: {} },
          buyerDiversity: { score: 60, maxScore: 100, percentage: 60, details: {} },
          reputation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          validation: { score: 50, maxScore: 100, percentage: 50, details: {} },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: ["TEST_CODE"],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockResolvedValue([]);
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.score).toHaveProperty("value");
      expect(data.data.score).toHaveProperty("grade");
      expect(data.data.score).toHaveProperty("breakdown");
      expect(data.data.score).toHaveProperty("reasonCodes");
      expect(data.data.score.breakdown).toHaveProperty("transactionHistory");
      expect(data.data.score.breakdown).toHaveProperty("activityLevel");
      expect(data.data.score.breakdown).toHaveProperty("buyerDiversity");
      expect(data.data.score.breakdown).toHaveProperty("reputation");
      expect(data.data.score.breakdown).toHaveProperty("validation");
      expect(data.data.score.breakdown).toHaveProperty("longevity");
      expect(data.data.score.breakdown).toHaveProperty("crossChain");
    });

    it("returns all required fields in metrics section", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentIdentity.mockResolvedValue(null);
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
        score: 650,
        grade: "Fair",
        breakdown: {
          transactionHistory: { score: 100, maxScore: 150, percentage: 67, details: {} },
          activityLevel: { score: 80, maxScore: 150, percentage: 53, details: {} },
          buyerDiversity: { score: 60, maxScore: 100, percentage: 60, details: {} },
          reputation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          validation: { score: 50, maxScore: 100, percentage: 50, details: {} },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: [],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockResolvedValue([]);
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.metrics).toHaveProperty("base");
      expect(data.data.metrics).toHaveProperty("solana");
      expect(data.data.metrics.base).toHaveProperty("transactionCount");
      expect(data.data.metrics.base).toHaveProperty("volumeUsd");
      expect(data.data.metrics.base).toHaveProperty("uniqueBuyers");
      expect(data.data.metrics.base).toHaveProperty("firstTransactionAt");
      expect(data.data.metrics.base).toHaveProperty("lastTransactionAt");
    });

    it("returns all required fields in reputation and validation sections", async () => {
      mockIsValidAddress.mockReturnValue(true);
      mockDetectChain.mockReturnValue("base");
      mockGetAgentIdentity.mockResolvedValue(null);
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
        score: 650,
        grade: "Fair",
        breakdown: {
          transactionHistory: { score: 100, maxScore: 150, percentage: 67, details: {} },
          activityLevel: { score: 80, maxScore: 150, percentage: 53, details: {} },
          buyerDiversity: { score: 60, maxScore: 100, percentage: 60, details: {} },
          reputation: { score: 40, maxScore: 100, percentage: 40, details: {} },
          validation: { score: 50, maxScore: 100, percentage: 50, details: {} },
          longevity: { score: 20, maxScore: 100, percentage: 20, details: {} },
          crossChain: { score: 0, maxScore: 100, percentage: 0, details: {} },
        },
        reasonCodes: [],
        calculatedAt: new Date("2024-06-15T10:00:00Z"),
      });
      mockGetScoreHistory.mockResolvedValue([]);
      mockLogScoreQuery.mockResolvedValue(undefined);

      const request = createNextRequest(
        `http://localhost:3000/api/report?address=${validBaseAddress}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.reputation).toHaveProperty("feedbackCount");
      expect(data.data.reputation).toHaveProperty("averageScore");
      expect(data.data.validation).toHaveProperty("totalValidations");
      expect(data.data.validation).toHaveProperty("passed");
      expect(data.data.validation).toHaveProperty("failed");
      expect(data.data).toHaveProperty("history");
      expect(data.data).toHaveProperty("calculatedAt");
    });
  });
});
