// Export all instruction functions
export { createProposal } from "./createProposal";
export { castVote } from "./castVote";
export { modifyVote } from "./modifyVote";
export { castVoteOverride } from "./castVoteOverride";
export { supportProposal } from "./supportProposal";
export { addMerkleRoot } from "./addMerkleRoot";
export { finalizeProposal } from "./finalizeProposal";

// Export types and helpers
export * from "./types";
export * from "./helpers";

// Re-export commonly used functions with descriptive names
export {
  createProposal as createGovernanceProposal,
  castVote as voteOnProposal,
  modifyVote as changeVote,
  castVoteOverride as overrideVote,
  supportProposal as endorseProposal,
  addMerkleRoot as addProposalMerkleRoot,
  finalizeProposal as closeProposal,
};
