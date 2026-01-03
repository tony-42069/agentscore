# API Specification

## Overview

AgentScore provides a REST API for querying agent credit scores and reports.

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://agentscore.ai/api`

## Authentication

For MVP, the API is public. Future versions will require API keys for commercial use.

```typescript
// Future: API key authentication
// Header: X-API-Key: your_api_key
```

## Endpoints

### GET /api/score

Get the credit score for an agent by wallet address.

#### Request

```
GET /api/score?address={address}&chain={chain}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Wallet address (Base 0x... or Solana base58) |
| chain | string | No | 'base', 'solana', or 'auto' (default: auto-detect) |

#### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
    "chain": "base",
    "score": 720,
    "grade": "Good",
    "reasonCodes": [
      "HIGH_VOLUME",
      "DIVERSE_BUYERS",
      "NO_VALIDATION",
      "MULTI_CHAIN"
    ],
    "calculatedAt": "2025-01-01T12:00:00.000Z",
    "cached": false
  }
}
```

**Error (400):**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ADDRESS",
    "message": "The provided address is not a valid Base or Solana address"
  }
}
```

**Error (404):**

```json
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "No data found for this address"
  }
}
```

#### Implementation

```typescript
// src/app/api/score/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateScore } from '@/lib/scoring';
import { aggregateAgentData } from '@/lib/data/aggregator';
import { detectChain, isValidAddress } from '@/lib/utils/addresses';

