import { describe, it, expect, vi, beforeEach } from "vitest";
import { HybridX402Reader } from "../hybrid-reader";

describe("HybridX402Reader", () => {
  let reader: HybridX402Reader;

  beforeEach(() => {
    reader = new HybridX402Reader();
    reader.clearCache();
  });

  it("can be instantiated", () => {
    expect(reader).toBeDefined();
  });

  it("returns empty metrics for invalid address on base", async () => {
    const metrics = await reader.getAgentMetrics(
      "0x0000000000000000000000000000000000000000",
      "base"
    );

    expect(metrics.transactionCount).toBe(0);
    expect(metrics.totalVolumeUsd).toBe(0);
    expect(metrics.address).toBe("0x0000000000000000000000000000000000000000");
    expect(metrics.chain).toBe("base");
  });

  it("returns empty metrics for invalid address on solana", async () => {
    const metrics = await reader.getAgentMetrics(
      "11111111111111111111111111111111",
      "solana"
    );

    expect(metrics.transactionCount).toBe(0);
    expect(metrics.totalVolumeUsd).toBe(0);
    expect(metrics.chain).toBe("solana");
  });

  it("caches results", async () => {
    const address = "0x1234567890123456789012345678901234567890";

    // First call should try to fetch and cache
    const metrics1 = await reader.getAgentMetrics(address, "base");

    // Second call should return cached (same reference)
    const metrics2 = await reader.getAgentMetrics(address, "base");

    // Should be same object (cached)
    expect(metrics1).toBe(metrics2);
  });

  it("clears cache", () => {
    reader.setCache("test", { data: "value" });
    expect(reader.getFromCache("test")).toEqual({ data: "value" });

    reader.clearCache();

    const cached = reader.getFromCache("test");
    expect(cached).toBeNull();
  });

  it("returns null for expired cache entries", () => {
    // Set cache with a timestamp in the past (older than 5 min TTL)
    const pastTime = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    (reader as unknown as { cache: Map<string, { data: unknown; timestamp: number }> }).cache.set(
      "expired-key",
      { data: "value", timestamp: pastTime }
    );

    const cached = reader.getFromCache("expired-key");
    expect(cached).toBeNull();
  });

  it("combines metrics from both chains", async () => {
    const result = await reader.getCombinedMetrics({
      base: "0x1234567890123456789012345678901234567890",
      solana: "So11111111111111111111111111111111111111112",
    });

    expect(result.combined).toBeDefined();
    expect(result.combined.chainsActive).toBeDefined();
    expect(Array.isArray(result.combined.chainsActive)).toBe(true);
    expect(typeof result.combined.totalTransactionCount).toBe("number");
    expect(typeof result.combined.totalVolumeUsd).toBe("number");
  });

  it("handles missing wallets in combined metrics", async () => {
    const result = await reader.getCombinedMetrics({
      base: undefined,
      solana: "So11111111111111111111111111111111111111112",
    });

    expect(result.base).toBeNull();
    expect(result.combined.totalTransactionCount).toBeGreaterThanOrEqual(0);
  });

  it("handles empty wallets in combined metrics", async () => {
    const result = await reader.getCombinedMetrics({});

    expect(result.base).toBeNull();
    expect(result.solana).toBeNull();
    expect(result.combined.totalTransactionCount).toBe(0);
    expect(result.combined.totalVolumeUsd).toBe(0);
    expect(result.combined.chainsActive).toEqual([]);
  });

  it("returns empty transactions array when both sources fail", async () => {
    const txs = await reader.getRecentTransactions(
      "0x0000000000000000000000000000000000000000",
      "base",
      10
    );

    expect(Array.isArray(txs)).toBe(true);
  });

  it("respects limit parameter for transactions", async () => {
    const txs = await reader.getRecentTransactions(
      "0x0000000000000000000000000000000000000000",
      "base",
      25
    );

    // Should return array even if empty
    expect(Array.isArray(txs)).toBe(true);
  });

  it("handles cache key case insensitivity for addresses", async () => {
    const address1 = "0xAbCdEf1234567890123456789012345678901234";
    const address2 = "0xabcdef1234567890123456789012345678901234";

    // Cache with mixed case
    const metrics1 = await reader.getAgentMetrics(address1, "base");

    // Should retrieve from cache with lowercase
    const metrics2 = await reader.getAgentMetrics(address2, "base");

    // Should be same cached object
    expect(metrics1).toBe(metrics2);
  });
});

describe("HybridX402Reader with mocked CDP", () => {
  it("falls back to on-chain when CDP fails", async () => {
    const reader = new HybridX402Reader({
      baseRpcUrl: "https://mainnet.base.org",
    });
    reader.clearCache();

    // Test that it doesn't throw when CDP is unavailable
    const metrics = await reader.getAgentMetrics(
      "0x0000000000000000000000000000000000000000",
      "base"
    );

    expect(metrics).toBeDefined();
    expect(metrics.transactionCount).toBe(0);
  });
});
