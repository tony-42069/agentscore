# ERC-8004 Integration Guide

## Overview

ERC-8004 is the "Trustless Agents" standard that provides three on-chain registries for AI agent identity, reputation, and validation. AgentScore reads from all three registries to incorporate on-chain trust data into the score.

## Contract Addresses

> **IMPORTANT:** You need to get the actual deployed contract addresses. Contact the ERC-8004 creator or check 8004scan.io for deployment info.

```typescript
// These are PLACEHOLDER addresses - get real ones before deployment
const ERC8004_CONTRACTS = {
  // Base Mainnet (eip155:8453)
  base: {
    identityRegistry: '0x...', // Get from 8004scan or ERC-8004 team
    reputationRegistry: '0x...',
    validationRegistry: '0x...',
  },
  // Base Sepolia (eip155:84532) - for testing
  baseSepolia: {
    identityRegistry: '0x...', 
    reputationRegistry: '0x...',
    validationRegistry: '0x...',
  }
};
```

## Contract ABIs

### Identity Registry ABI

```typescript
export const IDENTITY_REGISTRY_ABI = [
  // ERC-721 standard functions
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  
  // ERC-8004 specific
  'function getMetadata(uint256 agentId, string key) view returns (bytes)',
  'function register(string tokenURI) returns (uint256 agentId)',
  'function register(string tokenURI, tuple(string key, bytes value)[] metadata) returns (uint256 agentId)',
  
  // Events
  'event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)',
  'event MetadataSet(uint256 indexed agentId, string indexed indexedKey, string key, bytes value)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
] as const;
```

### Reputation Registry ABI

```typescript
export const REPUTATION_REGISTRY_ABI = [
  // Read functions
  'function getIdentityRegistry() view returns (address)',
  'function getSummary(uint256 agentId, address[] clientAddresses, bytes32 tag1, bytes32 tag2) view returns (uint64 count, uint8 averageScore)',
  'function readFeedback(uint256 agentId, address clientAddress, uint64 index) view returns (uint8 score, bytes32 tag1, bytes32 tag2, bool isRevoked)',
  'function readAllFeedback(uint256 agentId, address[] clientAddresses, bytes32 tag1, bytes32 tag2, bool includeRevoked) view returns (address[] clientAddresses, uint8[] scores, bytes32[] tag1s, bytes32[] tag2s, bool[] revokedStatuses)',
  'function getClients(uint256 agentId) view returns (address[])',
  'function getLastIndex(uint256 agentId, address clientAddress) view returns (uint64)',
  'function getResponseCount(uint256 agentId, address clientAddress, uint64 feedbackIndex, address[] responders) view returns (uint64)',
  
  // Write functions (for reference, we only read)
  'function giveFeedback(uint256 agentId, uint8 score, bytes32 tag1, bytes32 tag2, string fileuri, bytes32 filehash, bytes feedbackAuth)',
  'function revokeFeedback(uint256 agentId, uint64 feedbackIndex)',
  'function appendResponse(uint256 agentId, address clientAddress, uint64 feedbackIndex, string responseUri, bytes32 responseHash)',
  
  // Events
  'event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint8 score, bytes32 indexed tag1, bytes32 tag2, string fileuri, bytes32 filehash)',
  'event FeedbackRevoked(uint256 indexed agentId, address indexed clientAddress, uint64 indexed feedbackIndex)',
  'event ResponseAppended(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, address indexed responder, string responseUri)'
] as const;
```

### Validation Registry ABI

```typescript
export const VALIDATION_REGISTRY_ABI = [
  // Read functions
  'function getIdentityRegistry() view returns (address)',
  'function getValidationStatus(bytes32 requestHash) view returns (address validatorAddress, uint256 agentId, uint8 response, bytes32 tag, uint256 lastUpdate)',
  'function getSummary(uint256 agentId, address[] validatorAddresses, bytes32 tag) view returns (uint64 count, uint8 avgResponse)',
  'function getAgentValidations(uint256 agentId) view returns (bytes32[])',
  'function getValidatorRequests(address validatorAddress) view returns (bytes32[])',
  
  // Write functions (for reference)
  'function validationRequest(address validatorAddress, uint256 agentId, string requestUri, bytes32 requestHash)',
  'function validationResponse(bytes32 requestHash, uint8 response, string responseUri, bytes32 responseHash, bytes32 tag)',
  
  // Events
  'event ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestUri, bytes32 indexed requestHash)',
  'event ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash, uint8 response, string responseUri, bytes32 tag)'
] as const;
```

