import { getSupabaseAdmin } from "./client";
import type { ScoreResult, ScoreGrade } from "../scoring/types";

export interface AgentRow {
  id: string;
  erc8004_agent_id: number | null;
  base_wallet: string | null;
  solana_wallet: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  registration_uri: string | null;
  score: number | null;
  score_breakdown: Record<string, unknown> | null;
  reason_codes: string[] | null;
  score_calculated_at: string | null;
  base_tx_count: number;
  base_volume_usd: number;
  base_unique_buyers: number;
  base_first_tx_at: string | null;
  base_last_tx_at: string | null;
  solana_tx_count: number;
  solana_volume_usd: number;
  solana_unique_buyers: number;
  solana_first_tx_at: string | null;
  solana_last_tx_at: string | null;
  reputation_count: number;
  reputation_avg_score: number;
  validation_count: number;
  validation_passed: number;
  validation_failed: number;
  created_at: string;
  updated_at: string;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Find agent by wallet address
 */
export async function findAgentByAddress(
  address: string,
  chain: "base" | "solana"
): Promise<AgentRow | null> {
  const supabase = getSupabaseAdmin();
  const column = chain === "base" ? "base_wallet" : "solana_wallet";

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq(column, address.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as AgentRow;
}

/**
 * Check if cached score is still valid
 */
export async function getAgentWithCache(
  address: string,
  chain: "base" | "solana"
): Promise<{ agent: AgentRow; cached: boolean } | null> {
  const agent = await findAgentByAddress(address, chain);

  if (agent && agent.score_calculated_at) {
    const calculatedAt = new Date(agent.score_calculated_at);
    const age = Date.now() - calculatedAt.getTime();

    if (age < CACHE_TTL_MS) {
      return { agent, cached: true };
    }
  }

  return null;
}

/**
 * Upsert agent data and score
 */
export async function upsertAgent(
  address: string,
  chain: "base" | "solana",
  agentData: Partial<AgentRow>,
  scoreResult: ScoreResult
): Promise<AgentRow> {
  const supabase = getSupabaseAdmin();
  const walletColumn = chain === "base" ? "base_wallet" : "solana_wallet";

  // First try to find existing agent
  const existing = await findAgentByAddress(address, chain);

  const row = {
    ...agentData,
    [walletColumn]: address.toLowerCase(),
    score: scoreResult.score,
    score_breakdown: scoreResult.breakdown as unknown as Record<string, unknown>,
    reason_codes: scoreResult.reasonCodes,
    score_calculated_at: new Date().toISOString(),
  };

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("agents")
      .update(row)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as AgentRow;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("agents")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return data as AgentRow;
  }
}

/**
 * Get agents list with pagination
 */
export async function getAgentsList(options: {
  limit: number;
  offset: number;
  sortBy: "score" | "volume" | "recent";
  chain: "base" | "solana" | "all";
}): Promise<AgentRow[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase.from("agents").select("*").not("score", "is", null);

  // Chain filter
  if (options.chain === "base") {
    query = query.gt("base_tx_count", 0);
  } else if (options.chain === "solana") {
    query = query.gt("solana_tx_count", 0);
  }

  // Sorting
  if (options.sortBy === "score") {
    query = query.order("score", { ascending: false });
  } else if (options.sortBy === "volume") {
    query = query.order("base_volume_usd", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  query = query.range(options.offset, options.offset + options.limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AgentRow[];
}

/**
 * Get total agent count
 */
export async function getAgentsCount(options: {
  chain: "base" | "solana" | "all";
}): Promise<number> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("agents")
    .select("id", { count: "exact", head: true })
    .not("score", "is", null);

  if (options.chain === "base") {
    query = query.gt("base_tx_count", 0);
  } else if (options.chain === "solana") {
    query = query.gt("solana_tx_count", 0);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/**
 * Save score to history
 */
export async function saveScoreHistory(
  agentId: string,
  scoreResult: ScoreResult
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("score_history").insert({
    agent_id: agentId,
    score: scoreResult.score,
    score_breakdown: scoreResult.breakdown as unknown as Record<string, unknown>,
    reason_codes: scoreResult.reasonCodes,
  });

  if (error) throw error;
}

/**
 * Get score history for an agent
 */
export async function getScoreHistory(
  address: string,
  limit: number = 30
): Promise<Array<{ date: string; score: number }>> {
  const supabase = getSupabaseAdmin();

  // First find the agent
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .or(
      `base_wallet.eq.${address.toLowerCase()},solana_wallet.eq.${address}`
    )
    .single();

  if (!agent) return [];

  const { data, error } = await supabase
    .from("score_history")
    .select("score, created_at")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data || []).map((row) => ({
    date: row.created_at,
    score: row.score,
  }));
}

/**
 * Log a score query
 */
export async function logScoreQuery(params: {
  apiKeyId?: string;
  agentAddress: string;
  agentChain: string;
  queryType: "score" | "report";
  responseScore?: number;
  responseTimeMs: number;
  ipAddress?: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase.from("score_queries").insert({
    api_key_id: params.apiKeyId,
    agent_address: params.agentAddress,
    agent_chain: params.agentChain,
    query_type: params.queryType,
    response_score: params.responseScore,
    response_time_ms: params.responseTimeMs,
    ip_address: params.ipAddress,
  });
}

/**
 * Convert AgentRow to API response format
 */
export function agentRowToApiFormat(agent: AgentRow): {
  address: string;
  name: string | null;
  score: number;
  grade: ScoreGrade;
  totalVolumeUsd: number;
  transactionCount: number;
  chains: string[];
  lastActiveAt: string;
} {
  const chains: string[] = [];
  if (agent.base_tx_count > 0) chains.push("base");
  if (agent.solana_tx_count > 0) chains.push("solana");

  return {
    address: agent.base_wallet || agent.solana_wallet || "",
    name: agent.name,
    score: agent.score || 300,
    grade: getGradeFromScore(agent.score || 300),
    totalVolumeUsd: Number(agent.base_volume_usd) + Number(agent.solana_volume_usd),
    transactionCount: agent.base_tx_count + agent.solana_tx_count,
    chains,
    lastActiveAt: agent.updated_at,
  };
}

function getGradeFromScore(score: number): ScoreGrade {
  if (score >= 800) return "Excellent";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  return "Poor";
}
