# AgentScore - Business Context & Vision

## Executive Summary

**AgentScore** is the "FICO for AI Agents" - a cross-chain credit scoring system that aggregates trust data from ERC-8004 (identity, reputation, validation) and x402 (transaction history on Base and Solana) into a unified 300-850 credit score.

## The Problem

The AI agent economy is exploding, but there's no unified way to evaluate agent trustworthiness:

- **Buyers** can't easily assess which agents are reliable before hiring them
- **Agents** can't prove their track record in a portable, verifiable way
- **Data exists** but is fragmented across multiple chains and protocols
- **Trust is critical** for autonomous agent-to-agent commerce

## Market Validation

### Live Ecosystem Data (from x402scan.com)

**Base Network (24h stats):**
- 562K+ transactions
- $39K+ volume
- 10.87K buyers
- 406 sellers

**Solana Network (24h stats):**
- 522K+ transactions
- $25K+ volume
- 966 buyers
- 129 sellers (growing)

**30-Day Totals:**
- 61M+ total transactions
- $7.24M+ volume
- 62K+ buyers
- 10K+ sellers

### Why Now?

1. **x402 Protocol** launched May 2025, saw +10,000% growth in October 2025
2. **ERC-8004** provides the missing trust layer for agent identity
3. **Agent economy** projected to grow from $4.8B to $47.5B by 2030
4. **First mover advantage** - no one else is doing cross-chain agent credit scoring

## The Solution

AgentScore aggregates data from:

### ERC-8004 (on Base/Ethereum)
- **Identity Registry**: Agent NFT-based identity, metadata, linked wallet addresses
- **Reputation Registry**: Client feedback scores (0-100), tags, proof of payment links
- **Validation Registry**: Third-party validation results, TEE attestations

### x402 (on Base AND Solana)
- Transaction count and volume
- Unique buyer relationships
- Activity frequency and recency
- Commercial performance trends

### The Output
- **Single Score**: 300-850 (like FICO)
- **Grade**: Excellent, Very Good, Good, Fair, Poor
- **Reason Codes**: Explain what's helping/hurting the score
- **Full Report**: Breakdown by factor, chain-specific metrics, history

## Key Design Decisions

### Why Cross-Chain from Day 1?

The founder explicitly stated: "There is no V2, THIS is it. We MUST utilize BOTH x402 and ERC-8004 protocol for this to function properly."

- Base has more volume currently
- Solana is growing rapidly
- Agents operate across chains
- Cross-chain presence is itself a trust signal

### Why Not Just Use ERC-8004?

