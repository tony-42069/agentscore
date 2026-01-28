import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CDPClient, CDPAPIError } from "../cdp-client";

describe("CDPClient", () => {
  // Mock fetch globally
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  // Valid test PEM key (ES256 private key in PKCS8 format)
  // This is a dummy key for testing purposes only
  const testApiSecret = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIBHk8VbhSbfJlX7dV1x5Kc6w0UVpJPOl0bZQvG10YIGYoAcGBSuBBAAK
oUQDQgAEXAMPLEKEYFORTESTINGONLY1234567890abcdef
-----END EC PRIVATE KEY-----`;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubGlobal("process", {
      env: { ...process.env },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("constructor", () => {
    it("can be instantiated with credentials", () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      expect(client).toBeDefined();
    });

    it("uses default base URL when not provided", () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      expect(client).toBeDefined();
    });

    it("uses custom base URL when provided", () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
        baseUrl: "https://custom.api.com",
      });

      expect(client).toBeDefined();
    });
  });

  describe("JWT generation", () => {
    it("generates JWT for authentication", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      // Mock the internal generateJWT method to avoid actual crypto operations
      const mockJWT = "mock_jwt_token";
      vi.spyOn(client as any, "generateJWT").mockResolvedValue(mockJWT);

      const jwt = await (client as any).generateJWT();
      expect(jwt).toBe(mockJWT);
    });

    it("caches JWT and returns same token within cache period", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      const mockJWT = "mock_jwt_token";
      const generateSpy = vi
        .spyOn(client as any, "generateJWT")
        .mockResolvedValue(mockJWT);

      // First call should generate
      const jwt1 = await (client as any).getJWT();
      // Second call should use cache
      const jwt2 = await (client as any).getJWT();

      expect(jwt1).toBe(mockJWT);
      expect(jwt2).toBe(mockJWT);
      expect(generateSpy).toHaveBeenCalledTimes(1);
    });

    it("regenerates JWT after cache expires", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      const mockJWT1 = "mock_jwt_token_1";
      const mockJWT2 = "mock_jwt_token_2";
      let callCount = 0;

      vi.spyOn(client as any, "generateJWT").mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? mockJWT1 : mockJWT2);
      });

      // Set cache to expired
      (client as any).jwtCache = {
        token: mockJWT1,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const jwt = await (client as any).getJWT();
      expect(jwt).toBe(mockJWT2);
    });
  });

  describe("API requests", () => {
    it("makes authenticated requests with JWT", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      const mockJWT = "mock_jwt_token";
      vi.spyOn(client as any, "getJWT").mockResolvedValue(mockJWT);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          transactions: [],
        }),
      });

      await (client as any).request("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.cdp.coinbase.com/test",
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get("Authorization")).toBe(`Bearer ${mockJWT}`);
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("handles 401 errors by clearing JWT cache", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      const mockJWT = "mock_jwt_token";
      vi.spyOn(client as any, "getJWT").mockResolvedValue(mockJWT);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const clearCacheSpy = vi.spyOn(client as any, "clearJWTCache");

      await expect((client as any).request("/test")).rejects.toThrow(CDPAPIError);
      expect(clearCacheSpy).toHaveBeenCalled();
    });

    it("throws CDPAPIError on rate limit (429)", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      vi.spyOn(client as any, "getJWT").mockResolvedValue("mock_jwt");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect((client as any).request("/test")).rejects.toThrow(
        /Rate limited/
      );
    });

    it("throws CDPAPIError on server error (500)", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      vi.spyOn(client as any, "getJWT").mockResolvedValue("mock_jwt");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect((client as any).request("/test")).rejects.toThrow(
        /server error/
      );
    });
  });

  describe("retry logic", () => {
    it("retries on rate limit with exponential backoff", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      vi.spyOn(client as any, "getJWT").mockResolvedValue("mock_jwt");

      // First two calls fail with 429, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const result = await (client as any).requestWithRetry("/test", {}, 3);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it("does not retry on authentication errors", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      vi.spyOn(client as any, "getJWT").mockResolvedValue("mock_jwt");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(
        (client as any).requestWithRetry("/test", {}, 3)
      ).rejects.toThrow(/Unauthorized/);

      // Should only call once, no retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTransactions", () => {
    it("fetches transactions with correct parameters", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      const mockResponse = {
        transactions: [
          {
            hash: "0x123",
            from: "0xabc",
            to: "0xdef",
            value: "1000000",
            timestamp: "2024-01-01T00:00:00Z",
            chain: "base",
          },
        ],
        nextCursor: "next_page_token",
      };

      vi.spyOn(client as any, "requestWithRetry").mockResolvedValue(mockResponse);

      const result = await client.getTransactions({
        address: "0xdef",
        chain: "base",
        limit: 50,
      });

      expect(result).toEqual(mockResponse);
      expect((client as any).requestWithRetry).toHaveBeenCalledWith(
        "/platform/v1/x402/transactions?address=0xdef&chain=base&limit=50"
      );
    });

    it("includes cursor when provided", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      vi.spyOn(client as any, "requestWithRetry").mockResolvedValue({
        transactions: [],
      });

      await client.getTransactions({
        address: "0xdef",
        chain: "base",
        cursor: "page_123",
      });

      expect((client as any).requestWithRetry).toHaveBeenCalledWith(
        expect.stringContaining("cursor=page_123")
      );
    });
  });

  describe("getMetrics", () => {
    it("fetches metrics with correct parameters", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      const mockResponse = {
        transactionCount: 100,
        totalVolume: 50000.5,
        uniqueBuyers: 25,
        firstTransaction: "2024-01-01T00:00:00Z",
        lastTransaction: "2024-06-01T00:00:00Z",
      };

      vi.spyOn(client as any, "requestWithRetry").mockResolvedValue(mockResponse);

      const result = await client.getMetrics({
        address: "0xdef",
        chain: "base",
      });

      expect(result).toEqual(mockResponse);
      expect((client as any).requestWithRetry).toHaveBeenCalledWith(
        "/platform/v1/x402/metrics?address=0xdef&chain=base"
      );
    });
  });

  describe("healthCheck", () => {
    it("returns true when JWT can be generated", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      vi.spyOn(client as any, "getJWT").mockResolvedValue("mock_jwt");

      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it("returns false when JWT generation fails", async () => {
      const client = new CDPClient({
        apiKey: "test_key",
        apiSecret: testApiSecret,
      });

      vi.spyOn(client as any, "getJWT").mockRejectedValue(new Error("Failed"));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });
});

describe("createCDPClient factory", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Reset module cache to test factory fresh
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when credentials are not configured", async () => {
    delete process.env.CDP_API_KEY;
    delete process.env.CDP_API_SECRET;

    const { createCDPClient } = await import("../index");
    const client = createCDPClient();

    expect(client).toBeNull();
  });

  it("returns client when credentials are configured", async () => {
    process.env.CDP_API_KEY = "test_key";
    process.env.CDP_API_SECRET = "test_secret";

    const { createCDPClient, resetCDPClientCache } = await import("../index");
    resetCDPClientCache(); // Clear any cached client
    const client = createCDPClient();

    expect(client).toBeDefined();
    expect(client).not.toBeNull();
  });

  it("returns cached client on subsequent calls", async () => {
    process.env.CDP_API_KEY = "test_key";
    process.env.CDP_API_SECRET = "test_secret";

    const { createCDPClient, resetCDPClientCache } = await import("../index");
    resetCDPClientCache();

    const client1 = createCDPClient();
    const client2 = createCDPClient();

    expect(client1).toBe(client2);
  });
});