const querySchema = z.object({
  address: z.string().min(1),
  chain: z.enum(['base', 'solana', 'auto']).optional().default('auto'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      address: searchParams.get('address'),
      chain: searchParams.get('chain') || 'auto',
    });

    // Validate address
    if (!isValidAddress(query.address)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'The provided address is not a valid Base or Solana address',
          },
        },
        { status: 400 }
      );
    }

    // Detect chain if auto
    const chain = query.chain === 'auto' 
      ? detectChain(query.address) 
      : query.chain;

    if (chain === 'unknown') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNKNOWN_CHAIN',
            message: 'Could not detect chain from address format',
          },
        },
        { status: 400 }
      );
    }

    // Aggregate data from all sources
    const agentData = await aggregateAgentData(query.address, chain);

    // Calculate score
    const result = calculateScore(agentData);

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
    console.error('Score API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
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
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
```

---

### GET /api/report

Get a full credit report for an agent.

#### Request

```
GET /api/report?address={address}&chain={chain}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Wallet address |
| chain | string | No | 'base', 'solana', or 'auto' |

#### Response

**Success (200):**

```json
{
  "success": true,
  "data": {
    "agent": {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
      "name": "Trading Agent Alpha",
      "description": "High-frequency DeFi trading agent",
      "imageUrl": "https://example.com/agent.png",
      "erc8004AgentId": 123,
      "wallets": {
        "base": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
        "solana": "So11111111111111111111111111111111111111112"
      },
      "registeredAt": "2024-06-15T00:00:00.000Z"
    },
    "score": {
      "value": 720,
      "grade": "Good",
      "percentile": 75,
      "breakdown": {
        "transactionHistory": {
          "score": 100,
          "maxScore": 150,
          "percentage": 66.67,
          "details": {
            "totalVolumeUsd": 33000,
            "baseVolumeUsd": 25000,
            "solanaVolumeUsd": 8000
          }
        },
        "activityLevel": {
          "score": 75,
          "maxScore": 100,
          "percentage": 75,
          "details": {
            "totalTransactionCount": 2000,
            "baseTxCount": 1500,
            "solanaTxCount": 500
          }
        },
        "buyerDiversity": {
          "score": 55,
          "maxScore": 75,
          "percentage": 73.33,
          "details": {
            "totalUniqueBuyers": 65,
            "baseUniqueBuyers": 45,
            "solanaUniqueBuyers": 20
          }
        },
        "reputation": {
          "score": 75,
          "maxScore": 100,
          "percentage": 75,
          "details": {
            "feedbackCount": 12,
            "averageScore": 87.5
          }
        },
        "validation": {
          "score": 25,
          "maxScore": 50,
          "percentage": 50,
          "details": {
            "totalValidations": 1,
            "passed": 1,
            "failed": 0
          }
        },
        "longevity": {
          "score": 40,
          "maxScore": 50,
          "percentage": 80,
          "details": {
            "daysSinceFirst": 200,
            "firstTransactionAt": "2024-06-15T00:00:00.000Z"
          }
        },
        "crossChain": {
          "score": 25,
          "maxScore": 25,
          "percentage": 100,
          "details": {
            "activeOnBase": true,
            "activeOnSolana": true,
            "chainsActive": ["base", "solana"]
          }
        }
      },
      "reasonCodes": [
        "HIGH_VOLUME",
        "HIGH_ACTIVITY",
        "DIVERSE_BUYERS",
        "VALIDATED",
        "ESTABLISHED_AGENT",
        "MULTI_CHAIN"
      ]
    },
    "metrics": {
      "base": {
        "transactionCount": 1500,
        "volumeUsd": 25000,
        "uniqueBuyers": 45,
        "averageTransactionUsd": 16.67,
        "firstTransactionAt": "2024-06-15T00:00:00.000Z",
        "lastTransactionAt": "2025-01-01T12:00:00.000Z",
        "transactionsLast7Days": 150,
        "transactionsLast30Days": 400,
        "volumeLast7Days": 2500,
        "volumeLast30Days": 6000
      },
      "solana": {
        "transactionCount": 500,
        "volumeUsd": 8000,
        "uniqueBuyers": 20,
        "averageTransactionUsd": 16,
        "firstTransactionAt": "2024-09-01T00:00:00.000Z",
        "lastTransactionAt": "2024-12-28T00:00:00.000Z",
        "transactionsLast7Days": 30,
        "transactionsLast30Days": 100,
        "volumeLast7Days": 500,
        "volumeLast30Days": 1500
      },
      "combined": {
        "totalTransactionCount": 2000,
        "totalVolumeUsd": 33000,
        "totalUniqueBuyers": 65,
        "chainsActive": ["base", "solana"]
      }
    },
    "reputation": {
      "feedbackCount": 12,
      "averageScore": 87.5,
      "scoreDistribution": {
        "excellent": 8,
        "good": 3,
        "fair": 1,
        "poor": 0
      },
      "recentFeedback": [
        {
          "clientAddress": "0xabc...",
          "score": 95,
          "tag1": "fast",
          "tag2": "reliable",
          "createdAt": "2024-12-28T00:00:00.000Z"
        }
      ]
    },
    "validation": {
      "totalValidations": 1,
      "passed": 1,
      "failed": 0,
      "validations": [
        {
          "validatorAddress": "0xdef...",
          "response": 100,
          "tag": "automated",
          "lastUpdate": "2024-11-15T00:00:00.000Z"
        }
      ]
    },
    "history": [
      { "date": "2024-12-01", "score": 680 },
      { "date": "2024-12-15", "score": 700 },
      { "date": "2025-01-01", "score": 720 }
    ],
    "calculatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

#### Implementation

```typescript
// src/app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateScore } from '@/lib/scoring';
import { aggregateAgentData, getAgentIdentity } from '@/lib/data/aggregator';
import { detectChain, isValidAddress } from '@/lib/utils/addresses';
import { getScoreHistory } from '@/lib/db/queries';

const querySchema = z.object({
  address: z.string().min(1),
  chain: z.enum(['base', 'solana', 'auto']).optional().default('auto'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      address: searchParams.get('address'),
      chain: searchParams.get('chain') || 'auto',
    });

    if (!isValidAddress(query.address)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ADDRESS', message: 'Invalid address' } },
        { status: 400 }
      );
    }

    const chain = query.chain === 'auto' ? detectChain(query.address) : query.chain;

    // Get identity info (from ERC-8004 if available)
    const identity = await getAgentIdentity(query.address);

    // Aggregate all data
    const agentData = await aggregateAgentData(query.address, chain);

    // Calculate score
    const scoreResult = calculateScore(agentData);

    // Get score history
    const history = await getScoreHistory(query.address);

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        agent: {
          address: query.address,
          name: identity?.name || null,
          description: identity?.description || null,
          imageUrl: identity?.imageUrl || null,
          erc8004AgentId: identity?.agentId || null,
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
            firstTransactionAt: agentData.baseFirstTxAt,
            lastTransactionAt: agentData.baseLastTxAt,
          },
          solana: {
            transactionCount: agentData.solanaTxCount,
            volumeUsd: agentData.solanaVolumeUsd,
            uniqueBuyers: agentData.solanaUniqueBuyers,
            firstTransactionAt: agentData.solanaFirstTxAt,
            lastTransactionAt: agentData.solanaLastTxAt,
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
    console.error('Report API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

---

### GET /api/agents

List all scored agents with pagination.

#### Request

```
GET /api/agents?page={page}&limit={limit}&sort={sort}&chain={chain}
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Results per page (max 100) |
| sort | string | No | 'score' | Sort by: 'score', 'volume', 'recent' |
| chain | string | No | 'all' | Filter by chain: 'base', 'solana', 'all' |

#### Response

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
        "name": "Top Trading Agent",
        "score": 820,
        "grade": "Excellent",
        "totalVolumeUsd": 150000,
        "transactionCount": 5000,
        "chains": ["base", "solana"],
        "lastActiveAt": "2025-01-01T12:00:00.000Z"
      },
      {
        "address": "So11111111111111111111111111111111111111112",
        "name": null,
        "score": 680,
        "grade": "Good",
        "totalVolumeUsd": 25000,
        "transactionCount": 800,
        "chains": ["solana"],
        "lastActiveAt": "2024-12-30T08:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Implementation

```typescript
// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAgentsList, getAgentsCount } from '@/lib/db/queries';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['score', 'volume', 'recent']).default('score'),
  chain: z.enum(['base', 'solana', 'all']).default('all'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      sort: searchParams.get('sort') || 'score',
      chain: searchParams.get('chain') || 'all',
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
        agents: agents.map(agent => ({
          address: agent.base_wallet || agent.solana_wallet,
          name: agent.name,
          score: agent.score,
          grade: getGrade(agent.score),
          totalVolumeUsd: agent.base_volume_usd + agent.solana_volume_usd,
          transactionCount: agent.base_tx_count + agent.solana_tx_count,
          chains: [
            agent.base_tx_count > 0 ? 'base' : null,
            agent.solana_tx_count > 0 ? 'solana' : null,
          ].filter(Boolean),
          lastActiveAt: agent.updated_at,
        })),
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
    console.error('Agents API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

function getGrade(score: number): string {
  if (score >= 800) return 'Excellent';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_ADDRESS | 400 | Address format is invalid |
| UNKNOWN_CHAIN | 400 | Could not detect chain from address |
| VALIDATION_ERROR | 400 | Request parameters failed validation |
| AGENT_NOT_FOUND | 404 | No data found for address |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |

## Rate Limiting (Future)

```
Free tier: 100 requests/day
Starter: 1,000 requests/day
Pro: 10,000 requests/day
Enterprise: Unlimited
```

## Webhooks (Future)

Subscribe to score changes:

```json
POST /api/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": ["score.changed", "score.dropped"],
  "addresses": ["0x..."]
}
```