ERC-8004 provides identity and reputation, but:
- Reputation feedback is opt-in (agents must authorize)
- Many agents have x402 transaction history but no ERC-8004 registration yet
- Transaction data is objective (can't be gamed as easily)
- Combining both gives the most complete picture

### Why 300-850 Scale?

- Familiar to anyone who knows credit scores
- Provides nuance (vs simple 1-5 stars)
- Room for differentiation at all levels
- Psychologically meaningful thresholds (700+ = "good")

## Scoring Philosophy

### Factors and Weights

| Factor | Weight | Rationale |
|--------|--------|-----------|
| Transaction History | 27% | Volume demonstrates real commercial value |
| Activity Level | 18% | Consistency matters for reliability |
| Reputation | 18% | Direct feedback from clients |
| Buyer Diversity | 14% | Not dependent on single client |
| Validation | 9% | Third-party verification adds trust |
| Longevity | 9% | Track record over time |
| Cross-Chain | 5% | Broader adoption signal |

### Reason Codes

Every score includes reason codes that explain:
- What's helping the score (HIGH_VOLUME, VALIDATED, etc.)
- What's hurting the score (NO_REPUTATION_DATA, NEW_AGENT, etc.)
- What's neutral (SINGLE_CHAIN, NO_VALIDATION)

This transparency is crucial for agents to understand and improve their scores.

## Revenue Model (Future)

### For Agents
- Free basic score lookup
- Paid verification badge ($99-299/year)
- Score monitoring and alerts

### For Buyers/Companies
- Free basic lookups (rate limited)
- API access ($2/query or subscription)
- Bulk scoring for agent marketplaces

### For the Ecosystem
- Integration with agent marketplaces
- Embedded scoring widgets
- Risk assessment APIs

## Competitive Advantage

1. **First mover** in cross-chain agent credit scoring
2. **Protocol-level integration** with ERC-8004 (founder has direct connection to protocol creator)
3. **Comprehensive data** from multiple sources
4. **Transparent methodology** (reason codes, factor breakdown)
5. **No lock-in** - score is based on public on-chain data

## Technical Requirements

### Non-Negotiables (from founder)

1. **Full cross-chain support** from day 1 (Base + Solana)
2. **Complete ERC-8004 integration** (all three registries)
3. **No shortcuts** - build it right the first time
4. **Robustness over speed** - quality matters more than launch date

### MVP Scope

- Score lookup by wallet address (Base or Solana)
- Full credit report with breakdown
- Public API for score queries
- Clean, professional web interface
- Mobile-responsive design

### Not in MVP (Future)

- Agent self-registration/claiming
- Score monitoring/alerts
- API key management portal
- Payment integration
- Historical score tracking dashboard

## Brand & Design

### Name: AgentScore

Chosen for:
- Clear, descriptive
- Professional
- Memorable
- Domain-friendly

### Tagline Options
- "The Credit Bureau for AI Agents"
- "Trust, Verified"
- "Know Your Agent"

### Visual Identity

- **Dark theme** (matches crypto/agent aesthetic)
- **Score colors**: Green (excellent) → Red (poor)
- **Clean, data-focused** UI
- **Professional but approachable**

### Logo Concepts
- Stylized "A" with score gauge
- Robot/agent icon with checkmark
- Abstract trust/verification symbol

## Landing Page Content

### Hero Section
```
AgentScore
The Credit Bureau for AI Agents

[Search bar: Enter wallet address...]

Search by Base or Solana wallet address
```

### How It Works Section
```
Three steps:
1. We read agent identity from ERC-8004
2. We analyze transaction history from x402 (Base + Solana)
3. We compute a unified 300-850 trust score
```

### Value Props
```
For Buyers:
- Know before you hire
- Reduce risk in agent interactions
- Verify track record instantly

For Agents:
- Prove your reliability
- Stand out from competitors
- Build portable reputation
```

### Trust Indicators
```
- Data from [X] transactions
- [Y] agents scored
- Powered by ERC-8004 + x402
```

## Success Metrics

### Launch Goals
- Working score calculation for any address
- < 3 second response time
- Mobile-friendly interface
- Clean, bug-free experience

### Growth Goals (30 days post-launch)
- 1,000+ unique score lookups
- 100+ API queries
- Featured in x402/agent ecosystem
- Social proof from early users

## Risks & Mitigations

### Risk: ERC-8004 adoption is low
**Mitigation**: x402 data provides baseline scoring even without ERC-8004 registration

### Risk: Data availability/accuracy
**Mitigation**: Graceful degradation - score with whatever data is available, show confidence indicators

### Risk: Gaming the score
**Mitigation**: Multiple data sources, cross-chain verification, temporal analysis

### Risk: Contract addresses not available
**Mitigation**: Founder has direct connection to ERC-8004 creator, can get addresses

## Timeline

**Target: 1 week to MVP**

- Days 1-2: Project setup, database, core types
- Days 3-4: Data layer (ERC-8004 + x402 readers)
- Days 5-6: Scoring engine, API, frontend
- Day 7: Testing, polish, deploy

## Resources

### Protocol Documentation
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- x402: https://docs.cdp.coinbase.com/x402
- x402scan: https://www.x402scan.com
- 8004scan: https://www.8004scan.io

### Key Contacts
- ERC-8004 protocol creator (founder has connection)
- x402scan team (for potential API access)

## Summary

AgentScore is positioned to become the trust layer for the AI agent economy. By aggregating data from ERC-8004 and x402 across multiple chains, we provide the first comprehensive, cross-chain credit scoring system for autonomous agents.

The market is ready. The infrastructure exists. The need is clear. Let's build it.

---

*This document captures the vision and context from planning conversations. Claude Code should reference this alongside the technical documentation to understand the WHY behind the WHAT.*
