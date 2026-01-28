/**
 * ERC-8004 Contract ABIs
 * 
 * Official ABIs from https://github.com/erc-8004/erc-8004-contracts
 * Updated: January 2026
 * 
 * CRITICAL: ReputationRegistry now uses value/valueDecimals format instead of score
 * - OLD: { name: "score", type: "uint8" }
 * - NEW: { name: "value", type: "int128" }, { name: "valueDecimals", type: "uint8" }
 */

export const IDENTITY_REGISTRY_ABI = [
  // ERC-721 standard functions
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  // ERC-8004 specific
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "string", name: "metadataKey", type: "string" },
    ],
    name: "getMetadata",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getAgentWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "register",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "agentURI", type: "string" }],
    name: "register",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: false, internalType: "string", name: "agentURI", type: "string" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
    ],
    name: "Registered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "string", name: "indexedMetadataKey", type: "string" },
      { indexed: false, internalType: "string", name: "metadataKey", type: "string" },
      { indexed: false, internalType: "bytes", name: "metadataValue", type: "bytes" },
    ],
    name: "MetadataSet",
    type: "event",
  },
] as const;

/**
 * ReputationRegistry ABI - UPDATED with value/valueDecimals format
 * 
 * BREAKING CHANGE: The contract now uses:
 * - value: int128 (signed fixed-point number)
 * - valueDecimals: uint8 (0-18, number of decimal places)
 * 
 * Example: value=9977, valueDecimals=2 → 99.77
 * Example: value=560, valueDecimals=0 → 560
 */
export const REPUTATION_REGISTRY_ABI = [
  {
    inputs: [],
    name: "getIdentityRegistry",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getClients",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "clientAddress", type: "address" },
    ],
    name: "getLastIndex",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  // CRITICAL: getSummary now returns (count, summaryValue, summaryValueDecimals)
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address[]", name: "clientAddresses", type: "address[]" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
    ],
    name: "getSummary",
    outputs: [
      { internalType: "uint64", name: "count", type: "uint64" },
      { internalType: "int128", name: "summaryValue", type: "int128" },
      { internalType: "uint8", name: "summaryValueDecimals", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // CRITICAL: readFeedback now returns (value, valueDecimals, tag1, tag2, isRevoked)
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "clientAddress", type: "address" },
      { internalType: "uint64", name: "feedbackIndex", type: "uint64" },
    ],
    name: "readFeedback",
    outputs: [
      { internalType: "int128", name: "value", type: "int128" },
      { internalType: "uint8", name: "valueDecimals", type: "uint8" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
      { internalType: "bool", name: "isRevoked", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // CRITICAL: readAllFeedback now returns arrays of value/valueDecimals
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address[]", name: "clientAddresses", type: "address[]" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
      { internalType: "bool", name: "includeRevoked", type: "bool" },
    ],
    name: "readAllFeedback",
    outputs: [
      { internalType: "address[]", name: "clients", type: "address[]" },
      { internalType: "uint64[]", name: "feedbackIndexes", type: "uint64[]" },
      { internalType: "int128[]", name: "values", type: "int128[]" },
      { internalType: "uint8[]", name: "valueDecimals", type: "uint8[]" },
      { internalType: "string[]", name: "tag1s", type: "string[]" },
      { internalType: "string[]", name: "tag2s", type: "string[]" },
      { internalType: "bool[]", name: "revokedStatuses", type: "bool[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // CRITICAL: giveFeedback now takes (value, valueDecimals) instead of score
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "int128", name: "value", type: "int128" },
      { internalType: "uint8", name: "valueDecimals", type: "uint8" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
      { internalType: "string", name: "endpoint", type: "string" },
      { internalType: "string", name: "feedbackURI", type: "string" },
      { internalType: "bytes32", name: "feedbackHash", type: "bytes32" },
    ],
    name: "giveFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "uint64", name: "feedbackIndex", type: "uint64" },
    ],
    name: "revokeFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "clientAddress", type: "address" },
      { internalType: "uint64", name: "feedbackIndex", type: "uint64" },
      { internalType: "string", name: "responseURI", type: "string" },
      { internalType: "bytes32", name: "responseHash", type: "bytes32" },
    ],
    name: "appendResponse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events - CRITICAL: NewFeedback now has value/valueDecimals
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "clientAddress", type: "address" },
      { indexed: false, internalType: "uint64", name: "feedbackIndex", type: "uint64" },
      { indexed: false, internalType: "int128", name: "value", type: "int128" },
      { indexed: false, internalType: "uint8", name: "valueDecimals", type: "uint8" },
      { indexed: true, internalType: "string", name: "indexedTag1", type: "string" },
      { indexed: false, internalType: "string", name: "tag1", type: "string" },
      { indexed: false, internalType: "string", name: "tag2", type: "string" },
      { indexed: false, internalType: "string", name: "endpoint", type: "string" },
      { indexed: false, internalType: "string", name: "feedbackURI", type: "string" },
      { indexed: false, internalType: "bytes32", name: "feedbackHash", type: "bytes32" },
    ],
    name: "NewFeedback",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "clientAddress", type: "address" },
      { indexed: true, internalType: "uint64", name: "feedbackIndex", type: "uint64" },
    ],
    name: "FeedbackRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "clientAddress", type: "address" },
      { indexed: false, internalType: "uint64", name: "feedbackIndex", type: "uint64" },
      { indexed: true, internalType: "address", name: "responder", type: "address" },
      { indexed: false, internalType: "string", name: "responseURI", type: "string" },
      { indexed: false, internalType: "bytes32", name: "responseHash", type: "bytes32" },
    ],
    name: "ResponseAppended",
    type: "event",
  },
] as const;

