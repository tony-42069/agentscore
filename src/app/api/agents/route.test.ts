import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock database
vi.mock("@/lib/db/queries", () => ({
  getAgentsList: vi.fn(),
  getAgentsCount: vi.fn(),
  agentRowToApiFormat: vi.fn((agent) => ({
    address: agent.base_wallet || agent.solana_wallet || "",
    name: agent.name,
    score: agent.score || 300,
    grade: agent.score ? getGrade(agent.score) : "Poor",
    totalVolumeUsd: Number(agent.base_volume_usd) + Number(agent.solana_volume_usd),
    transactionCount: agent.base_tx_count + agent.solana_tx_count,
    chains: [
      ...(agent.base_tx_count > 0 ? ["base"] : []),
      ...(agent.solana_tx_count > 0 ? ["solana"] : []),
    ],
    lastActiveAt: agent.updated_at,
  })),
}));

import { getAgentsList, getAgentsCount } from "@/lib/db/queries";

const mockGetAgentsList = getAgentsList as ReturnType<typeof vi.fn>;
const mockGetAgentsCount = getAgentsCount as ReturnType<typeof vi.fn>;

function getGrade(score: number): string {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}

function createMockAgentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "agent-1",
    erc8004_agent_id: null,
    base_wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    solana_wallet: null,
    name: "Test Agent",
    description: null,
    image_url: null,
    registration_uri: null,
    score: 720,
    score_breakdown: null,
    reason_codes: null,
    score_calculated_at: "2024-06-15T10:00:00Z",
    base_tx_count: 100,
    base_volume_usd: 50000,
    base_unique_buyers: 25,
    base_first_tx_at: "2024-01-01T00:00:00Z",
    base_last_tx_at: "2024-06-01T00:00:00Z",
    solana_tx_count: 0,
    solana_volume_usd: 0,
    solana_unique_buyers: 0,
    solana_first_tx_at: null,
    solana_last_tx_at: null,
    reputation_count: 10,
    reputation_avg_score: 85,
    validation_count: 5,
    validation_passed: 4,
    validation_failed: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-06-15T10:00:00Z",
    ...overrides,
  };
}

// Helper to create NextRequest
function createNextRequest(url: string): NextRequest {
  return new NextRequest(new URL(url));
}

