# CLAUDE.md - AgentScore Build Instructions

## ⚠️ READ CONTEXT FIRST

Before writing any code, read these documents to understand the full project context:

1. **`docs/BUSINESS_CONTEXT.md`** - Why we're building this, market validation, vision
2. **`docs/PROJECT_HISTORY.md`** - Key decisions from planning conversations

These explain the WHY behind all architecture decisions.

---

## 🔄 GitHub Repository & Version Control

### Repository
**URL**: https://github.com/tony-42069/agentscore

### CRITICAL: PR Workflow

**You MUST submit a Pull Request after completing each significant milestone:**

1. **After Project Setup** - Initial Next.js project with dependencies
2. **After Core Types** - All TypeScript interfaces and types
3. **After Database Setup** - Supabase client and queries
4. **After ERC-8004 Integration** - All contract readers
5. **After x402 Integration** - Both Base and Solana readers
6. **After Scoring Engine** - Calculator, factors, reason codes
7. **After API Routes** - All three endpoints working
8. **After Each Major Component** - ScoreCard, ScoreGauge, etc.
9. **After Landing Page** - Complete home page
10. **After Agent Profile Page** - Complete profile page
11. **Before Final Deployment** - All features complete

### PR Process

```bash
# After completing a milestone:
git add .
git commit -m "feat: [describe what was completed]"
git push origin main
# OR create a branch and PR:
git checkout -b feature/[milestone-name]
git add .
git commit -m "feat: [describe what was completed]"
git push origin feature/[milestone-name]
# Then create PR on GitHub
```

### Commit Message Format
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `style:` - Formatting, styling
- `test:` - Tests

### README.md

**Create a README.md file in the root directory** with:
- Project description
- Features list
- Tech stack
- Setup instructions
- Environment variables needed
- API documentation
- License

---

## Key Requirements (Non-Negotiable)

1. **Cross-chain from day 1** - MUST support both Base AND Solana
2. **Full ERC-8004 integration** - All three registries (Identity, Reputation, Validation)
3. **Full x402 integration** - Transaction data from BOTH chains
4. **No shortcuts** - Build it robust, quality over speed
5. **This IS the final product** - No "v2 later" thinking
6. **Submit PRs regularly** - After every significant milestone

---

## Project Overview

You are building **AgentScore** - "FICO for AI Agents". A cross-chain credit bureau that aggregates trust data from ERC-8004 (on Base) and x402 transactions (on both Base and Solana) to compute a unified 300-850 credit score.

### Market Context

The ecosystem is LIVE and growing:
- 500K+ daily transactions on x402
- $39K+ daily volume on Base, $25K+ on Solana
- 62K+ buyers, 10K+ sellers in the ecosystem
- This is validated demand, not speculation

## Quick Reference

- **What:** Credit scoring system for AI agents
- **Data Sources:** ERC-8004 (Base), x402 (Base + Solana)
- **Score Range:** 300-850
- **Tech Stack:** Next.js 14, TypeScript, Tailwind, shadcn/ui, PostgreSQL (Supabase), viem, @solana/web3.js

## Documentation

### Context Documents (Read First)
- `docs/BUSINESS_CONTEXT.md` - Vision, market validation, brand
- `docs/PROJECT_HISTORY.md` - Planning decisions and rationale

### Technical Documents (Read in Order)
1. `docs/PROJECT_SPEC.md` - Complete product specification, architecture, database schema
2. `docs/ERC8004_INTEGRATION.md` - How to read from ERC-8004 contracts
3. `docs/X402_INTEGRATION.md` - How to fetch x402 transaction data
4. `docs/SCORING_ALGORITHM.md` - The scoring algorithm implementation
5. `docs/API_SPEC.md` - API endpoint specifications
6. `docs/FRONTEND_SPEC.md` - UI components and pages
7. `docs/DATA_AGGREGATOR.md` - How data sources combine
8. `docs/DATABASE_SETUP.md` - PostgreSQL schema and queries
9. `docs/ENVIRONMENT_SETUP.md` - Environment variables needed
10. `docs/QUICK_START.md` - Step-by-step build checklist

