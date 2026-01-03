# README Template for AgentScore

Claude Code should create a README.md in the project root based on this template:

---

# AgentScore

**The Credit Bureau for AI Agents** - A cross-chain credit scoring system that aggregates trust data from ERC-8004 and x402 to compute unified 300-850 credit scores for autonomous AI agents.

## 🎯 What is AgentScore?

AgentScore is the "FICO for AI Agents". As the AI agent economy grows (62K+ buyers, 10K+ sellers, $7M+ monthly volume), there's no standardized way to evaluate agent trustworthiness. AgentScore solves this by:

- **Aggregating on-chain data** from ERC-8004 (identity, reputation, validation) and x402 (transaction history)
- **Computing a unified credit score** (300-850) based on 7 weighted factors
- **Providing transparent breakdowns** with reason codes explaining the score
- **Supporting cross-chain** queries (Base + Solana)

## ✨ Features

- 🔍 **Score Lookup** - Search by any Base or Solana wallet address
- 📊 **Detailed Reports** - Full breakdown of all scoring factors
- 🔗 **Cross-Chain** - Data from both Base and Solana networks
- 🎯 **Reason Codes** - Clear explanations of what affects the score
- 📱 **Mobile-First** - Responsive design for all devices
- ⚡ **Fast API** - RESTful endpoints for programmatic access

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Blockchain**: viem (Base), @solana/web3.js (Solana)
- **Protocols**: ERC-8004, x402

## 📊 Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Transaction History | 27% | Total volume processed |
| Activity Level | 18% | Transaction frequency and recency |
| Reputation | 18% | ERC-8004 feedback scores |
| Buyer Diversity | 14% | Unique buyer relationships |
| Validation | 9% | Third-party verification |
| Longevity | 9% | Time since first transaction |
| Cross-Chain | 5% | Multi-chain presence bonus |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Alchemy account (for Base RPC)
- Helius account (for Solana RPC)

### Installation

```bash
# Clone the repository
git clone https://github.com/tony-42069/agentscore.git
cd agentscore

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations (in Supabase SQL editor)
# See docs/DATABASE_SETUP.md

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# RPC
BASE_RPC_URL=
SOLANA_RPC_URL=

# ERC-8004 Contracts
ERC8004_IDENTITY_REGISTRY=
ERC8004_REPUTATION_REGISTRY=
ERC8004_VALIDATION_REGISTRY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📖 API Documentation

### GET /api/score

Quick score lookup by wallet address.

```bash
curl "https://agentscore.ai/api/score?address=0x..."
```

Response:
```json
{
  "score": 742,
  "grade": "Very Good",
  "reasonCodes": ["HIGH_VOLUME", "DIVERSE_BUYERS", "VALIDATED"],
  "calculatedAt": "2025-01-01T00:00:00Z"
}
```

### GET /api/report

Full credit report with breakdown.

```bash
curl "https://agentscore.ai/api/report?address=0x..."
```

### GET /api/agents

List scored agents with pagination.

```bash
curl "https://agentscore.ai/api/agents?page=1&limit=20&sort=score"
```

## 📁 Project Structure

```
agentscore/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   ├── lib/
│   │   ├── scoring/      # Score calculation
│   │   ├── data/         # Blockchain data fetching
│   │   ├── db/           # Database queries
│   │   └── utils/        # Utilities
│   └── types/            # TypeScript types
├── docs/                 # Documentation
└── public/               # Static assets
```

## 🔗 Resources

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [x402 Protocol](https://docs.cdp.coinbase.com/x402)
- [x402scan Explorer](https://x402scan.com)
- [8004scan Explorer](https://8004scan.io)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

---

Built with ❤️ for the AI Agent Economy
