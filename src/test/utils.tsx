import React from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { AgentData } from "@/lib/scoring/types";

/**
 * Render helper with providers (if needed)
 */
export function renderWithProviders(ui: React.ReactElement) {
  return render(ui);
}

/**
 * Create mock agent data for testing
 */
export function createMockAgentData(overrides?: Partial<AgentData>): AgentData {
  return {
    erc8004AgentId: undefined,
    baseWallet: "0x1234567890123456789012345678901234567890",
    solanaWallet: undefined,
    name: "Test Agent",
    baseTxCount: 100,
    baseVolumeUsd: 50000,
    baseUniqueBuyers: 25,
    baseFirstTxAt: new Date("2024-06-01"),
    baseLastTxAt: new Date("2025-01-28"),
    solanaTxCount: 0,
    solanaVolumeUsd: 0,
    solanaUniqueBuyers: 0,
    solanaFirstTxAt: null,
    solanaLastTxAt: null,
    reputationCount: 10,
    reputationAvgScore: 85,
    validationCount: 2,
    validationPassed: 2,
    validationFailed: 0,
    ...overrides,
  };
}

/**
 * Create mock feedback entry for testing
 */
export function createMockFeedbackEntry(overrides?: any) {
  return {
    clientAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    value: 87n,
    valueDecimals: 0,
    tag1: "starred",
    tag2: "",
    isRevoked: false,
    humanReadableValue: 87,
    displayValue: "87",
    unit: "stars",
    ...overrides,
  };
}

/**
 * Mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          range: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null })),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  };
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock blockchain responses
 */
export function mockBlockchainResponses() {
  return {
    blockNumber: 12345678n,
    balance: 1000000000000000000n, // 1 ETH
    transactionCount: 42,
  };
}