## Build Order

### Phase 1: Project Setup

```bash
# Clone the repository first
git clone https://github.com/tony-42069/agentscore.git
cd agentscore

# Create Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install dependencies
npm install viem @solana/web3.js jose zod @tanstack/react-query
npm install @supabase/supabase-js
npm install -D @types/node

# Install shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input badge tabs chart progress skeleton

# Create README.md
# Commit and push
git add .
git commit -m "feat: initial project setup with dependencies"
git push origin main
```

### Phase 2: Core Library (in order)

1. **Types** (`src/lib/scoring/types.ts`)
2. **Utilities** (`src/lib/utils/addresses.ts`, `formatting.ts`)
3. **Database** (`src/lib/db/client.ts`, `queries.ts`)
4. **ERC-8004 Client** (`src/lib/data/erc8004/`)
5. **x402 Readers** (`src/lib/data/x402/`)
6. **Data Aggregator** (`src/lib/data/aggregator.ts`)
7. **Scoring Calculator** (`src/lib/scoring/calculator.ts`)

**→ Submit PR after completing Phase 2**

### Phase 3: API Routes

1. `src/app/api/score/route.ts` - Get score by address
2. `src/app/api/report/route.ts` - Get full credit report
3. `src/app/api/agents/route.ts` - List all scored agents

**→ Submit PR after completing Phase 3**

### Phase 4: Frontend

1. `src/app/page.tsx` - Landing page with search
2. `src/app/agent/[address]/page.tsx` - Agent profile + score
3. Components: ScoreCard, ScoreGauge, ScoreBreakdown, ReasonCodes, ChainMetrics, AgentSearch

**→ Submit PR after completing Phase 4**

## Environment Variables

Create `.env.local`:

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Blockchain RPC
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# ERC-8004 Contracts (GET REAL ADDRESSES - see note below)
ERC8004_IDENTITY_REGISTRY=0x...
ERC8004_REPUTATION_REGISTRY=0x...
ERC8004_VALIDATION_REGISTRY=0x...

# CDP API (optional)
CDP_API_KEY=
CDP_API_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚠️ Critical: ERC-8004 Contract Addresses

**THE APP WILL NOT WORK WITHOUT REAL CONTRACT ADDRESSES.**

The founder has a direct connection to the ERC-8004 protocol creator. Get real addresses from:
- https://8004scan.io (check for deployments)
- Direct contact with ERC-8004 team
- For development, use Base Sepolia testnet addresses

Placeholder addresses (`0x000...`) will cause all ERC-8004 calls to fail.

## File Structure

```
agentscore/
├── README.md                           # Project documentation
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   ├── agent/
│   │   │   └── [address]/
│   │   │       ├── page.tsx            # Agent profile
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       └── not-found.tsx
│   │   └── api/
│   │       ├── score/route.ts
│   │       ├── report/route.ts
│   │       └── agents/route.ts
│   ├── lib/
│   │   ├── scoring/
│   │   │   ├── types.ts
│   │   │   ├── calculator.ts
│   │   │   ├── factors.ts
│   │   │   ├── reason-codes.ts
│   │   │   └── index.ts
│   │   ├── data/
│   │   │   ├── erc8004/
│   │   │   │   ├── client.ts
│   │   │   │   ├── abis.ts
│   │   │   │   ├── identity.ts
│   │   │   │   ├── reputation.ts
│   │   │   │   ├── validation.ts
│   │   │   │   └── index.ts
│   │   │   ├── x402/
│   │   │   │   ├── types.ts
│   │   │   │   ├── base.ts
│   │   │   │   ├── solana.ts
│   │   │   │   └── index.ts
│   │   │   └── aggregator.ts
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── queries.ts
│   │   └── utils/
│   │       ├── addresses.ts
│   │       └── formatting.ts
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── ScoreCard.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   ├── ScoreGauge.tsx
│   │   ├── ReasonCodes.tsx
│   │   ├── ChainMetrics.tsx
│   │   ├── AgentSearch.tsx
│   │   └── AgentCard.tsx
│   └── types/
│       └── index.ts
├── docs/                               # All documentation
├── public/
├── .env.local
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Chain Detection Logic

```typescript
function detectChain(address: string): 'base' | 'solana' | 'unknown' {
  // Base (EVM): starts with 0x, 42 chars, valid hex
  if (address.startsWith('0x') && address.length === 42) {
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return 'base';
    }
  }
  // Solana: base58, 32-44 chars
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return 'solana';
  }
  return 'unknown';
}
```

## Data Aggregation Flow

```
User enters address
       │
       ▼