describe("/api/agents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("default pagination", () => {
    it("returns list of agents with default pagination", async () => {
      const mockAgents = [
        createMockAgentRow({ id: "agent-1", score: 750 }),
        createMockAgentRow({
          id: "agent-2",
          score: 720,
          base_wallet: "0x1234567890123456789012345678901234567890",
          name: "Second Agent",
        }),
      ];

      mockGetAgentsList.mockResolvedValue(mockAgents);
      mockGetAgentsCount.mockResolvedValue(2);

      const request = createNextRequest("http://localhost:3000/api/agents");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.agents).toHaveLength(2);
      expect(data.data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it("returns empty list when no agents exist", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest("http://localhost:3000/api/agents");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.agents).toEqual([]);
      expect(data.data.pagination.total).toBe(0);
      expect(data.data.pagination.totalPages).toBe(0);
    });
  });

  describe("custom pagination", () => {
    it("respects custom page parameter", async () => {
      const mockAgents = [createMockAgentRow({ id: "agent-3", score: 700 })];

      mockGetAgentsList.mockResolvedValue(mockAgents);
      mockGetAgentsCount.mockResolvedValue(25);

      const request = createNextRequest("http://localhost:3000/api/agents?page=2");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.pagination).toMatchObject({
        page: 2,
        limit: 20,
        total: 25,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      });
      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 20, // (page - 1) * limit = (2-1) * 20
          limit: 20,
        })
      );
    });

    it("respects custom limit parameter", async () => {
      const mockAgents = Array.from({ length: 10 }, (_, i) =>
        createMockAgentRow({ id: `agent-${i}`, score: 700 + i })
      );

      mockGetAgentsList.mockResolvedValue(mockAgents);
      mockGetAgentsCount.mockResolvedValue(50);

      const request = createNextRequest("http://localhost:3000/api/agents?limit=10");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: false,
      });
      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 0,
        })
      );
    });

    it("respects both page and limit parameters", async () => {
      const mockAgents = [createMockAgentRow({ id: "agent-5", score: 650 })];

      mockGetAgentsList.mockResolvedValue(mockAgents);
      mockGetAgentsCount.mockResolvedValue(100);

      const request = createNextRequest(
        "http://localhost:3000/api/agents?page=3&limit=25"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.pagination).toMatchObject({
        page: 3,
        limit: 25,
        total: 100,
        totalPages: 4,
        hasNext: true,
        hasPrev: true,
      });
      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
          offset: 50, // (3-1) * 25
        })
      );
    });
  });

  describe("sorting", () => {
    it("sorts by score by default", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest("http://localhost:3000/api/agents");
      await GET(request);

      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "score",
        })
      );
    });

    it("sorts by volume when specified", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest(
        "http://localhost:3000/api/agents?sort=volume"
      );
      await GET(request);

      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "volume",
        })
      );
    });

    it("sorts by recent when specified", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest(
        "http://localhost:3000/api/agents?sort=recent"
      );
      await GET(request);

      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "recent",
        })
      );
    });
  });

  describe("chain filter", () => {
    it("filters by all chains by default", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest("http://localhost:3000/api/agents");
      await GET(request);

      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: "all",
        })
      );
      expect(mockGetAgentsCount).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: "all",
        })
      );
    });

    it("filters by base chain", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest(
        "http://localhost:3000/api/agents?chain=base"
      );
      await GET(request);

      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: "base",
        })
      );
      expect(mockGetAgentsCount).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: "base",
        })
      );
    });

    it("filters by solana chain", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest(
        "http://localhost:3000/api/agents?chain=solana"
      );
      await GET(request);

      expect(mockGetAgentsList).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: "solana",
        })
      );
      expect(mockGetAgentsCount).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: "solana",
        })
      );
    });
  });

  describe("combined parameters", () => {
    it("handles all parameters together", async () => {
      const mockAgents = [
        createMockAgentRow({
          id: "agent-sol",
          solana_wallet: "DRtqa8fKDHhEYPcMXpXzXqN54HZkFhNLQ6PQAaqrR1qQ",
          base_wallet: null,
          solana_tx_count: 100,
          base_tx_count: 0,
          score: 800,
        }),
      ];

      mockGetAgentsList.mockResolvedValue(mockAgents);
      mockGetAgentsCount.mockResolvedValue(15);

      const request = createNextRequest(
        "http://localhost:3000/api/agents?page=2&limit=10&sort=recent&chain=solana"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 15,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      });
      expect(mockGetAgentsList).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
        sortBy: "recent",
        chain: "solana",
      });
    });
  });

  describe("error cases", () => {
    it("returns 400 for invalid page number (zero)", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/agents?page=0"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid page number (negative)", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/agents?page=-1"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid limit (zero)", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/agents?limit=0"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid limit (negative)", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/agents?limit=-5"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for limit exceeding maximum (100)", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/agents?limit=101"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid sort parameter", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/agents?sort=invalid"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid chain parameter", async () => {
      const request = createNextRequest(
        "http://localhost:3000/api/agents?chain=ethereum"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 500 for database errors", async () => {
      mockGetAgentsList.mockRejectedValue(new Error("Database connection failed"));

      const request = createNextRequest("http://localhost:3000/api/agents");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("response structure", () => {
    it("returns properly formatted agent objects", async () => {
      const mockAgents = [
        createMockAgentRow({
          id: "agent-1",
          name: "Agent One",
          score: 750,
          base_tx_count: 100,
          solana_tx_count: 0,
          base_volume_usd: 50000,
          solana_volume_usd: 0,
          updated_at: "2024-06-15T10:00:00Z",
        }),
        createMockAgentRow({
          id: "agent-2",
          base_wallet: null,
          solana_wallet: "DRtqa8fKDHhEYPcMXpXzXqN54HZkFhNLQ6PQAaqrR1qQ",
          name: "Agent Two",
          score: 800,
          base_tx_count: 50,
          solana_tx_count: 150,
          base_volume_usd: 25000,
          solana_volume_usd: 75000,
          updated_at: "2024-06-14T10:00:00Z",
        }),
      ];

      mockGetAgentsList.mockResolvedValue(mockAgents);
      mockGetAgentsCount.mockResolvedValue(2);

      const request = createNextRequest("http://localhost:3000/api/agents");
      const response = await GET(request);
      const data = await response.json();

      // First agent - base only
      expect(data.data.agents[0]).toMatchObject({
        address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        name: "Agent One",
        score: 750,
        grade: "Very Good",
        totalVolumeUsd: 50000,
        transactionCount: 100,
        chains: ["base"],
        lastActiveAt: "2024-06-15T10:00:00Z",
      });

      // Second agent - multi-chain
      expect(data.data.agents[1]).toMatchObject({
        address: "DRtqa8fKDHhEYPcMXpXzXqN54HZkFhNLQ6PQAaqrR1qQ",
        name: "Agent Two",
        score: 800,
        grade: "Excellent",
        totalVolumeUsd: 100000,
        transactionCount: 200,
        chains: ["base", "solana"],
        lastActiveAt: "2024-06-14T10:00:00Z",
      });
    });

    it("returns complete pagination info", async () => {
      mockGetAgentsList.mockResolvedValue([]);
      mockGetAgentsCount.mockResolvedValue(0);

      const request = createNextRequest("http://localhost:3000/api/agents");
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.pagination).toHaveProperty("page");
      expect(data.data.pagination).toHaveProperty("limit");
      expect(data.data.pagination).toHaveProperty("total");
      expect(data.data.pagination).toHaveProperty("totalPages");
      expect(data.data.pagination).toHaveProperty("hasNext");
      expect(data.data.pagination).toHaveProperty("hasPrev");
      expect(typeof data.data.pagination.hasNext).toBe("boolean");
      expect(typeof data.data.pagination.hasPrev).toBe("boolean");
    });

    it("correctly calculates totalPages", async () => {
      mockGetAgentsList.mockResolvedValue([]);

      // 100 total, limit 20 = 5 pages
      mockGetAgentsCount.mockResolvedValue(100);
      let request = createNextRequest("http://localhost:3000/api/agents?limit=20");
      let response = await GET(request);
      let data = await response.json();
      expect(data.data.pagination.totalPages).toBe(5);

      // 95 total, limit 20 = 5 pages (ceiling)
      mockGetAgentsCount.mockResolvedValue(95);
      request = createNextRequest("http://localhost:3000/api/agents?limit=20");
      response = await GET(request);
      data = await response.json();
      expect(data.data.pagination.totalPages).toBe(5);

      // 40 total, limit 50 = 1 page
      mockGetAgentsCount.mockResolvedValue(40);
      request = createNextRequest("http://localhost:3000/api/agents?limit=50");
      response = await GET(request);
      data = await response.json();
      expect(data.data.pagination.totalPages).toBe(1);
    });
  });
});
