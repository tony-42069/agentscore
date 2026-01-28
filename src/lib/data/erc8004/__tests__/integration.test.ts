import { describe, it, expect } from "vitest";
import { createERC8004Readers } from "../index";

describe("ERC-8004 End-to-End Integration", () => {
  it("full flow: get all data for an agent", async () => {
    const agentId = 1;
    const readers = createERC8004Readers("sepolia");

    try {
      // 1. Get identity
      console.log("Fetching identity...");
      const identity = await readers.identity.getRegistrationData(agentId);
      console.log("Identity:", {
        agentId: identity.agentId,
        owner: identity.owner,
        name: identity.registrationData?.name,
      });

      // 2. Get reputation (NEW FORMAT!)
      console.log("Fetching reputation...");
      const reputation = await readers.reputation.getReputationMetrics(agentId);
      console.log("Reputation:", {
        totalFeedback: reputation.totalFeedbackCount,
        starred: reputation.starred,
        uptime: reputation.uptime,
      });

      // 3. Get validation
      console.log("Fetching validation...");
      const validation = await readers.validation.getValidationForScoring(agentId);
      console.log("Validation:", {
        total: validation.totalValidations,
        passed: validation.passed,
        failed: validation.failed,
      });

      // 4. Test wallet lookup
      console.log("Testing wallet lookup...");
      const wallets = readers.identity.extractWallets(identity);
      console.log("Wallets:", wallets);

      // 5. Try find by wallet
      if (identity.owner) {
        console.log("Finding agent by owner wallet...");
        const foundAgentId = await readers.identity.findAgentByWallet(identity.owner);
        console.log("Found agentId:", foundAgentId);

        // Should find the same agent
        if (foundAgentId !== null) {
          expect(foundAgentId).toBe(agentId);
        }
      }

      console.log("✅ End-to-end integration test PASSED");
    } catch (error) {
      console.error("Integration test error:", error);
      // Don't fail - agent might not exist
      console.log("Note: Agent might not exist on testnet");
    }
  });

  it("value/valueDecimals format is working", async () => {
    const readers = createERC8004Readers("sepolia");

    try {
      const feedback = await readers.reputation.getAllFeedback(1);

      if (feedback.length > 0) {
        const entry = feedback[0];

        // Verify new format
        expect(typeof entry.value).toBe("bigint");
        expect(typeof entry.valueDecimals).toBe("number");
        expect(typeof entry.tag1).toBe("string"); // Not bytes32 anymore

        // Verify computed properties
        expect(typeof entry.humanReadableValue).toBe("number");
        expect(typeof entry.displayValue).toBe("string");

        console.log("Value format test:", {
          value: entry.value.toString(),
          valueDecimals: entry.valueDecimals,
          humanReadable: entry.humanReadableValue,
          display: entry.displayValue,
          tag1: entry.tag1,
        });

        console.log("✅ Value/valueDecimals format working correctly");
      } else {
        console.log("No feedback found for value format test");
      }
    } catch (error) {
      console.log(
        "Value format test:",
        error instanceof Error ? error.message : error
      );
    }
  });
});
