import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateScore } from "@/lib/scoring";
import {
  aggregateAgentData,
  detectChain,
  getAgentIdentity,
} from "@/lib/data/aggregator";
import { isValidAddress } from "@/lib/utils/addresses";
import { getScoreHistory, logScoreQuery } from "@/lib/db/queries";

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

    if (!isValidAddress(query.address)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ADDRESS",
            message: "Invalid address",
          },
        },
        { status: 400 }
      );
    }

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

    // Get identity info (from ERC-8004 if available)
    const identity = await getAgentIdentity(query.address);

    // Aggregate all data
    const agentData = await aggregateAgentData(query.address, chain);

    // Calculate score
    const scoreResult = calculateScore(agentData);

    // Get score history
    let history: Array<{ date: string; score: number }> = [];
    try {
      history = await getScoreHistory(query.address);
    } catch {
      // History fetch failed, continue without it
    }

    const responseTimeMs = Date.now() - startTime;

    // Log the query
    logScoreQuery({
      agentAddress: query.address,
      agentChain: chain,
      queryType: "report",
      responseScore: scoreResult.score,
      responseTimeMs,
    }).catch(console.warn);

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        agent: {
          address: query.address,
          name: identity?.name || agentData.name || null,
          description: identity?.description || null,
          imageUrl: identity?.imageUrl || null,
          erc8004AgentId: identity?.agentId || agentData.erc8004AgentId || null,
          wallets: {
            base: agentData.baseWallet || null,
            solana: agentData.solanaWallet || null,
          },
          registeredAt: identity?.registeredAt || null,
        },
        score: {
          value: scoreResult.score,
          grade: scoreResult.grade,
          breakdown: scoreResult.breakdown,
          reasonCodes: scoreResult.reasonCodes,
        },
        metrics: {
          base: {
            transactionCount: agentData.baseTxCount,
            volumeUsd: agentData.baseVolumeUsd,
            uniqueBuyers: agentData.baseUniqueBuyers,
            firstTransactionAt: agentData.baseFirstTxAt?.toISOString() || null,
            lastTransactionAt: agentData.baseLastTxAt?.toISOString() || null,
          },
          solana: {
            transactionCount: agentData.solanaTxCount,
            volumeUsd: agentData.solanaVolumeUsd,
            uniqueBuyers: agentData.solanaUniqueBuyers,
            firstTransactionAt:
              agentData.solanaFirstTxAt?.toISOString() || null,
            lastTransactionAt: agentData.solanaLastTxAt?.toISOString() || null,
          },
        },
        reputation: {
          feedbackCount: agentData.reputationCount,
          averageScore: agentData.reputationAvgScore,
        },
        validation: {
          totalValidations: agentData.validationCount,
          passed: agentData.validationPassed,
          failed: agentData.validationFailed,
        },
        history,
        calculatedAt: scoreResult.calculatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Report API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
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