## Implementation

### File: `src/lib/data/erc8004/client.ts`

```typescript
import { createPublicClient, http, type PublicClient } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Contract addresses (UPDATE THESE)
export const ERC8004_ADDRESSES = {
  base: {
    identityRegistry: '0x...' as `0x${string}`,
    reputationRegistry: '0x...' as `0x${string}`,
    validationRegistry: '0x...' as `0x${string}`,
  },
  baseSepolia: {
    identityRegistry: '0x...' as `0x${string}`,
    reputationRegistry: '0x...' as `0x${string}`,
    validationRegistry: '0x...' as `0x${string}`,
  },
} as const;

// Create viem client for Base
export function createERC8004Client(network: 'base' | 'baseSepolia' = 'base'): PublicClient {
  const chain = network === 'base' ? base : baseSepolia;
  const rpcUrl = process.env.BASE_RPC_URL;
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

// Get contract addresses for network
export function getContractAddresses(network: 'base' | 'baseSepolia' = 'base') {
  return ERC8004_ADDRESSES[network];
}
```

### File: `src/lib/data/erc8004/identity.ts`

```typescript
import { type PublicClient } from 'viem';
import { IDENTITY_REGISTRY_ABI } from './abis';
import { getContractAddresses } from './client';

export interface AgentRegistration {
  agentId: number;
  owner: string;
  tokenUri: string;
  registrationData: AgentRegistrationData | null;
}

export interface AgentRegistrationData {
  type: string;
  name: string;
  description: string;
  image: string;
  endpoints: Array<{
    name: string;
    endpoint: string;
    version?: string;
  }>;
  registrations?: Array<{
    agentId: number;
    agentRegistry: string;
  }>;
  supportedTrust?: string[];
}

export class IdentityRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor(client: PublicClient, network: 'base' | 'baseSepolia' = 'base') {
    this.client = client;
    this.contractAddress = getContractAddresses(network).identityRegistry;
  }

  /**
   * Get the token URI for an agent by ID
   */
  async getTokenUri(agentId: number): Promise<string> {
    const uri = await this.client.readContract({
      address: this.contractAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'tokenURI',
      args: [BigInt(agentId)],
    });
    return uri as string;
  }

  /**
   * Get the owner of an agent NFT
   */
  async getOwner(agentId: number): Promise<string> {
    const owner = await this.client.readContract({
      address: this.contractAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'ownerOf',
      args: [BigInt(agentId)],
    });
    return owner as string;
  }

  /**
   * Get on-chain metadata for an agent
   */
  async getMetadata(agentId: number, key: string): Promise<string | null> {
    try {
      const data = await this.client.readContract({
        address: this.contractAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getMetadata',
        args: [BigInt(agentId), key],
      });
      // Decode bytes to string
      if (data && (data as string).length > 0) {
        return Buffer.from((data as string).slice(2), 'hex').toString('utf8');
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch and parse the registration data from tokenURI
   */
  async getRegistrationData(agentId: number): Promise<AgentRegistration> {
    const [tokenUri, owner] = await Promise.all([
      this.getTokenUri(agentId),
      this.getOwner(agentId),
    ]);

    let registrationData: AgentRegistrationData | null = null;

    try {
      // Fetch the registration JSON (could be IPFS or HTTPS)
      const url = this.resolveUri(tokenUri);
      const response = await fetch(url);
      if (response.ok) {
        registrationData = await response.json();
      }
    } catch (error) {
      console.error(`Failed to fetch registration data for agent ${agentId}:`, error);
    }

    return {
      agentId,
      owner,
      tokenUri,
      registrationData,
    };
  }

  /**
   * Extract wallet addresses from registration data
   */
  extractWallets(registration: AgentRegistration): { base?: string; solana?: string } {
    const wallets: { base?: string; solana?: string } = {};
    
    if (!registration.registrationData?.endpoints) {
      return wallets;
    }

    for (const endpoint of registration.registrationData.endpoints) {
      if (endpoint.name === 'agentWallet') {
        const addr = endpoint.endpoint;
        
        // Parse CAIP-10 format: namespace:chainId:address
        if (addr.startsWith('eip155:8453:')) {
          wallets.base = addr.replace('eip155:8453:', '');
        } else if (addr.startsWith('eip155:84532:')) {
          // Base Sepolia
          wallets.base = addr.replace('eip155:84532:', '');
        } else if (addr.startsWith('solana:')) {
          wallets.solana = addr.replace('solana:', '');
        } else if (addr.startsWith('0x')) {
          // Assume Base if just raw EVM address
          wallets.base = addr;
        } else if (addr.length >= 32 && addr.length <= 44) {
          // Likely Solana address (base58)
          wallets.solana = addr;
        }
      }
    }

    return wallets;
  }

  /**
   * Resolve IPFS or other URI schemes to fetchable URLs
   */
  private resolveUri(uri: string): string {
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '');
      return `https://ipfs.io/ipfs/${cid}`;
    }
    if (uri.startsWith('ar://')) {
      const txId = uri.replace('ar://', '');
      return `https://arweave.net/${txId}`;
    }
    return uri;
  }

  /**
   * Find agent by wallet address (requires indexing or event scanning)
   * This is a simplified version - production should use an indexer
   */
  async findAgentByWallet(walletAddress: string): Promise<number | null> {
    // Option 1: Check on-chain metadata if wallet is stored there
    // Option 2: Use an indexer/subgraph
    // Option 3: Scan Transfer events (expensive, not recommended for production)
    
    // For MVP, we'll need to build an index or use a subgraph
    // This is a placeholder that should be replaced with proper indexing
    console.warn('findAgentByWallet requires indexing implementation');
    return null;
  }
}
```

### File: `src/lib/data/erc8004/reputation.ts`

```typescript
import { type PublicClient } from 'viem';
import { REPUTATION_REGISTRY_ABI } from './abis';
import { getContractAddresses } from './client';

