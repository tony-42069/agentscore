# Project History & Key Decisions

## Overview

This document captures the planning conversations and key decisions made during the AgentScore design phase. Claude Code should read this to understand the context and reasoning behind the architecture.

---

## Phase 1: Initial Planning (with Claude Sonnet)

### What Sonnet Created

Sonnet created a comprehensive `CLAUDE.md` file with:
- Market analysis ($4.8B → $47.5B agent market by 2030)
- 5 name options (AgentScore was recommended and chosen)
- Revenue model (agents pay $99-299/year, companies pay $2/query)
- 12-week MVP timeline
- Full code samples with database schema
- Scoring algorithm with invented weights

### Critique of Sonnet's Approach

When reviewed by Opus, several issues were identified:

1. **No customer validation** - Assumed demand without evidence
2. **Chicken-and-egg problem unaddressed** - How to get agents AND buyers?
3. **Scoring weights invented** - Numbers like `TRAINING_TRANSPARENCY: 0.35` had no basis
4. **Assumed data availability** - Data sources didn't exist as described
5. **Legal compliance ignored** - FCRA concerns not addressed
6. **Security issues in code** - SQL injection vulnerabilities, no auth
7. **Recommended 20 customer interviews** before building

### Why This Was Wrong

The founder provided evidence that **the ecosystem already exists**:
- x402scan showing 500K+ daily transactions
- $39K+ daily volume on Base alone
- 10K+ active sellers
- 62K+ buyers in the ecosystem
- Direct connection to ERC-8004 protocol creator

**Founder's response**: "I know there is already demand for this. There are already agents processing hundreds of thousands of transactions monthly with millions in volume. I am already falling behind."

---

## Phase 2: Architecture Correction

### Initial Misunderstanding

Opus initially suggested a Solana-only approach, deferring ERC-8004/Base to "v2".

### Founder's Correction

> "There is no V2, THIS is it. We MUST utilize BOTH x402 and erc8004 protocol for this to function properly as I intended."

Further clarification:
- x402 integration needed for BOTH Solana AND Base
- Base actually has MORE activity than Solana currently
- Full cross-chain coverage required from day one

### Final Architecture Agreement

AgentScore = Cross-chain scoring system that unifies:

**From ERC-8004 (Base/Ethereum):**
- Identity Registry → Agent identity, metadata, linked wallets
- Reputation Registry → Client feedback (0-100), proof of payment
- Validation Registry → Third-party validation results

**From x402 (Base + Solana):**
- Transaction count and volume
- Unique buyer relationships
- Activity patterns and recency

**Connection Mechanism:**
ERC-8004 registration files can list multiple wallet addresses:
```json
{
  "endpoints": [
    {"name": "agentWallet", "endpoint": "eip155:8453:0xBase..."},
    {"name": "agentWallet", "endpoint": "solana:SolanaAddress..."}
  ]
}
```

---

## Phase 3: Requirements Clarification

### On Robustness vs Speed

**Founder**: "I actually want you to completely disregard time as a factor at all, think only robustness."

**Implication**: Build it right, not fast. No shortcuts.

### On Code Generation

**Founder**: "I actually don't want you to write any of the code here, I will be doing the code writing with you in claude code terminal. What I want you to do though is create the documentation for claude code to read so it knows EXACTLY what to do."

**Implication**: Create comprehensive documentation, not code. Claude Code will implement.

### On Scope

**Founder**: Confirmed MVP should include:
- Score lookup by any wallet (Base or Solana)
- Full credit report with breakdown
- Public API
- Clean web interface
- Mobile responsive

---

## Phase 4: Technical Decisions

### Scoring Algorithm

After discussion, agreed on 7 factors with specific weights:

| Factor | Points | Weight |
|--------|--------|--------|
| Transaction History | 150 | 27.3% |
| Activity Level | 100 | 18.2% |
| Buyer Diversity | 75 | 13.6% |
| Reputation | 100 | 18.2% |
| Validation | 50 | 9.1% |
| Longevity | 50 | 9.1% |
| Cross-Chain | 25 | 4.5% |

Base score: 300, Max: 850 (550 points to earn)

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind, shadcn/ui
- **Backend**: Next.js API routes
- **Database**: PostgreSQL via Supabase
- **Blockchain**: viem (Base), @solana/web3.js (Solana)
- **Hosting**: Vercel

### Data Sources Priority

1. **Primary**: x402 transaction data (objective, can't be gamed)
2. **Secondary**: ERC-8004 reputation (opt-in but valuable)
3. **Tertiary**: ERC-8004 validation (additional trust signal)

---

## Phase 5: Critical Dependencies

### ERC-8004 Contract Addresses

**CRITICAL**: Real contract addresses are needed before the app will work.

Placeholder addresses (`0x000...`) are in the code. Founder has direct connection to ERC-8004 protocol creator to obtain real addresses.

Options:
- Check 8004scan.io for deployments
- Contact ERC-8004 team directly
- Use testnet (Base Sepolia) for development

### x402 Data Access

Options explored:
1. **CDP Discovery API** - Official Coinbase endpoint
2. **x402scan API** - If they have public API
3. **On-chain parsing** - Direct blockchain queries (fallback)

Recommendation: Start with on-chain parsing, optimize with APIs later.

---

## Key Quotes from Founder

On urgency:
> "We need to launch in one week max"

On budget:
> "No need for a budget, we will develop the software here with you"

On legal concerns (FCRA):
> "This is NOT involved with FICO. This is completely separate"

On architecture:
> "There is no V2, THIS is it"

On quality:
> "Think only robustness"

---

## What Claude Code Needs to Know

1. **This is a real product** with validated market demand
2. **Cross-chain is mandatory** - Base AND Solana from day 1
3. **ERC-8004 + x402 integration** - Both protocols required
4. **Quality over speed** - Build it right
5. **Contract addresses are blockers** - Get real ones before testing
6. **Founder knows the ecosystem** - Trust the requirements

---

## Files Created for Claude Code

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Primary build instructions |
| `docs/PROJECT_SPEC.md` | Complete product specification |
| `docs/ERC8004_INTEGRATION.md` | ERC-8004 contract integration |
| `docs/X402_INTEGRATION.md` | x402 data fetching |
| `docs/SCORING_ALGORITHM.md` | Scoring logic implementation |
| `docs/API_SPEC.md` | REST API design |
| `docs/FRONTEND_SPEC.md` | UI components |
| `docs/DATA_AGGREGATOR.md` | Data combination layer |
| `docs/DATABASE_SETUP.md` | PostgreSQL/Supabase setup |
| `docs/ENVIRONMENT_SETUP.md` | Environment variables |
| `docs/QUICK_START.md` | Build order checklist |
| `docs/BUSINESS_CONTEXT.md` | Vision and market context |
| `docs/PROJECT_HISTORY.md` | This file |

---

## Summary

AgentScore evolved through several iterations:
1. Sonnet's initial plan (rejected for assuming too much)
2. Opus validation-first approach (rejected - market already validated)
3. Opus Solana-only approach (rejected - must be cross-chain)
4. Final architecture: Full ERC-8004 + x402 on Base AND Solana

The documentation is now comprehensive. Claude Code should be able to build the entire application by following the docs in order, starting with `CLAUDE.md`.

---

*This document exists to give Claude Code the full context of planning decisions. Read alongside BUSINESS_CONTEXT.md for the complete picture.*
