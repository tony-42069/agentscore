# Database Setup Guide

## Overview

AgentScore uses PostgreSQL via Supabase for data persistence, caching, and API key management.

## Supabase Setup

### 1. Create Project

1. Go to https://supabase.com
2. Create a new project
3. Note down:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
   - Database URL (`DATABASE_URL`)

### 2. Run Migrations

Run this SQL in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents table (cached agent data)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identifiers
    erc8004_agent_id INTEGER,
    base_wallet TEXT,
    solana_wallet TEXT,
    
    -- ERC-8004 Identity Data
    name TEXT,
    description TEXT,
    image_url TEXT,
    registration_uri TEXT,
    
    -- Computed Score
    score INTEGER CHECK (score >= 300 AND score <= 850),
    score_breakdown JSONB,
    reason_codes TEXT[],
    score_calculated_at TIMESTAMPTZ,
    
    -- Base x402 Metrics
    base_tx_count INTEGER DEFAULT 0,
    base_volume_usd DECIMAL(20,6) DEFAULT 0,
    base_unique_buyers INTEGER DEFAULT 0,
    base_first_tx_at TIMESTAMPTZ,
    base_last_tx_at TIMESTAMPTZ,
    
    -- Solana x402 Metrics
    solana_tx_count INTEGER DEFAULT 0,
    solana_volume_usd DECIMAL(20,6) DEFAULT 0,
    solana_unique_buyers INTEGER DEFAULT 0,
    solana_first_tx_at TIMESTAMPTZ,
    solana_last_tx_at TIMESTAMPTZ,
    
    -- ERC-8004 Reputation
    reputation_count INTEGER DEFAULT 0,
    reputation_avg_score DECIMAL(5,2) DEFAULT 0,
    
    -- ERC-8004 Validation
    validation_count INTEGER DEFAULT 0,
    validation_passed INTEGER DEFAULT 0,
    validation_failed INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_base_wallet CHECK (base_wallet IS NULL OR base_wallet ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT has_wallet CHECK (base_wallet IS NOT NULL OR solana_wallet IS NOT NULL)
);

-- Score history
CREATE TABLE score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    score_breakdown JSONB,
    reason_codes TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash TEXT UNIQUE NOT NULL,
    name TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
    query_count INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 100,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Query log
CREATE TABLE score_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID REFERENCES api_keys(id),
    agent_address TEXT NOT NULL,
    agent_chain TEXT NOT NULL,
    query_type TEXT CHECK (query_type IN ('score', 'report')),
    response_score INTEGER,
    response_time_ms INTEGER,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agents_base_wallet ON agents(base_wallet);
CREATE INDEX idx_agents_solana_wallet ON agents(solana_wallet);
CREATE INDEX idx_agents_erc8004_id ON agents(erc8004_agent_id);
CREATE INDEX idx_agents_score ON agents(score DESC);
CREATE INDEX idx_agents_updated ON agents(updated_at DESC);
CREATE INDEX idx_score_history_agent ON score_history(agent_id, created_at DESC);
CREATE INDEX idx_score_queries_created ON score_queries(created_at DESC);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_queries ENABLE ROW LEVEL SECURITY;

-- Public read access for agents
CREATE POLICY "Public read access" ON agents
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access" ON agents
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON score_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON api_keys
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON score_queries
    FOR ALL USING (auth.role() = 'service_role');
