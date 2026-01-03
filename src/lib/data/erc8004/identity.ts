import { type PublicClient } from "viem";
import { IDENTITY_REGISTRY_ABI } from "./abis";
import { getContractAddresses, type ERC8004Network } from "./client";

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

  constructor(client: PublicClient, network: ERC8004Network = "base") {
    this.client = client;
    this.contractAddress = getContractAddresses(network).identityRegistry;
  }

  /**
   * Get the token URI for an agent by ID
   */
  async getTokenUri(agentId: number): Promise<string> {
    try {
      const uri = await this.client.readContract({
        address: this.contractAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "tokenURI",
        args: [BigInt(agentId)],
      });
      return uri as string;
    } catch (error) {
      console.warn(`Failed to get tokenURI for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get the owner of an agent NFT
   */
  async getOwner(agentId: number): Promise<string> {
    try {
      const owner = await this.client.readContract({
        address: this.contractAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "ownerOf",
        args: [BigInt(agentId)],
      });
      return owner as string;
    } catch (error) {
      console.warn(`Failed to get owner for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get on-chain metadata for an agent
   */
  async getMetadata(agentId: number, key: string): Promise<string | null> {
    try {
      const data = await this.client.readContract({
        address: this.contractAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "getMetadata",
        args: [BigInt(agentId), key],
      });

      if (data && (data as string).length > 2) {
        // Decode hex to string
        const hex = (data as string).slice(2);
        const bytes = Buffer.from(hex, "hex");
        return bytes.toString("utf8").replace(/\0/g, "");
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
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        registrationData = await response.json();
      }
    } catch (error) {
      console.warn(
        `Failed to fetch registration data for agent ${agentId}:`,
        error
      );
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
  extractWallets(registration: AgentRegistration): {
    base?: string;
    solana?: string;
  } {
    const wallets: { base?: string; solana?: string } = {};

    if (!registration.registrationData?.endpoints) {
      return wallets;
    }

    for (const endpoint of registration.registrationData.endpoints) {
      if (endpoint.name === "agentWallet") {
        const addr = endpoint.endpoint;

        // Parse CAIP-10 format: namespace:chainId:address
        if (addr.startsWith("eip155:8453:")) {
          wallets.base = addr.replace("eip155:8453:", "");
        } else if (addr.startsWith("eip155:84532:")) {
          // Base Sepolia
          wallets.base = addr.replace("eip155:84532:", "");
        } else if (addr.startsWith("solana:")) {
          wallets.solana = addr.replace("solana:", "");
        } else if (addr.startsWith("0x")) {
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
    if (uri.startsWith("ipfs://")) {
      const cid = uri.replace("ipfs://", "");
      return `https://ipfs.io/ipfs/${cid}`;
    }
    if (uri.startsWith("ar://")) {
      const txId = uri.replace("ar://", "");
      return `https://arweave.net/${txId}`;
    }
    return uri;
  }

  /**
   * Find agent by wallet address
   * NOTE: This is a placeholder - production should use an indexer
   */
  async findAgentByWallet(walletAddress: string): Promise<number | null> {
    // This would require an indexer or subgraph in production
    // For now, return null to indicate no ERC-8004 registration found
    console.warn(
      "findAgentByWallet requires indexing implementation - returning null"
    );
    return null;
  }
}