Detect chain (Base or Solana)
       │
       ▼
Look up in ERC-8004 Identity Registry
       │
       ▼
Extract all wallet addresses (Base + Solana)
       │
       ├─── Base wallet ─────► Fetch Base x402 data
       │
       └─── Solana wallet ───► Fetch Solana x402 data
       │
       ▼
Fetch ERC-8004 Reputation + Validation data
       │
       ▼
Combine all data into AgentData
       │
       ▼
Calculate score using algorithm
       │
       ▼
Return ScoreResult with breakdown + reason codes
```

## Error Handling Philosophy

**Graceful degradation is key.** If one data source fails:
- Continue with available data
- Score based on what we have
- Indicate confidence level
- Never crash the user experience

```typescript
// GOOD: Graceful degradation
try {
  const baseData = await fetchBaseData(address);
  agentData.baseTxCount = baseData.count;
} catch (error) {
  console.warn('Base data unavailable:', error);
  // Continue with defaults, don't fail
}

// BAD: Fail hard
const baseData = await fetchBaseData(address); // Throws, kills request
```

## UI Design

### Theme
- Dark mode primary
- Score colors: Green (800+) → Red (below 580)
- Clean, data-focused aesthetic
- Mobile-first responsive

### Key Components
- **ScoreGauge**: Semi-circular gauge showing 300-850 range
- **ScoreCard**: Hero display with score, grade, agent info
- **ScoreBreakdown**: Bar chart of all 7 factors
- **ReasonCodes**: Color-coded badges (green=positive, red=negative)
- **ChainMetrics**: Side-by-side Base vs Solana comparison

## Testing Checklist

Before deployment:
- [ ] Search by Base address works
- [ ] Search by Solana address works
- [ ] Score displays correctly (300-850 range)
- [ ] All 7 factor breakdowns show
- [ ] Reason codes display with correct colors
- [ ] Chain metrics show both chains
- [ ] API returns valid JSON
- [ ] Invalid addresses show error gracefully
- [ ] Loading states work
- [ ] Mobile layout is functional

## Test Addresses

Find real addresses from x402scan.com:
- Go to https://x402scan.com
- Switch between Base and Solana networks
- Find active sellers to test with

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add all environment variables
4. Deploy

### Production Environment
```env
DATABASE_URL=postgresql://...
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/PROD_KEY
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=PROD_KEY
NEXT_PUBLIC_APP_URL=https://agentscore.ai
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Contract address not set" | Get real ERC-8004 addresses |
| "RPC rate limited" | Use paid RPC or add caching |
| "Score is always 300" | Check data fetching, add logging |
| "Transaction not found" | Address may have no x402 history, score with available data |

## Quick Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Linting
npx tsc --noEmit # Type check
```

---

## Summary

AgentScore aggregates:
- **ERC-8004** (Base): Identity + Reputation + Validation
- **x402** (Base + Solana): Transaction history

Into a single **300-850 credit score** with transparent breakdown.

**Read the docs, build phase by phase, commit and push regularly, submit PRs after milestones.**

Let's build the credit bureau for the AI agent economy! 🚀
