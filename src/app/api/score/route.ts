import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateScore } from "@/lib/scoring";
import { aggregateAgentData, detectChain } from "@/lib/data/aggregator";
import { isValidAddress } from "@/lib/utils/addresses";
import { getAgentWithCache, upsertAgent, logScoreQuery } from "@/lib/db/queries";

const querySchema = z.object({
  address: z.string().min(1),
  chain: z.enum(["base", "solana", "auto"]).optional().default("auto"),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      address: searchParams.get("address"),
      chain: searchParams.get("chain") || "auto",
    });

    // Validate address
    if (!isValidAddress(query.address)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ADDRESS",
            message:
              "The provided address is not a valid Base or Solana address",
          },
        },
        { status: 400 }
      );
    }

    // Detect chain if auto
    const chain =
      query.chain === "auto" ? detectChain(query.address) : query.chain;

    if (chain === "unknown") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNKNOWN_CHAIN",
            message: "Could not detect chain from address format",
          },
        },
        { status: 400 }
      );
    }

    // Check cache first
    let cached = false;
    try {
      const cacheResult = await getAgentWithCache(query.address, chain);
      if (cacheResult) {
        const responseTimeMs = Date.now() - startTime;

        // Log the query
        logScoreQuery({
          agentAddress: query.address,
          agentChain: chain,
          queryType: "score",
          responseScore: cacheResult.agent.score || undefined,
          responseTimeMs,
        }).catch(console.warn);

        return NextResponse.json({
          success: true,
          data: {
            address: query.address,
            chain,
            score: cacheResult.agent.score,
            grade: getGrade(cacheResult.agent.score || 300),
            reasonCodes: cacheResult.agent.reason_codes || [],
            calculatedAt: cacheResult.agent.score_calculated_at,
            cached: true,
          },
        });
      }
    } catch (error) {
      // Cache lookup failed, continue with fresh calculation
      console.warn("Cache lookup failed:", error);
    }

    // Aggregate data from all sources
    const agentData = await aggregateAgentData(query.address, chain);

    // Calculate score
    const result = calculateScore(agentData);

    // Save to database (async, don't block response)
    upsertAgent(
      query.address,
      chain,
      {
        name: agentData.name,
        erc8004_agent_id: agentData.erc8004AgentId,
        base_wallet: agentData.baseWallet,
        solana_wallet: agentData.solanaWallet,
        base_tx_count: agentData.baseTxCount,
        base_volume_usd: agentData.baseVolumeUsd,
        base_unique_buyers: agentData.baseUniqueBuyers,
        base_first_tx_at: agentData.baseFirstTxAt?.toISOString() || null,
        base_last_tx_at: agentData.baseLastTxAt?.toISOString() || null,
        solana_tx_count: agentData.solanaTxCount,
        solana_volume_usd: agentData.solanaVolumeUsd,
        solana_unique_buyers: agentData.solanaUniqueBuyers,
        solana_first_tx_at: agentData.solanaFirstTxAt?.toISOString() || null,
        solana_last_tx_at: agentData.solanaLastTxAt?.toISOString() || null,
        reputation_count: agentData.reputationCount,
        reputation_avg_score: agentData.reputationAvgScore,
        validation_count: agentData.validationCount,
        validation_passed: agentData.validationPassed,
        validation_failed: agentData.validationFailed,
      },
      result
    ).catch(console.warn);

    const responseTimeMs = Date.now() - startTime;

    // Log the query
    logScoreQuery({
      agentAddress: query.address,
      agentChain: chain,
      queryType: "score",
      responseScore: result.score,
      responseTimeMs,
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      data: {
        address: query.address,
        chain,
        score: result.score,
        grade: result.grade,
        reasonCodes: result.reasonCodes,
        calculatedAt: result.calculatedAt.toISOString(),
        cached: false,
      },
    });
  } catch (error) {
    console.error("Score API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

function getGrade(
  score: number
): "Excellent" | "Very Good" | "Good" | "Fair" | "Poor" {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}
