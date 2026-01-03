# Quick Start Guide

## 5-Minute Setup

### Step 1: Create Project

```bash
# Navigate to your projects folder
cd "D:\AI Projects"

# Create Next.js project
npx create-next-app@latest agentscore --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd agentscore
```

### Step 2: Install Dependencies

```bash
# Core dependencies
npm install viem @solana/web3.js @supabase/supabase-js jose zod @tanstack/react-query

# shadcn/ui setup
npx shadcn@latest init

# When prompted:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Add components
npx shadcn@latest add button card input badge tabs progress skeleton
```

### Step 3: Set Up Environment

Create `.env.local`:

```env
# Supabase (get from supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# RPC (get from alchemy.com and helius.dev)
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# ERC-8004 (GET REAL ADDRESSES!)
ERC8004_IDENTITY_REGISTRY=0x0000000000000000000000000000000000000000
ERC8004_REPUTATION_REGISTRY=0x0000000000000000000000000000000000000000
ERC8004_VALIDATION_REGISTRY=0x0000000000000000000000000000000000000000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Set Up Database

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run the SQL from `docs/DATABASE_SETUP.md`

### Step 5: Create File Structure

```bash
# Create directories
mkdir -p src/lib/scoring
mkdir -p src/lib/data/erc8004
mkdir -p src/lib/data/x402
mkdir -p src/lib/db
mkdir -p src/lib/utils
mkdir -p src/components
mkdir -p src/types
```

### Step 6: Start Building

Follow this order:

1. **Types** - `src/lib/scoring/types.ts`
2. **Utilities** - `src/lib/utils/addresses.ts`, `formatting.ts`
3. **Database** - `src/lib/db/client.ts`, `queries.ts`
4. **ERC-8004** - `src/lib/data/erc8004/*`
5. **x402** - `src/lib/data/x402/*`
6. **Aggregator** - `src/lib/data/aggregator.ts`
7. **Scoring** - `src/lib/scoring/*`
8. **API Routes** - `src/app/api/*`
9. **Components** - `src/components/*`
10. **Pages** - `src/app/page.tsx`, `src/app/agent/[address]/page.tsx`

### Step 7: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Build Order (Detailed)

### Phase 1: Foundation (Day 1)

```
1. src/lib/scoring/types.ts          <- All TypeScript interfaces
2. src/lib/utils/addresses.ts        <- Address validation
3. src/lib/utils/formatting.ts       <- Number/date formatting
4. src/lib/db/client.ts              <- Supabase client
5. src/lib/db/queries.ts             <- Database queries
```

### Phase 2: Data Layer (Day 2)

```
6. src/lib/data/erc8004/abis.ts      <- Contract ABIs
7. src/lib/data/erc8004/client.ts    <- viem client setup
8. src/lib/data/erc8004/identity.ts  <- Identity registry reader
9. src/lib/data/erc8004/reputation.ts <- Reputation reader
10. src/lib/data/erc8004/validation.ts <- Validation reader
11. src/lib/data/erc8004/index.ts     <- Re-exports

12. src/lib/data/x402/types.ts        <- x402 types
13. src/lib/data/x402/base.ts         <- Base x402 reader
14. src/lib/data/x402/solana.ts       <- Solana x402 reader
15. src/lib/data/x402/index.ts        <- Re-exports

16. src/lib/data/aggregator.ts        <- Combines all data
```

### Phase 3: Scoring Engine (Day 3)

```
17. src/lib/scoring/factors.ts        <- Factor calculations
18. src/lib/scoring/reason-codes.ts   <- Reason code definitions
19. src/lib/scoring/calculator.ts     <- Main scoring algorithm
20. src/lib/scoring/index.ts          <- Re-exports
```

### Phase 4: API (Day 4)

```
21. src/app/api/score/route.ts        <- GET /api/score
22. src/app/api/report/route.ts       <- GET /api/report
23. src/app/api/agents/route.ts       <- GET /api/agents
```

### Phase 5: Frontend (Days 5-6)

```
24. src/components/ScoreGauge.tsx     <- Circular gauge
25. src/components/ScoreCard.tsx      <- Main score display
26. src/components/ScoreBreakdown.tsx <- Factor breakdown
27. src/components/ReasonCodes.tsx    <- Reason code badges
28. src/components/ChainMetrics.tsx   <- Base vs Solana
29. src/components/AgentSearch.tsx    <- Search input
30. src/components/AgentCard.tsx      <- Agent list item

31. src/app/page.tsx                  <- Landing page
32. src/app/agent/[address]/page.tsx  <- Agent profile
33. src/app/agent/[address]/loading.tsx
34. src/app/agent/[address]/error.tsx
35. src/app/agent/[address]/not-found.tsx
```

### Phase 6: Polish (Day 7)

```
36. Add loading states
37. Add error handling
38. Add SEO metadata
39. Mobile responsiveness
40. Final testing
```

---

## Commands Reference

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Format code (if prettier installed)
npx prettier --write .
```

---

## Testing Checklist

Before deployment:

- [ ] Search by Base address works
- [ ] Search by Solana address works
- [ ] Score displays correctly (300-850)
- [ ] All reason codes show
- [ ] Chain metrics display
- [ ] Mobile layout works
- [ ] API returns valid JSON
- [ ] Error states display properly
- [ ] Loading states work

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Vercel

Copy all from `.env.local` to Vercel project settings.

---

## Need Help?

1. Check the docs in `docs/` folder
2. Review the error messages carefully
3. Test individual components in isolation
4. Check browser console for client-side errors
5. Check terminal for server-side errors

---

## Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main build instructions |
| `docs/PROJECT_SPEC.md` | Complete product specification |
| `docs/ERC8004_INTEGRATION.md` | ERC-8004 contract integration |
| `docs/X402_INTEGRATION.md` | x402 transaction data fetching |
| `docs/SCORING_ALGORITHM.md` | Score calculation logic |
| `docs/API_SPEC.md` | REST API endpoints |
| `docs/FRONTEND_SPEC.md` | UI components and pages |
| `docs/DATA_AGGREGATOR.md` | Data combination layer |
| `docs/DATABASE_SETUP.md` | PostgreSQL schema and queries |
| `docs/ENVIRONMENT_SETUP.md` | Environment variables |
| `docs/QUICK_START.md` | This file |