export interface ReputationSummary {
  count: number;
  averageScore: number;
}

export interface FeedbackEntry {
  clientAddress: string;
  score: number;
  tag1: string;
  tag2: string;
  isRevoked: boolean;
}

export class ReputationRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor(client: PublicClient, network: 'base' | 'baseSepolia' = 'base') {
    this.client = client;
    this.contractAddress = getContractAddresses(network).reputationRegistry;
  }

  /**
   * Get reputation summary for an agent
   * @param agentId - The ERC-8004 agent ID
   * @param clientAddresses - Optional filter by specific clients
   * @param tag1 - Optional filter by tag1
   * @param tag2 - Optional filter by tag2
   */
  async getSummary(
    agentId: number,
    clientAddresses: string[] = [],
    tag1: string = '',
    tag2: string = ''
  ): Promise<ReputationSummary> {
    const tag1Bytes = tag1 ? this.stringToBytes32(tag1) : '0x0000000000000000000000000000000000000000000000000000000000000000';
    const tag2Bytes = tag2 ? this.stringToBytes32(tag2) : '0x0000000000000000000000000000000000000000000000000000000000000000';

    const result = await this.client.readContract({
      address: this.contractAddress,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'getSummary',
      args: [BigInt(agentId), clientAddresses as `0x${string}`[], tag1Bytes as `0x${string}`, tag2Bytes as `0x${string}`],
    });

    const [count, averageScore] = result as [bigint, number];

    return {
      count: Number(count),
      averageScore: averageScore,
    };
  }

  /**
   * Get all clients who have given feedback to an agent
   */
  async getClients(agentId: number): Promise<string[]> {
    const clients = await this.client.readContract({
      address: this.contractAddress,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'getClients',
      args: [BigInt(agentId)],
    });
    return clients as string[];
  }

  /**
   * Get all feedback for an agent
   */
  async getAllFeedback(
    agentId: number,
    clientAddresses: string[] = [],
    includeRevoked: boolean = false
  ): Promise<FeedbackEntry[]> {
    const tag1 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
    const tag2 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

    const result = await this.client.readContract({
      address: this.contractAddress,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: 'readAllFeedback',
      args: [BigInt(agentId), clientAddresses as `0x${string}`[], tag1, tag2, includeRevoked],
    });

    const [clients, scores, tag1s, tag2s, revokedStatuses] = result as [string[], number[], string[], string[], boolean[]];

    return clients.map((client, i) => ({
      clientAddress: client,
      score: scores[i],
      tag1: this.bytes32ToString(tag1s[i]),
      tag2: this.bytes32ToString(tag2s[i]),
      isRevoked: revokedStatuses[i],
    }));
  }

  /**
   * Read specific feedback entry
   */
  async readFeedback(
    agentId: number,
    clientAddress: string,
    index: number
  ): Promise<FeedbackEntry | null> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'readFeedback',
        args: [BigInt(agentId), clientAddress as `0x${string}`, BigInt(index)],
      });

      const [score, tag1, tag2, isRevoked] = result as [number, string, string, boolean];

      return {
        clientAddress,
        score,
        tag1: this.bytes32ToString(tag1),
        tag2: this.bytes32ToString(tag2),
        isRevoked,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get the reputation data needed for scoring
   */
  async getReputationForScoring(agentId: number): Promise<{
    feedbackCount: number;
    averageScore: number;
    feedback: FeedbackEntry[];
  }> {
    const [summary, feedback] = await Promise.all([
      this.getSummary(agentId),
      this.getAllFeedback(agentId, [], false), // Exclude revoked
    ]);

    return {
      feedbackCount: summary.count,
      averageScore: summary.averageScore,
      feedback,
    };
  }

  // Helper functions
  private stringToBytes32(str: string): `0x${string}` {
    const hex = Buffer.from(str).toString('hex').padEnd(64, '0');
    return `0x${hex}` as `0x${string}`;
  }

  private bytes32ToString(bytes32: string): string {
    if (!bytes32 || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return '';
    }
    const hex = bytes32.slice(2);
    const str = Buffer.from(hex, 'hex').toString('utf8');
    return str.replace(/\0/g, ''); // Remove null bytes
  }
}
```

### File: `src/lib/data/erc8004/validation.ts`

```typescript
import { type PublicClient } from 'viem';
import { VALIDATION_REGISTRY_ABI } from './abis';
import { getContractAddresses } from './client';