export const VALIDATION_REGISTRY_ABI = [
  {
    inputs: [],
    name: "getIdentityRegistry",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "requestHash", type: "bytes32" }],
    name: "getValidationStatus",
    outputs: [
      { internalType: "address", name: "validatorAddress", type: "address" },
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "uint8", name: "response", type: "uint8" },
      { internalType: "bytes32", name: "responseHash", type: "bytes32" },
      { internalType: "string", name: "tag", type: "string" },
      { internalType: "uint256", name: "lastUpdate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address[]", name: "validatorAddresses", type: "address[]" },
      { internalType: "string", name: "tag", type: "string" },
    ],
    name: "getSummary",
    outputs: [
      { internalType: "uint64", name: "count", type: "uint64" },
      { internalType: "uint8", name: "avgResponse", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getAgentValidations",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "validatorAddress", type: "address" }],
    name: "getValidatorRequests",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "validatorAddress", type: "address" },
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "string", name: "requestURI", type: "string" },
      { internalType: "bytes32", name: "requestHash", type: "bytes32" },
    ],
    name: "validationRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "requestHash", type: "bytes32" },
      { internalType: "uint8", name: "response", type: "uint8" },
      { internalType: "string", name: "responseURI", type: "string" },
      { internalType: "bytes32", name: "responseHash", type: "bytes32" },
      { internalType: "string", name: "tag", type: "string" },
    ],
    name: "validationResponse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "validatorAddress", type: "address" },
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: false, internalType: "string", name: "requestURI", type: "string" },
      { indexed: true, internalType: "bytes32", name: "requestHash", type: "bytes32" },
    ],
    name: "ValidationRequest",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "validatorAddress", type: "address" },
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "bytes32", name: "requestHash", type: "bytes32" },
      { indexed: false, internalType: "uint8", name: "response", type: "uint8" },
      { indexed: false, internalType: "string", name: "responseURI", type: "string" },
      { indexed: false, internalType: "bytes32", name: "responseHash", type: "bytes32" },
      { indexed: false, internalType: "string", name: "tag", type: "string" },
    ],
    name: "ValidationResponse",
    type: "event",
  },
] as const;
