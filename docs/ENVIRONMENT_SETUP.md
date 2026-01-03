# Environment Setup Guide

## Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git
- A code editor (VS Code recommended)

## Accounts Needed

### 1. Supabase (Database)
- Go to https://supabase.com
- Create free account
- Create new project
- Get credentials from Settings > API

### 2. Alchemy (Base RPC)
- Go to https://www.alchemy.com
- Create free account
- Create new app for "Base Mainnet"
- Copy the HTTPS URL

### 3. Helius or QuickNode (Solana RPC)
- Helius: https://helius.dev (recommended, has free tier)
- QuickNode: https://quicknode.com
- Create account and get Solana mainnet RPC URL

### 4. CDP (Optional - for x402 API)
- Go to https://cdp.coinbase.com
- Create account
- Generate API keys if using CDP facilitator API

## Environment Variables

Create `.env.local` in project root:

```env
# ===================
# DATABASE (Supabase)
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===================
# BLOCKCHAIN RPC
# ===================
# Base (via Alchemy)
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Solana (via Helius)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY

# ===================
# ERC-8004 CONTRACTS
# ===================
# IMPORTANT: Get real addresses from 8004scan.io or ERC-8004 team
ERC8004_IDENTITY_REGISTRY=0x0000000000000000000000000000000000000000
ERC8004_REPUTATION_REGISTRY=0x0000000000000000000000000000000000000000
ERC8004_VALIDATION_REGISTRY=0x0000000000000000000000000000000000000000

# ===================
# CDP API (Optional)
# ===================
CDP_API_KEY=
CDP_API_SECRET=

# ===================
# APP CONFIG
# ===================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Create `.env.example`

Copy this to `.env.example` (without real values) for version control:

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Blockchain RPC
BASE_RPC_URL=
SOLANA_RPC_URL=

# ERC-8004 Contracts (Base)
ERC8004_IDENTITY_REGISTRY=
ERC8004_REPUTATION_REGISTRY=
ERC8004_VALIDATION_REGISTRY=

# CDP API (Optional)
CDP_API_KEY=
CDP_API_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting ERC-8004 Contract Addresses

**CRITICAL**: The code will not work without real contract addresses.

Options:
1. Check https://8004scan.io for deployed contracts
2. Contact the ERC-8004 team directly
3. Check the ERC-8004 GitHub for deployment info
4. If contracts aren't deployed on Base mainnet, use Base Sepolia testnet

For testnet development:
```env
# Base Sepolia (testnet)
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
ERC8004_IDENTITY_REGISTRY=0x... # Sepolia address
```

## Vercel Deployment

### Environment Variables in Vercel

1. Go to your Vercel project
2. Settings > Environment Variables
3. Add all variables from `.env.local`
4. Make sure to set for Production environment

### Important Notes

- `NEXT_PUBLIC_*` variables are exposed to the browser
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `CDP_API_SECRET` server-side only
- Use different RPC URLs for production (consider paid plans for reliability)

## Testing Your Setup

### 1. Test Database Connection

```typescript
// Create test file: scripts/test-db.ts
import { supabaseAdmin } from '../src/lib/db/client';

async function test() {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('count')
    .limit(1);
  
  if (error) {
    console.error('Database connection failed:', error);
  } else {
    console.log('Database connected successfully!');
  }
}

test();
```

### 2. Test RPC Connections

```typescript
// Create test file: scripts/test-rpc.ts
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { Connection } from '@solana/web3.js';

async function testBase() {
  const client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL),
  });
  const blockNumber = await client.getBlockNumber();
  console.log('Base block:', blockNumber);
}

async function testSolana() {
  const connection = new Connection(process.env.SOLANA_RPC_URL!);
  const slot = await connection.getSlot();
  console.log('Solana slot:', slot);
}

testBase();
testSolana();
```

### 3. Test ERC-8004 Contracts

```typescript
// Create test file: scripts/test-erc8004.ts
import { createERC8004Readers } from '../src/lib/data/erc8004';

async function test() {
  const readers = createERC8004Readers('base');
  
  // Try to read from identity registry
  try {
    // This will fail if contract doesn't exist
    const uri = await readers.identity.getTokenUri(1);
    console.log('Identity registry working:', uri);
  } catch (error) {
    console.error('Identity registry failed:', error.message);
  }
}

test();
```

## Troubleshooting

### "Invalid API key"
- Check Supabase credentials are correct
- Ensure you're using the right key (anon vs service role)

### "RPC rate limited"
- You've exceeded free tier limits
- Upgrade to paid plan or add caching

### "Contract call failed"
- Contract address is wrong
- Contract not deployed on this network
- Check you're using the right network (mainnet vs testnet)

### "Cannot find module"
- Run `npm install`
- Check tsconfig paths are correct

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets in client-side code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only used server-side
- [ ] RPC URLs don't expose API keys in logs
- [ ] API keys have appropriate rate limits