export interface ValidationStatus {
  requestHash: string;
  validatorAddress: string;
  agentId: number;
  response: number; // 0-100, where 0 = failed, 100 = passed
  tag: string;
  lastUpdate: Date;
}

export interface ValidationSummary {
  count: number;
  averageResponse: number;
}

export class ValidationRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;

  constructor(client: PublicClient, network: 'base' | 'baseSepolia' = 'base') {
    this.client = client;
    this.contractAddress = getContractAddresses(network).validationRegistry;
  }

  /**
   * Get validation summary for an agent
   */
  async getSummary(
    agentId: number,
    validatorAddresses: string[] = [],
    tag: string = ''
  ): Promise<ValidationSummary> {
    const tagBytes = tag 
      ? this.stringToBytes32(tag) 
      : '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

    const result = await this.client.readContract({
      address: this.contractAddress,
      abi: VALIDATION_REGISTRY_ABI,
      functionName: 'getSummary',
      args: [BigInt(agentId), validatorAddresses as `0x${string}`[], tagBytes],
    });

    const [count, avgResponse] = result as [bigint, number];

    return {
      count: Number(count),
      averageResponse: avgResponse,
    };
  }

  /**
   * Get all validation request hashes for an agent
   */
  async getAgentValidations(agentId: number): Promise<string[]> {
    const hashes = await this.client.readContract({
      address: this.contractAddress,
      abi: VALIDATION_REGISTRY_ABI,
      functionName: 'getAgentValidations',
      args: [BigInt(agentId)],
    });
    return hashes as string[];
  }

  /**
   * Get status of a specific validation
   */
  async getValidationStatus(requestHash: string): Promise<ValidationStatus | null> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: 'getValidationStatus',
        args: [requestHash as `0x${string}`],
      });

      const [validatorAddress, agentId, response, tag, lastUpdate] = result as [
        string,
        bigint,
        number,
        string,
        bigint
      ];

      return {
        requestHash,
        validatorAddress,
        agentId: Number(agentId),
        response,
        tag: this.bytes32ToString(tag),
        lastUpdate: new Date(Number(lastUpdate) * 1000),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get all validation details for an agent
   */
  async getAllValidations(agentId: number): Promise<ValidationStatus[]> {
    const hashes = await this.getAgentValidations(agentId);
    
    const validations = await Promise.all(
      hashes.map(hash => this.getValidationStatus(hash))
    );

    return validations.filter((v): v is ValidationStatus => v !== null);
  }

  /**
   * Get validation data needed for scoring
   */
  async getValidationForScoring(agentId: number): Promise<{
    totalValidations: number;
    passed: number;
    failed: number;
    averageResponse: number;
    validations: ValidationStatus[];
  }> {
    const [summary, validations] = await Promise.all([
      this.getSummary(agentId),
      this.getAllValidations(agentId),
    ]);

    // Count passed (response >= 70) and failed (response < 70)
    const passed = validations.filter(v => v.response >= 70).length;
    const failed = validations.filter(v => v.response < 70).length;

    return {
      totalValidations: summary.count,
      passed,
      failed,
      averageResponse: summary.averageResponse,
      validations,
    };
  }

  // Helper functions
  private stringToBytes32(str: string): `0x${string}` {
    const hex = Buffer.from(str).toString('hex').padEnd(64, '0');
    return `0x${hex}` as `0x${string}`;
  }

  private bytes32ToString(bytes32: string): string {
    if (!bytes32 || bytes32 === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return '';
    }
    const hex = bytes32.slice(2);
    const str = Buffer.from(hex, 'hex').toString('utf8');
    return str.replace(/\0/g, '');
  }
}
```

### File: `src/lib/data/erc8004/index.ts`

```typescript
// Re-export everything from ERC-8004 module
export * from './client';
export * from './identity';
export * from './reputation';
export * from './validation';
export * from './abis';

