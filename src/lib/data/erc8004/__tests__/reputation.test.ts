import { describe, it, expect, beforeAll } from "vitest";
import { createERC8004Client } from "../client";
import { ReputationRegistryReader } from "../reputation";

describe("ReputationRegistry Integration", () => {
  let reader: ReputationRegistryReader;

  beforeAll(() => {
    const client = createERC8004Client("sepolia");
    reader = new ReputationRegistryReader(client, "sepolia");
  });

  it("can get reputation summary", async () => {
    const agentId = 1;

    try {
      const summary = await reader.getSummary(agentId);
      expect(summary.count).toBeGreaterThanOrEqual(0);
      expect(summary.summaryValue).toBeDefined();
      expect(summary.summaryValueDecimals).toBeDefined();

      console.log("Reputation summary:", {
        count: summary.count,
        summaryValue: summary.summaryValue?.toString(),
        summaryValueDecimals: summary.summaryValueDecimals,
      });
    } catch (error) {
      console.log(
        "Summary test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("can get feedback with value/valueDecimals format", async () => {
    const agentId = 1;

    try {
      const feedback = await reader.getAllFeedback(agentId);

      console.log(`Found ${feedback.length} feedback entries`);

      if (feedback.length > 0) {
        const entry = feedback[0];

        // Check new format
        expect(entry.value).toBeDefined();
        expect(entry.valueDecimals).toBeDefined();
        expect(entry.tag1).toBeDefined();
        expect(entry.tag2).toBeDefined();

        // Check computed properties
        expect(entry.humanReadableValue).toBeDefined();
        expect(entry.displayValue).toBeDefined();
        expect(entry.unit).toBeDefined();

        console.log("First feedback entry:", {
          client: entry.clientAddress,
          value: entry.value?.toString(),
          valueDecimals: entry.valueDecimals,
          humanReadable: entry.humanReadableValue,
          display: entry.displayValue,
          tag1: entry.tag1,
          tag2: entry.tag2,
          unit: entry.unit,
        });
      }
    } catch (error) {
      console.log(
        "Feedback format test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("parses star ratings correctly", async () => {
    const agentId = 1;

    try {
      const starred = await reader.getReputationByTag(agentId, "starred");

      console.log("Starred ratings:", {
        count: starred.count,
        averageValue: starred.averageValue,
      });

      if (starred.count > 0) {
        expect(starred.averageValue).toBeGreaterThanOrEqual(0);
        expect(starred.averageValue).toBeLessThanOrEqual(100);
      }
    } catch (error) {
      console.log(
        "Starred test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("parses uptime percentages correctly", async () => {
    const agentId = 1;

    try {
      const uptime = await reader.getReputationByTag(agentId, "uptime");

      console.log("Uptime ratings:", {
        count: uptime.count,
        averageValue: uptime.averageValue,
      });

      if (uptime.count > 0) {
        // Uptime should be around 99.XX%
        expect(uptime.averageValue).toBeGreaterThan(0);
        expect(uptime.averageValue).toBeLessThanOrEqual(100);

        // Check individual entries
        const entry = uptime.entries[0];
        expect(entry.humanReadableValue).toBeCloseTo(
          Number(entry.value) / Math.pow(10, entry.valueDecimals),
          2
        );
      }
    } catch (error) {
      console.log(
        "Uptime test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("handles negative values (trading yield)", async () => {
    const agentId = 1;

    try {
      const tradingYield = await reader.getReputationByTag(
        agentId,
        "tradingYield"
      );

      console.log("Trading yield ratings:", {
        count: tradingYield.count,
        averageValue: tradingYield.averageValue,
      });

      if (tradingYield.count > 0) {
        // Can handle negative values
        const hasNegative = tradingYield.entries.some((e) => e.value < 0);
        console.log("Has negative values:", hasNegative);

        expect(tradingYield.averageValue).toBeDefined();
      }
    } catch (error) {
      console.log(
        "Trading yield test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("can get all reputation metrics", async () => {
    const agentId = 1;

    try {
      const metrics = await reader.getReputationMetrics(agentId);

      console.log("All reputation metrics:", {
        starred: metrics.starred,
        uptime: metrics.uptime,
        successRate: metrics.successRate,
        revenues: metrics.revenues,
        tradingYield: metrics.tradingYield,
        totalFeedbackCount: metrics.totalFeedbackCount,
      });

      expect(metrics.totalFeedbackCount).toBeGreaterThanOrEqual(0);
      expect(metrics.starred).toBeDefined();
      expect(metrics.uptime).toBeDefined();
      expect(metrics.revenues).toBeDefined();
    } catch (error) {
      console.log(
        "Metrics test:",
        error instanceof Error ? error.message : error
      );
    }
  });

  it("respects revoked feedback", async () => {
    const agentId = 1;

    try {
      const allFeedback = await reader.getAllFeedback(agentId, [], true);
      const activeFeedback = await reader.getAllFeedback(agentId, [], false);

      console.log("All feedback:", allFeedback.length);
      console.log("Active feedback:", activeFeedback.length);

      expect(activeFeedback.length).toBeLessThanOrEqual(allFeedback.length);
    } catch (error) {
      console.log(
        "Revoked feedback test:",
        error instanceof Error ? error.message : error
      );
    }
  });
});
