/**
 * ERC-8004 Contract ABIs
 */

export const IDENTITY_REGISTRY_ABI = [
  // ERC-721 standard functions
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  // ERC-8004 specific
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "key", type: "string" },
    ],
    name: "getMetadata",
    outputs: [{ name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenURI", type: "string" }],
    name: "register",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: false, name: "tokenURI", type: "string" },
      { indexed: true, name: "owner", type: "address" },
    ],
    name: "Registered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

export const REPUTATION_REGISTRY_ABI = [
  {
    inputs: [],
    name: "getIdentityRegistry",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "clientAddresses", type: "address[]" },
      { name: "tag1", type: "bytes32" },
      { name: "tag2", type: "bytes32" },
    ],
    name: "getSummary",
    outputs: [
      { name: "count", type: "uint64" },
      { name: "averageScore", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "clientAddress", type: "address" },
      { name: "index", type: "uint64" },
    ],
    name: "readFeedback",
    outputs: [
      { name: "score", type: "uint8" },
      { name: "tag1", type: "bytes32" },
      { name: "tag2", type: "bytes32" },
      { name: "isRevoked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "clientAddresses", type: "address[]" },
      { name: "tag1", type: "bytes32" },
      { name: "tag2", type: "bytes32" },
      { name: "includeRevoked", type: "bool" },
    ],
    name: "readAllFeedback",
    outputs: [
      { name: "clientAddresses", type: "address[]" },
      { name: "scores", type: "uint8[]" },
      { name: "tag1s", type: "bytes32[]" },
      { name: "tag2s", type: "bytes32[]" },
      { name: "revokedStatuses", type: "bool[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "getClients",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: true, name: "clientAddress", type: "address" },
      { indexed: false, name: "score", type: "uint8" },
      { indexed: true, name: "tag1", type: "bytes32" },
      { indexed: false, name: "tag2", type: "bytes32" },
      { indexed: false, name: "fileuri", type: "string" },
      { indexed: false, name: "filehash", type: "bytes32" },
    ],
    name: "NewFeedback",
    type: "event",
  },
] as const;

export const VALIDATION_REGISTRY_ABI = [
  {
    inputs: [],
    name: "getIdentityRegistry",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "requestHash", type: "bytes32" }],
    name: "getValidationStatus",
    outputs: [
      { name: "validatorAddress", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "response", type: "uint8" },
      { name: "tag", type: "bytes32" },
      { name: "lastUpdate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "validatorAddresses", type: "address[]" },
      { name: "tag", type: "bytes32" },
    ],
    name: "getSummary",
    outputs: [
      { name: "count", type: "uint64" },
      { name: "avgResponse", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "agentId", type: "uint256" }],
    name: "getAgentValidations",
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "validatorAddress", type: "address" },
      { indexed: true, name: "agentId", type: "uint256" },
      { indexed: true, name: "requestHash", type: "bytes32" },
      { indexed: false, name: "response", type: "uint8" },
      { indexed: false, name: "responseUri", type: "string" },
      { indexed: false, name: "tag", type: "bytes32" },
    ],
    name: "ValidationResponse",
    type: "event",
  },
] as const;
