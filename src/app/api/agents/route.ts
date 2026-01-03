import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAgentsList, getAgentsCount, agentRowToApiFormat } from "@/lib/db/queries";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["score", "volume", "recent"]).default("score"),
  chain: z.enum(["base", "solana", "all"]).default("all"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      sort: searchParams.get("sort") || "score",
      chain: searchParams.get("chain") || "all",
    });

    const offset = (query.page - 1) * query.limit;

    const [agents, total] = await Promise.all([
      getAgentsList({
        limit: query.limit,
        offset,
        sortBy: query.sort,
        chain: query.chain,
      }),
      getAgentsCount({ chain: query.chain }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json({
      success: true,
      data: {
        agents: agents.map(agentRowToApiFormat),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Agents API error:", error);

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
