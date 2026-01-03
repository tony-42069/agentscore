# AgentScore - Project Specification

## Executive Summary

AgentScore is the **cross-chain credit bureau for AI agents**. It aggregates trust data from ERC-8004 (identity, reputation, validation on Base/Ethereum) and x402 (commercial transaction history on both Base and Solana) into a single, authoritative 300-850 credit score.

## Problem Statement

The AI agent economy is exploding:
- 61M+ x402 transactions (30-day total)
- $7.24M+ in volume
- 62K+ buyers, 10K+ sellers
- Growing rapidly on both Base and Solana

**But there's no unified way to evaluate agent trustworthiness.** Buyers can't easily assess which agents are reliable. Agents can't prove their track record. The data exists across multiple chains and protocols, but nobody is aggregating it into something actionable.

## Solution

AgentScore provides:
1. **Unified Score (300-850):** Single number representing agent trustworthiness
2. **Cross-Chain Aggregation:** Pulls data from Base AND Solana x402 transactions
3. **ERC-8004 Integration:** Incorporates on-chain identity, reputation feedback, and validation results
4. **Full Credit Report:** Breakdown by factor, history over time, chain-specific metrics
5. **API Access:** Companies can query scores programmatically

## Target Users

### Agents (Supply Side)
- Want to prove trustworthiness to potential buyers
- Need a portable reputation that works across platforms
- Pay for verification and score tracking

### Buyers (Demand Side)
- Need to evaluate agents before hiring/using
- Want risk assessment for autonomous agent interactions
- Pay per score query or subscription

## Core Features (MVP)

### 1. Agent Lookup
- Search by wallet address (Base or Solana)
- Search by ERC-8004 Agent ID
- Auto-detect chain and resolve cross-chain wallets

### 2. Score Calculation
- 300-850 scale (like FICO)
- Transparent factor breakdown
- Real-time calculation from on-chain data

### 3. Credit Report
- Score with confidence interval
- Factor breakdown (transaction history, reputation, validation, longevity)
- Chain-specific metrics (Base vs Solana activity)
- Historical score changes
- Red flags / reason codes

### 4. API
- `GET /api/score?address={wallet}` - Get score for any agent
- `GET /api/report?address={wallet}` - Full credit report
- `GET /api/agents` - List all scored agents
- Requires API key for commercial use

### 5. Web Interface
- Landing page explaining the service
- Search bar for agent lookup
- Score display with visual breakdown
- Agent profile pages

## Data Sources

### ERC-8004 (Base/Ethereum)

#### Identity Registry
- **Contract:** ERC-721 with URIStorage extension
- **Data:** Agent ID, owner address, registration URI (IPFS or HTTPS)
- **Registration File Contains:**
  - name, description, image
  - endpoints (A2A, MCP, wallet addresses for multiple chains)
  - supportedTrust models
- **Key Function:** `tokenURI(agentId)` → returns registration file URL

#### Reputation Registry
- **Data:** Client feedback authorized by agents
- **Fields:** agentId, clientAddress, score (0-100), tag1, tag2, fileURI
- **Key Functions:**
  - `getSummary(agentId, clientAddresses, tag1, tag2)` → count + avgScore
  - `readAllFeedback(agentId, ...)` → all feedback entries
  - `getClients(agentId)` → list of clients who gave feedback
- **Off-chain file includes:** proof_of_payment with x402 txHash

#### Validation Registry
- **Data:** Third-party validation results
- **Fields:** validatorAddress, agentId, requestHash, response (0-100)
- **Key Functions:**
  - `getValidationStatus(requestHash)` → validator, response, timestamp
  - `getSummary(agentId, validatorAddresses, tag)` → count + avgResponse

### x402 Transactions (Base)

- **Network:** eip155:8453 (Base mainnet)
- **Data Source:** CDP API / x402scan indexer
- **Metrics:**
  - Transaction count
  - Total volume (USD)
  - Unique buyers
  - Transaction frequency
  - Recency of last transaction

### x402 Transactions (Solana)

- **Network:** solana (mainnet)
- **Data Source:** CDP API / x402scan indexer / on-chain parsing
- **Metrics:** Same as Base
- **Note:** Smaller ecosystem currently (129 sellers) but growing

## Scoring Algorithm

### Score Range
- **Minimum:** 300 (no data or very poor)
- **Maximum:** 850 (excellent across all factors)
- **Starting Point:** 300 base + earned points

### Scoring Factors (550 total points available)

#### 1. Transaction History (150 points) - 27%
Measures commercial activity across both chains.

