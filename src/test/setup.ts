import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.BASE_RPC_URL = "https://base-sepolia.g.alchemy.com/v2/test";
process.env.SOLANA_RPC_URL = "https://api.testnet.solana.com";
process.env.ERC8004_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
process.env.ERC8004_REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
process.env.ERC8004_VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

// Mock fetch globally
global.fetch = vi.fn();

// Mock console methods in test environment to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  // Filter out expected errors in tests
  const message = args[0]?.toString() || "";
  if (
    message.includes("React does not recognize") ||
    message.includes("Warning:") ||
    message.includes("act(...)")
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || "";
  if (
    message.includes("Warning:") ||
    message.includes("ReactDOM.render")
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
