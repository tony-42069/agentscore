import { describe, it, expect } from "vitest";
import { BaseX402Reader } from "../base";
import { SolanaX402Reader } from "../solana";

describe("Transaction Parsing", () => {
  describe("BaseX402Reader", () => {
    it("can be instantiated", () => {
      const reader = new BaseX402Reader({
        rpcUrl: process.env.BASE_RPC_URL,
      });
      expect(reader).toBeDefined();
    });

    it("has required methods", () => {
      const reader = new BaseX402Reader({});
      expect(typeof reader.getAgentMetrics).toBe("function");
      expect(typeof reader.getRecentTransactions).toBe("function");
      expect(typeof reader.getMetricsFromCDP).toBe("function");
    });
  });

  describe("SolanaX402Reader", () => {
    it("can be instantiated", () => {
      const reader = new SolanaX402Reader({
        rpcUrl: process.env.SOLANA_RPC_URL,
      });
      expect(reader).toBeDefined();
    });

    it("has required methods", () => {
      const reader = new SolanaX402Reader({});
      expect(typeof reader.getAgentMetrics).toBe("function");
      expect(typeof reader.getRecentTransactions).toBe("function");
      expect(typeof reader.getMetricsFromCDP).toBe("function");
    });
  });
});