| Metric | Points |
|--------|--------|
| Total Volume < $100 | 0 |
| Total Volume $100 - $1K | 30 |
| Total Volume $1K - $10K | 60 |
| Total Volume $10K - $100K | 100 |
| Total Volume > $100K | 150 |

#### 2. Activity Level (100 points) - 18%
Measures transaction frequency and consistency.

| Metric | Points |
|--------|--------|
| < 10 transactions | 0 |
| 10-100 transactions | 25 |
| 100-1K transactions | 50 |
| 1K-10K transactions | 75 |
| > 10K transactions | 100 |

#### 3. Buyer Diversity (75 points) - 14%
Measures breadth of client relationships.

| Metric | Points |
|--------|--------|
| 1-5 unique buyers | 15 |
| 6-20 unique buyers | 35 |
| 21-100 unique buyers | 55 |
| > 100 unique buyers | 75 |

#### 4. Reputation Score (100 points) - 18%
From ERC-8004 Reputation Registry feedback.

| Avg Feedback Score | Points |
|--------------------|--------|
| No feedback | 0 |
| < 50 avg | 10 |
| 50-69 avg | 30 |
| 70-79 avg | 50 |
| 80-89 avg | 75 |
| 90-100 avg | 100 |

#### 5. Validation Status (50 points) - 9%
From ERC-8004 Validation Registry.

| Status | Points |
|--------|--------|
| No validation | 0 |
| Failed validation | -25 (penalty) |
| Passed validation (1 validator) | 25 |
| Passed validation (multiple) | 50 |

#### 6. Longevity (50 points) - 9%
Time since first recorded activity.

| Age | Points |
|-----|--------|
| < 7 days | 0 |
| 7-30 days | 15 |
| 30-90 days | 30 |
| 90-180 days | 40 |
| > 180 days | 50 |

#### 7. Cross-Chain Presence (25 points) - 5%
Activity on multiple chains indicates broader adoption.

| Presence | Points |
|----------|--------|
| Single chain only | 0 |
| Active on 2+ chains | 25 |

### Reason Codes
Each score includes reason codes explaining factors:
- `NO_TRANSACTION_HISTORY` - No x402 transactions found
- `LOW_VOLUME` - Transaction volume below $1K
- `FEW_BUYERS` - Less than 10 unique buyers
- `NO_REPUTATION_DATA` - No ERC-8004 feedback
- `LOW_REPUTATION` - Average feedback below 70
- `NO_VALIDATION` - No third-party validation
- `FAILED_VALIDATION` - Failed validation attempt
- `NEW_AGENT` - Less than 30 days old
- `SINGLE_CHAIN` - Only active on one chain
- `EXCELLENT_HISTORY` - Strong transaction history
- `HIGH_REPUTATION` - Feedback score 90+
- `VALIDATED` - Passed third-party validation

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Next.js 14 + TypeScript + Tailwind + shadcn/ui                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ Landing     │ │ Search/     │ │ Agent Profile           │   │
│  │ Page        │ │ Results     │ │ + Score + Report        │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js API Routes)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ /api/score  │ │ /api/report │ │ /api/agents             │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SCORING ENGINE                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ calculateScore(agentData) → { score, breakdown, codes } │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA AGGREGATION LAYER                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ ERC-8004    │ │ x402 Base   │ │ x402 Solana             │   │
│  │ Reader      │ │ Reader      │ │ Reader                  │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ERC-8004        │ │ Base            │ │ Solana          │
│ Contracts       │ │ x402 Data       │ │ x402 Data       │
│ (Base)          │ │ (CDP/Indexer)   │ │ (CDP/Indexer)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Database Schema

