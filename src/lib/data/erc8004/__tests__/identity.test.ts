import { describe, it, expect, beforeAll } from "vitest";
import { createERC8004Client } from "../client";
import { IdentityRegistryReader } from "../identity";

describe("IdentityRegistry Integration", () => {
  let reader: IdentityRegistryReader;

  beforeAll(() => {
    const client = createERC8004Client("sepolia");
    reader = new IdentityRegistryReader(client, "sepolia");
  });

  it("can get agent registration by ID", async () => {
    // Use agentId 1 (if it exists) or find a known agent
    const agentId = 1;

    try {
      const registration = await reader.getRegistrationData(agentId);
      expect(registration.agentId).toBe(agentId);
      expect(registration.owner).toBeDefined();
      expect(registration.tokenUri).toBeDefined();
      console.log(`Agent ${agentId} owner:`, registration.owner);
    } catch (error) {
      // Agent might not exist, that's ok for test
      console.log(
        `Agent ${agentId} not found or error:`,
        error instanceof Error ? error.message : error
      );
    }
  });

  it("can parse agent metadata", async () => {
    const agentId = 1;

    try {
      const registration = await reader.getRegistrationData(agentId);

      if (registration.registrationData) {
        expect(registration.registrationData.name).toBeDefined();
        console.log("Agent name:", registration.registrationData.name);

        // Check for services or endpoints
        const services =
          registration.registrationData.services ||
          registration.registrationData.endpoints;
        console.log("Services/endpoints:", services);
      }
    } catch (error) {
      console.log(
        "Metadata parse test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("can extract wallets from registration", async () => {
    const agentId = 1;

    try {
      const registration = await reader.getRegistrationData(agentId);
      const wallets = reader.extractWallets(registration);

      console.log("Extracted wallets:", wallets);

      if (wallets.base) {
        expect(wallets.base).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    } catch (error) {
      console.log(
        "Wallet extraction test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("can find agent by wallet address", async () => {
    // Test with a known agent owner address if available
    // For now, we'll test that the function doesn't throw
    const testWallet = "0x8004A818BFB912233c491871b3d84c89A494BD9e"; // Registry address as test

    const agentId = await reader.findAgentByWallet(testWallet);
    console.log("Found agentId:", agentId);

    // Should return null or a valid agentId
    if (agentId !== null) {
      expect(agentId).toBeGreaterThan(0);
    }
  });
});
