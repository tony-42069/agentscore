# Data Aggregation Layer

## Overview

The data aggregator combines data from all sources (ERC-8004 and x402 on both chains) into a unified `AgentData` object for scoring.

## Implementation

### File: `src/lib/data/aggregator.ts`

```typescript
import { createERC8004Readers, type ERC8004Readers } from './erc8004';
import { createX402Readers, getCombinedX402Metrics, type X402Readers } from './x402';
import type { AgentData } from '../scoring/types';

let erc8004Readers: ERC8004Readers | null = null;
let x402Readers: X402Readers | null = null;

function getERC8004Readers(): ERC8004Readers {
  if (!erc8004Readers) {
    erc8004Readers = createERC8004Readers(
      process.env.NODE_ENV === 'production' ? 'base' : 'baseSepolia'
    );
  }
  return erc8004Readers;
}

function getX402Readers(): X402Readers {
  if (!x402Readers) {
    x402Readers = createX402Readers({
      baseRpcUrl: process.env.BASE_RPC_URL!,
      solanaRpcUrl: process.env.SOLANA_RPC_URL!,
      cdpApiKey: process.env.CDP_API_KEY,
      cdpApiSecret: process.env.CDP_API_SECRET,
    });
  }
  return x402Readers;
}

/**
 * Main entry point: Aggregate all data for an agent
 */
export async function aggregateAgentData(
  address: string,
  detectedChain: 'base' | 'solana'
): Promise<AgentData> {
  const data: AgentData = {
    erc8004AgentId: undefined,
    baseWallet: undefined,
    solanaWallet: undefined,
    name: undefined,
    baseTxCount: 0,
    baseVolumeUsd: 0,
    baseUniqueBuyers: 0,
    baseFirstTxAt: null,
    baseLastTxAt: null,
    solanaTxCount: 0,
    solanaVolumeUsd: 0,
    solanaUniqueBuyers: 0,
    solanaFirstTxAt: null,
    solanaLastTxAt: null,
    reputationCount: 0,
    reputationAvgScore: 0,
    validationCount: 0,
    validationPassed: 0,
    validationFailed: 0,
  };

  // Set the known wallet
  if (detectedChain === 'base') {
    data.baseWallet = address;
  } else {
    data.solanaWallet = address;
  }

  // Try to find ERC-8004 identity
  try {
    const identity = await tryGetERC8004Identity(address, detectedChain);
    if (identity) {
      data.erc8004AgentId = identity.agentId;
      data.name = identity.name;
      if (identity.wallets.base) data.baseWallet = identity.wallets.base;
      if (identity.wallets.solana) data.solanaWallet = identity.wallets.solana;

      // Get reputation and validation
      const [reputation, validation] = await Promise.all([
        tryGetReputation(identity.agentId),
        tryGetValidation(identity.agentId),
      ]);

      if (reputation) {
        data.reputationCount = reputation.feedbackCount;
        data.reputationAvgScore = reputation.averageScore;
      }
      if (validation) {
        data.validationCount = validation.totalValidations;
        data.validationPassed = validation.passed;
        data.validationFailed = validation.failed;
      }
    }
  } catch (error) {
    console.warn('ERC-8004 lookup failed:', error);
  }

  // Get x402 metrics from both chains
  try {
    const x402Data = await getCombinedX402Metrics(
      getX402Readers(),
      { base: data.baseWallet, solana: data.solanaWallet }
    );

    if (x402Data.base) {
      data.baseTxCount = x402Data.base.transactionCount;
      data.baseVolumeUsd = x402Data.base.totalVolumeUsd;
      data.baseUniqueBuyers = x402Data.base.uniqueBuyers;
      data.baseFirstTxAt = x402Data.base.firstTransactionAt;
      data.baseLastTxAt = x402Data.base.lastTransactionAt;
    }

    if (x402Data.solana) {
      data.solanaTxCount = x402Data.solana.transactionCount;
      data.solanaVolumeUsd = x402Data.solana.totalVolumeUsd;
      data.solanaUniqueBuyers = x402Data.solana.uniqueBuyers;
      data.solanaFirstTxAt = x402Data.solana.firstTransactionAt;
      data.solanaLastTxAt = x402Data.solana.lastTransactionAt;
    }
  } catch (error) {
    console.warn('x402 data fetch failed:', error);
  }

  return data;
}

async function tryGetERC8004Identity(address: string, chain: 'base' | 'solana') {
  const readers = getERC8004Readers();
  const agentId = await readers.identity.findAgentByWallet(address);
  if (!agentId) return null;

  const registration = await readers.identity.getRegistrationData(agentId);
  const wallets = readers.identity.extractWallets(registration);

  return {
    agentId,
    name: registration.registrationData?.name,
    wallets,
  };
}

async function tryGetReputation(agentId: number) {
  const readers = getERC8004Readers();
  return readers.reputation.getReputationForScoring(agentId);
}

async function tryGetValidation(agentId: number) {
  const readers = getERC8004Readers();
  return readers.validation.getValidationForScoring(agentId);
}

export function detectChain(address: string): 'base' | 'solana' | 'unknown' {
  if (address.startsWith('0x') && address.length === 42) {
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'base';
  }
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'solana';
  return 'unknown';
}
```

## Error Handling Pattern

```typescript
async function fetchWithFallback<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.warn(`${context} failed:`, error);
    return fallback;
  }
}
```