```sql
-- Cached agent data (refreshed periodically)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiers
    erc8004_agent_id INTEGER,
    base_wallet TEXT,
    solana_wallet TEXT,
    
    -- ERC-8004 Data
    name TEXT,
    description TEXT,
    image_url TEXT,
    registration_uri TEXT,
    registered_at TIMESTAMP,
    
    -- Computed Score
    score INTEGER CHECK (score BETWEEN 300 AND 850),
    score_breakdown JSONB,
    reason_codes TEXT[],
    score_calculated_at TIMESTAMP,
    
    -- Aggregated Metrics (Base)
    base_tx_count INTEGER DEFAULT 0,
    base_volume_usd DECIMAL(20,6) DEFAULT 0,
    base_unique_buyers INTEGER DEFAULT 0,
    base_first_tx_at TIMESTAMP,
    base_last_tx_at TIMESTAMP,
    
    -- Aggregated Metrics (Solana)
    solana_tx_count INTEGER DEFAULT 0,
    solana_volume_usd DECIMAL(20,6) DEFAULT 0,
    solana_unique_buyers INTEGER DEFAULT 0,
    solana_first_tx_at TIMESTAMP,
    solana_last_tx_at TIMESTAMP,
    
    -- ERC-8004 Reputation
    reputation_count INTEGER DEFAULT 0,
    reputation_avg_score DECIMAL(5,2),
    
    -- ERC-8004 Validation
    validation_count INTEGER DEFAULT 0,
    validation_passed INTEGER DEFAULT 0,
    validation_failed INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Score history for tracking changes
CREATE TABLE score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    score_breakdown JSONB,
    reason_codes TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- API keys for commercial access
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    key_hash TEXT UNIQUE NOT NULL,
    name TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
    query_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Query log for analytics and billing
CREATE TABLE score_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    agent_id UUID REFERENCES agents(id),
    query_type TEXT CHECK (query_type IN ('score', 'report')),
    response_score INTEGER,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agents_base_wallet ON agents(base_wallet);
CREATE INDEX idx_agents_solana_wallet ON agents(solana_wallet);
CREATE INDEX idx_agents_erc8004_id ON agents(erc8004_agent_id);
CREATE INDEX idx_agents_score ON agents(score DESC);
CREATE INDEX idx_score_history_agent ON score_history(agent_id);
CREATE INDEX idx_score_queries_created ON score_queries(created_at);
```

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Charts:** Recharts or Chart.js
- **State:** React Query (TanStack Query)

### Backend
- **Runtime:** Next.js API Routes (serverless)
- **Language:** TypeScript
- **Validation:** Zod

### Database
- **Primary:** PostgreSQL (Supabase)
- **Caching:** Supabase (built-in) or Redis (if needed)

### Blockchain Integration
- **EVM (Base):** ethers.js v6 or viem
- **Solana:** @solana/web3.js
- **RPC Providers:** Alchemy (Base), Helius or QuickNode (Solana)

### External APIs
- **CDP API:** x402 facilitator endpoints, discovery
- **x402scan:** Transaction indexing (if API available)

### Hosting
- **Frontend/API:** Vercel
- **Database:** Supabase

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... # For migrations

# Blockchain RPC
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# ERC-8004 Contract Addresses (Base)
ERC8004_IDENTITY_REGISTRY=0x...
ERC8004_REPUTATION_REGISTRY=0x...
ERC8004_VALIDATION_REGISTRY=0x...

# CDP API (for x402)
CDP_API_KEY=...
CDP_API_SECRET=...

# App
NEXT_PUBLIC_APP_URL=https://agentscore.ai
API_SECRET_KEY=... # For signing API keys
```

## File Structure

```
agentscore/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── search/
│   │   │   └── page.tsx                # Search results
│   │   ├── agent/
│   │   │   └── [address]/
│   │   │       └── page.tsx            # Agent profile + score
│   │   └── api/
│   │       ├── score/
│   │       │   └── route.ts            # GET /api/score
│   │       ├── report/
│   │       │   └── route.ts            # GET /api/report
│   │       └── agents/
│   │           └── route.ts            # GET /api/agents
│   ├── lib/
│   │   ├── scoring/
│   │   │   ├── calculator.ts           # Main scoring algorithm
│   │   │   ├── factors.ts              # Individual factor calculations
│   │   │   └── reason-codes.ts         # Reason code definitions
│   │   ├── data/
│   │   │   ├── erc8004/
│   │   │   │   ├── client.ts           # ERC-8004 contract client
│   │   │   │   ├── identity.ts         # Identity registry reader
│   │   │   │   ├── reputation.ts       # Reputation registry reader
│   │   │   │   └── validation.ts       # Validation registry reader
│   │   │   ├── x402/
│   │   │   │   ├── base.ts             # Base x402 data fetcher
│   │   │   │   ├── solana.ts           # Solana x402 data fetcher
│   │   │   │   └── types.ts            # Shared x402 types
│   │   │   └── aggregator.ts           # Combines all data sources
│   │   ├── db/
│   │   │   ├── client.ts               # Supabase client
│   │   │   ├── schema.ts               # Type definitions
│   │   │   └── queries.ts              # Database queries
│   │   └── utils/
│   │       ├── addresses.ts            # Address validation/parsing
│   │       └── formatting.ts           # Number/date formatting
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── ScoreCard.tsx               # Large score display
│   │   ├── ScoreBreakdown.tsx          # Factor breakdown chart
│   │   ├── ScoreGauge.tsx              # Circular score gauge
│   │   ├── ReasonCodes.tsx             # Reason code badges
│   │   ├── ChainMetrics.tsx            # Base vs Solana comparison
│   │   ├── AgentSearch.tsx             # Search input component
│   │   ├── AgentCard.tsx               # Agent summary card
│   │   └── ScoreHistory.tsx            # Score over time chart
│   └── types/
│       ├── agent.ts                    # Agent type definitions
│       ├── score.ts                    # Score type definitions
│       └── api.ts                      # API request/response types
├── docs/                               # Documentation (this folder)
├── prisma/
│   └── schema.prisma                   # Database schema (if using Prisma)
├── public/
│   └── ...                             # Static assets
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## API Specification