```

## Database Client

### File: `src/lib/db/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role (full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client-side client (limited access)
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### File: `src/lib/db/queries.ts`

```typescript
import { supabaseAdmin } from './client';
import type { ScoreResult } from '../scoring/types';

export interface AgentRow {
  id: string;
  erc8004_agent_id: number | null;
  base_wallet: string | null;
  solana_wallet: string | null;
  name: string | null;
  description: string | null;
  image_url: string | null;
  score: number | null;
  score_breakdown: any;
  reason_codes: string[] | null;
  score_calculated_at: string | null;
  base_tx_count: number;
  base_volume_usd: number;
  base_unique_buyers: number;
  solana_tx_count: number;
  solana_volume_usd: number;
  solana_unique_buyers: number;
  reputation_count: number;
  reputation_avg_score: number;
  updated_at: string;
}

/**
 * Find agent by wallet address
 */
export async function findAgentByAddress(
  address: string,
  chain: 'base' | 'solana'
): Promise<AgentRow | null> {
  const column = chain === 'base' ? 'base_wallet' : 'solana_wallet';
  
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq(column, address.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as AgentRow;
}

/**
 * Upsert agent data and score
 */
export async function upsertAgent(
  address: string,
  chain: 'base' | 'solana',
  agentData: Partial<AgentRow>,
  scoreResult: ScoreResult
): Promise<AgentRow> {
  const walletColumn = chain === 'base' ? 'base_wallet' : 'solana_wallet';
  
  const row = {
    ...agentData,
    [walletColumn]: address.toLowerCase(),
    score: scoreResult.score,
    score_breakdown: scoreResult.breakdown,
    reason_codes: scoreResult.reasonCodes,
    score_calculated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('agents')
    .upsert(row, { onConflict: walletColumn })
    .select()
    .single();

  if (error) throw error;
  return data as AgentRow;
}

/**
 * Get agents list with pagination
 */
export async function getAgentsList(options: {
  limit: number;
  offset: number;
  sortBy: 'score' | 'volume' | 'recent';
  chain: 'base' | 'solana' | 'all';
}): Promise<AgentRow[]> {
  let query = supabaseAdmin
    .from('agents')
    .select('*')
    .not('score', 'is', null);

  // Chain filter
  if (options.chain === 'base') {
    query = query.gt('base_tx_count', 0);
  } else if (options.chain === 'solana') {
    query = query.gt('solana_tx_count', 0);
  }

  // Sorting
  if (options.sortBy === 'score') {
    query = query.order('score', { ascending: false });
  } else if (options.sortBy === 'volume') {
    // Sort by combined volume - Supabase doesn't support computed columns easily
    query = query.order('base_volume_usd', { ascending: false });
  } else {
    query = query.order('updated_at', { ascending: false });
  }

  query = query.range(options.offset, options.offset + options.limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data as AgentRow[];
}

/**
 * Get total agent count
 */
export async function getAgentsCount(options: {
  chain: 'base' | 'solana' | 'all';
}): Promise<number> {
  let query = supabaseAdmin
    .from('agents')
    .select('id', { count: 'exact', head: true })
    .not('score', 'is', null);

  if (options.chain === 'base') {
    query = query.gt('base_tx_count', 0);
  } else if (options.chain === 'solana') {
    query = query.gt('solana_tx_count', 0);
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
  const { error } = await supabaseAdmin.from('score_history').insert({
    agent_id: agentId,
    score: scoreResult.score,
    score_breakdown: scoreResult.breakdown,
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
  // First find the agent
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id')
    .or(`base_wallet.eq.${address.toLowerCase()},solana_wallet.eq.${address}`)
    .single();

  if (!agent) return [];

  const { data, error } = await supabaseAdmin
    .from('score_history')
    .select('score, created_at')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
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
  queryType: 'score' | 'report';
  responseScore?: number;
  responseTimeMs: number;
  ipAddress?: string;
}): Promise<void> {
  await supabaseAdmin.from('score_queries').insert({
    api_key_id: params.apiKeyId,
    agent_address: params.agentAddress,
    agent_chain: params.agentChain,
    query_type: params.queryType,
    response_score: params.responseScore,
    response_time_ms: params.responseTimeMs,
    ip_address: params.ipAddress,
  });
}
```

## Environment Variables

Add to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:password@db.YOUR_PROJECT.supabase.co:5432/postgres
```

## Caching Strategy

The database serves as a cache:

1. **Cache Hit**: If agent exists and `score_calculated_at` is within TTL (1 hour), return cached score
2. **Cache Miss**: Fetch fresh data, calculate score, save to database
3. **Background Refresh**: Periodically refresh scores for active agents

```typescript
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getAgentWithCache(
  address: string,
  chain: 'base' | 'solana'
): Promise<{ agent: AgentRow; cached: boolean } | null> {
  const agent = await findAgentByAddress(address, chain);
  
  if (agent && agent.score_calculated_at) {
    const calculatedAt = new Date(agent.score_calculated_at);
    const age = Date.now() - calculatedAt.getTime();
    
    if (age < CACHE_TTL_MS) {
      return { agent, cached: true };
    }
  }
  
  // Need fresh calculation
  return null;
}
```
