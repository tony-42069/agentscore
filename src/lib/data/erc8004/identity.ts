import { type PublicClient } from "viem";
import { IDENTITY_REGISTRY_ABI } from "./abis";
import { getContractAddresses, type ERC8004Network } from "./client";
import { findAgentByWallet as findAgentByWalletSubgraph } from "./indexer";

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
  // Support both old and new format
  services?: Array<{
    name: string;
    endpoint: string;
    type?: string;
    version?: string;
  }>;
  // Backwards compatibility
  endpoints?: Array<{
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

// Internal type for processing service/endpoint items
interface ServiceItem {
  name: string;
  endpoint: string;
  type?: string;
  version?: string;
}

export class IdentityRegistryReader {
  private client: PublicClient;
  private contractAddress: `0x${string}`;
  private network: ERC8004Network;

  constructor(client: PublicClient, network: ERC8004Network = "base") {
    this.client = client;
    this.contractAddress = getContractAddresses(network).identityRegistry;
    this.network = network;
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
   * Supports both "endpoints" (old) and "services" (new) formats
   */
  extractWallets(registration: AgentRegistration): {
    base?: string;
    solana?: string;
  } {
    const wallets: { base?: string; solana?: string } = {};

    // Get the service list, preferring "services" over "endpoints" for new format
    const services: ServiceItem[] | undefined =
      registration.registrationData?.services ??
      registration.registrationData?.endpoints;

    if (!services) {
      return wallets;
    }

    for (const service of services) {
      // Check for "agentWallet" or "wallet" service name, or "wallet" type
      if (
        service.name === "agentWallet" ||
        service.name === "wallet" ||
        ("type" in service && service.type === "wallet")
      ) {
        const addr = service.endpoint;

        // Parse CAIP-10 format: namespace:chainId:address
        if (addr.startsWith("eip155:8453:")) {
          wallets.base = addr.replace("eip155:8453:", "");
        } else if (addr.startsWith("eip155:84532:")) {
          // Base Sepolia
          wallets.base = addr.replace("eip155:84532:", "");
        } else if (addr.startsWith("eip155:1:")) {
          // Ethereum Mainnet
          wallets.base = addr.replace("eip155:1:", "");
        } else if (addr.startsWith("eip155:11155111:")) {
          // Sepolia
          wallets.base = addr.replace("eip155:11155111:", "");
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
   * Find agent by wallet address using the subgraph
   * 
   * @param walletAddress - The wallet address to search for
   * @returns The agent ID or null if not found
   */
  async findAgentByWallet(walletAddress: string): Promise<number | null> {
    try {
      const agentId = await findAgentByWalletSubgraph(walletAddress, this.network);
      return agentId;
    } catch (error) {
      console.warn("Error finding agent by wallet:", error);
      return null;
    }
  }
}