// Convenience function to create all readers
import { createERC8004Client } from './client';
import { IdentityRegistryReader } from './identity';
import { ReputationRegistryReader } from './reputation';
import { ValidationRegistryReader } from './validation';

export interface ERC8004Readers {
  identity: IdentityRegistryReader;
  reputation: ReputationRegistryReader;
  validation: ValidationRegistryReader;
}

export function createERC8004Readers(network: 'base' | 'baseSepolia' = 'base'): ERC8004Readers {
  const client = createERC8004Client(network);
  
  return {
    identity: new IdentityRegistryReader(client, network),
    reputation: new ReputationRegistryReader(client, network),
    validation: new ValidationRegistryReader(client, network),
  };
}
```

## Usage Example

```typescript
import { createERC8004Readers } from '@/lib/data/erc8004';

async function getAgentERC8004Data(agentId: number) {
  const readers = createERC8004Readers('base');
  
  // Get identity data
  const registration = await readers.identity.getRegistrationData(agentId);
  const wallets = readers.identity.extractWallets(registration);
  
  // Get reputation data
  const reputation = await readers.reputation.getReputationForScoring(agentId);
  
  // Get validation data
  const validation = await readers.validation.getValidationForScoring(agentId);
  
  return {
    identity: {
      agentId,
      name: registration.registrationData?.name,
      description: registration.registrationData?.description,
      imageUrl: registration.registrationData?.image,
      owner: registration.owner,
      wallets,
    },
    reputation: {
      feedbackCount: reputation.feedbackCount,
      averageScore: reputation.averageScore,
    },
    validation: {
      totalValidations: validation.totalValidations,
      passed: validation.passed,
      failed: validation.failed,
    },
  };
}
```

## Important Notes

1. **Contract Addresses:** You MUST get the real deployed contract addresses before going to production. Contact the ERC-8004 team or check 8004scan.io.

2. **Indexing:** For production, implement proper indexing (subgraph or custom indexer) to efficiently find agents by wallet address.

3. **Rate Limiting:** Be mindful of RPC rate limits. Cache data where possible.

4. **Error Handling:** All contract calls should have proper try/catch handling for network errors.

5. **Network Selection:** The code supports both Base mainnet and Base Sepolia testnet. Use environment variables to control which network to connect to.
