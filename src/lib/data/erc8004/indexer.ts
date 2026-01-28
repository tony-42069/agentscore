/**
 * ERC-8004 Subgraph Client for Agent Lookup
 * 
 * Uses The Graph to query agent data from the official Agent0 subgraph.
 * This enables efficient lookups like finding an agent by wallet address.
 */

// Subgraph URLs for different networks
export const SUBGRAPH_URL = {
  sepolia: "https://api.studio.thegraph.com/query/82634/agents-sepolia/v1.4.0",
  baseSepolia:
    "https://api.studio.thegraph.com/query/82634/agents-base-sepolia/v1.4.0", // When available
  base: "https://api.studio.thegraph.com/query/82634/agents-base/v1.4.0", // After mainnet
} as const;

export type SubgraphNetwork = keyof typeof SUBGRAPH_URL;

/**
 * GraphQL query to find agent by owner address
 */
const FIND_AGENT_BY_OWNER_QUERY = `
  query FindAgentByOwner($owner: String!) {
    agents(where: { owner: $owner }) {
      id
      agentId
      owner
      tokenURI
    }
  }
`;

/**
 * GraphQL query to get agent by ID with wallet information
 */
const GET_AGENT_WALLETS_QUERY = `
  query GetAgentWallets($agentId: BigInt!) {
    agents(where: { agentId: $agentId }) {
      id
      agentId
      wallets {
        id
        chain
        walletAddress
      }
    }
  }
`;

/**
 * GraphQL query to get all wallets for an agent
 */
const GET_WALLETS_BY_AGENT_QUERY = `
  query GetWalletsByAgent($agentId: BigInt!) {
    wallets(where: { agentId: $agentId }) {
      id
      chain
      walletAddress
    }
  }
`;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface AgentEntity {
  id: string;
  agentId: string;
  owner: string;
  tokenURI?: string;
  wallets?: WalletEntity[];
}

interface WalletEntity {
  id: string;
  chain: string;
  walletAddress: string;
}

interface AgentsResponse {
  agents: AgentEntity[];
}

interface WalletsResponse {
  wallets: WalletEntity[];
}

/**
 * Execute a GraphQL query against the subgraph
 */
async function executeQuery<T>(
  url: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      console.warn(
        `Subgraph query failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors && json.errors.length > 0) {
      console.warn("GraphQL errors:", json.errors);
      return null;
    }

    return json.data ?? null;
  } catch (error) {
    console.warn("Subgraph query error:", error);
    return null;
  }
}

/**
 * Find agent by wallet address (owner)
 * 
 * @param walletAddress - The owner wallet address
 * @param network - The network to query
 * @returns The agent ID or null if not found
 */
export async function findAgentByWallet(
  walletAddress: string,
  network: SubgraphNetwork = "sepolia"
): Promise<number | null> {
  // Normalize address to lowercase for consistent comparison
  const normalizedAddress = walletAddress.toLowerCase();
  
  const url = SUBGRAPH_URL[network];
  const data = await executeQuery<AgentsResponse>(url, FIND_AGENT_BY_OWNER_QUERY, {
    owner: normalizedAddress,
  });

  if (!data || !data.agents || data.agents.length === 0) {
    return null;
  }

  // Return the first matching agent's ID
  const agentId = parseInt(data.agents[0].agentId, 10);
  return isNaN(agentId) ? null : agentId;
}

/**
 * Get all wallets registered for an agent
 * 
 * @param agentId - The agent ID
 * @param network - The network to query
 * @returns Object with base and solana wallet addresses
 */
export async function getAgentWallets(
  agentId: number,
  network: SubgraphNetwork = "sepolia"
): Promise<{
  base?: string;
  solana?: string;
}> {
  const url = SUBGRAPH_URL[network];
  const wallets: { base?: string; solana?: string } = {};

  // Try to get wallets from the wallets query first
  const data = await executeQuery<WalletsResponse>(
    url,
    GET_WALLETS_BY_AGENT_QUERY,
    { agentId: agentId.toString() }
  );

  if (data && data.wallets && data.wallets.length > 0) {
    for (const wallet of data.wallets) {
      const chain = wallet.chain.toLowerCase();
      
      if (chain === "base" || chain === "ethereum" || chain === "eip155") {
        wallets.base = wallet.walletAddress;
      } else if (chain === "solana") {
        wallets.solana = wallet.walletAddress;
      }
    }
  }

  // Also try the agent query for embedded wallets
  const agentData = await executeQuery<AgentsResponse>(
    url,
    GET_AGENT_WALLETS_QUERY,
    { agentId: agentId.toString() }
  );

  if (agentData && agentData.agents && agentData.agents.length > 0) {
    const agent = agentData.agents[0];
    
    if (agent.wallets) {
      for (const wallet of agent.wallets) {
        const chain = wallet.chain.toLowerCase();
        
        if (chain === "base" || chain === "ethereum" || chain === "eip155") {
          wallets.base = wallet.walletAddress;
        } else if (chain === "solana") {
          wallets.solana = wallet.walletAddress;
        }
      }
    }
  }

  return wallets;
}

/**
 * Check if the subgraph is available for a network
 */
export async function isSubgraphAvailable(
  network: SubgraphNetwork = "sepolia"
): Promise<boolean> {
  const url = SUBGRAPH_URL[network];
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `{ __typename }`,
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
