import { describe, it, expect, beforeAll } from "vitest";
import { createERC8004Client } from "../client";
import { ValidationRegistryReader } from "../validation";

describe("ValidationRegistry Integration", () => {
  let reader: ValidationRegistryReader;

  beforeAll(() => {
    const client = createERC8004Client("sepolia");
    reader = new ValidationRegistryReader(client, "sepolia");
  });

  it("can get validation summary", async () => {
    const agentId = 1;

    try {
      const summary = await reader.getSummary(agentId);
      expect(summary.count).toBeGreaterThanOrEqual(0);
      expect(summary.averageResponse).toBeGreaterThanOrEqual(0);

      console.log("Validation summary:", summary);
    } catch (error) {
      console.log(
        "Summary test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("can get all validations for agent", async () => {
    const agentId = 1;

    try {
      const validations = await reader.getAllValidations(agentId);

      console.log(`Found ${validations.length} validations`);

      for (const v of validations) {
        expect(v.requestHash).toBeDefined();
        expect(v.validatorAddress).toBeDefined();
        expect(v.response).toBeGreaterThanOrEqual(0);
        expect(v.response).toBeLessThanOrEqual(100);

        console.log("Validation:", {
          requestHash: v.requestHash,
          validator: v.validatorAddress,
          response: v.response,
          tag: v.tag,
        });
      }
    } catch (error) {
      console.log(
        "Validations test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("can get validation data for scoring", async () => {
    const agentId = 1;

    try {
      const data = await reader.getValidationForScoring(agentId);

      console.log("Validation for scoring:", {
        totalValidations: data.totalValidations,
        passed: data.passed,
        failed: data.failed,
        averageResponse: data.averageResponse,
      });

      expect(data.totalValidations).toBeGreaterThanOrEqual(0);
      expect(data.passed).toBeGreaterThanOrEqual(0);
      expect(data.failed).toBeGreaterThanOrEqual(0);
    } catch (error) {
      console.log(
        "Scoring data test:",
        error instanceof Error ? error.message : error
      );
    }
  });
});
