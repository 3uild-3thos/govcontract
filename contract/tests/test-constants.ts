import { randomBytes } from "crypto";
import * as anchor from "@coral-xyz/anchor";

// Shared constants
export const SNAPSHOT_SLOT = new anchor.BN(1000000);
export const VOTE_ACCOUNT_SIZE = 3762;
export const META_MERKLE_ROOT = Array.from(randomBytes(32));
export const BALLOT_ID = new anchor.BN(12345);

// Test data for MetaMerkleProof leaves
export const createTestLeaf = (votingWallet: any, voteAccount: any) => ({
  votingWallet,
  voteAccount,
  stakeMerkleRoot: META_MERKLE_ROOT,
  activeStake: new anchor.BN(100_000 * 1_000_000_000), // 100k SOL in lamports (matches MIN_PROPOSAL_STAKE_LAMPORTS)
});

// Test data for proofs (dummy data)
export const createTestProof = () => [
  Array.from(randomBytes(32)),
  Array.from(randomBytes(32))
];

// Vote parameters for testing
export const TEST_VOTE_PARAMS = {
  for: new anchor.BN(4_000),
  against: new anchor.BN(4_000),
  abstain: new anchor.BN(2_000),
};

export const TEST_VOTE_MODIFY_PARAMS = {
  for: new anchor.BN(4_000),
  against: new anchor.BN(2_000),
  abstain: new anchor.BN(4_000),
};

export const TEST_VOTE_OVERRIDE_PARAMS = {
  for: new anchor.BN(7_000),
  against: new anchor.BN(3_000),
  abstain: new anchor.BN(0),
};

// Proposal creation parameters
export const TEST_PROPOSAL_PARAMS = {
  title: "Proposal1",
  description: "https://github.com/repo/test-proposal",
  startEpoch: new anchor.BN(3),
  votingLengthEpochs: new anchor.BN(3),
};

// Error test parameters
export const ERROR_TEST_PARAMS = {
  emptyTitle: "",
  emptyDescription: "",
  invalidDescription: "not a github link",
  longVotingLength: new anchor.BN(20), // Exceeds MAX_VOTING_EPOCHS (10)
  overflowValue: new anchor.BN("18446744073709551616"), // u64::MAX + 1
};