### GET /api/score

Get the score for an agent by wallet address.

**Query Parameters:**
- `address` (required): Wallet address (Base or Solana)
- `chain` (optional): 'base' | 'solana' | 'auto' (default: auto-detect)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "chain": "base",
    "score": 720,
    "grade": "Good",
    "reasonCodes": ["EXCELLENT_HISTORY", "NO_VALIDATION"],
    "calculatedAt": "2025-01-01T12:00:00Z"
  }
}
```

### GET /api/report

Get the full credit report for an agent.

**Query Parameters:**
- `address` (required): Wallet address
- `chain` (optional): 'base' | 'solana' | 'auto'

**Response:**
```json
{
  "success": true,
  "data": {
    "agent": {
      "address": "0x1234...",
      "name": "Agent Name",
      "description": "...",
      "imageUrl": "...",
      "erc8004AgentId": 123,
      "wallets": {
        "base": "0x1234...",
        "solana": "So11..."
      }
    },
    "score": {
      "value": 720,
      "grade": "Good",
      "percentile": 75,
      "breakdown": {
        "transactionHistory": { "score": 100, "maxScore": 150, "details": {...} },
        "activityLevel": { "score": 75, "maxScore": 100, "details": {...} },
        "buyerDiversity": { "score": 55, "maxScore": 75, "details": {...} },
        "reputation": { "score": 75, "maxScore": 100, "details": {...} },
        "validation": { "score": 0, "maxScore": 50, "details": {...} },
        "longevity": { "score": 40, "maxScore": 50, "details": {...} },
        "crossChain": { "score": 25, "maxScore": 25, "details": {...} }
      },
      "reasonCodes": ["EXCELLENT_HISTORY", "NO_VALIDATION"]
    },
    "metrics": {
      "base": {
        "transactionCount": 1500,
        "volumeUsd": 25000.00,
        "uniqueBuyers": 45,
        "firstTransaction": "2024-06-15T...",
        "lastTransaction": "2025-01-01T..."
      },
      "solana": {
        "transactionCount": 500,
        "volumeUsd": 8000.00,
        "uniqueBuyers": 20,
        "firstTransaction": "2024-09-01T...",
        "lastTransaction": "2024-12-28T..."
      }
    },
    "reputation": {
      "feedbackCount": 12,
      "averageScore": 87.5,
      "recentFeedback": [...]
    },
    "validation": {
      "totalValidations": 0,
      "passed": 0,
      "failed": 0
    },
    "history": [
      { "date": "2024-12-01", "score": 680 },
      { "date": "2025-01-01", "score": 720 }
    ]
  }
}
```

### GET /api/agents

List all scored agents with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sort` (optional): 'score' | 'volume' | 'recent' (default: score)
- `chain` (optional): 'base' | 'solana' | 'all'

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "address": "0x1234...",
        "name": "Top Agent",
        "score": 820,
        "grade": "Excellent",
        "totalVolume": 150000.00,
        "chains": ["base", "solana"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

## Score Grades

| Score Range | Grade | Description |
|-------------|-------|-------------|
| 800-850 | Excellent | Top-tier agent, exceptional track record |
| 740-799 | Very Good | Strong history, highly trustworthy |
| 670-739 | Good | Solid performer, generally reliable |
| 580-669 | Fair | Limited history or some concerns |
| 300-579 | Poor | New agent or significant issues |

## Implementation Priority

### Phase 1: Core Infrastructure
1. Project setup (Next.js, TypeScript, Tailwind)
2. Database schema and Supabase connection
3. ERC-8004 contract clients (read-only)
4. x402 data fetchers (Base + Solana)

### Phase 2: Scoring Engine
5. Data aggregator (combines all sources)
6. Scoring algorithm implementation
7. Reason code generation
8. Score caching layer

### Phase 3: API Layer
9. `/api/score` endpoint
10. `/api/report` endpoint
11. `/api/agents` endpoint
12. API key authentication

### Phase 4: Frontend
13. Landing page
14. Search functionality
15. Agent profile page
16. Score visualization components

### Phase 5: Polish
17. Error handling and edge cases
18. Loading states and skeletons
19. SEO and meta tags
20. Documentation and README
