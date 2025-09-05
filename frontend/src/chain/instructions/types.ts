import { PublicKey } from "@solana/web3.js";

// Common types
export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

// Instruction parameter types
export interface CreateProposalParams {
  title: string;
  description: string;
  startEpoch: number;
  votingLengthEpochs: number;
  seed?: number;
  wallet: any; // Wallet adapter
  voteAccount?: PublicKey;
}

export interface CastVoteParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  wallet: any;
  voteAccount?: PublicKey;
}

export interface ModifyVoteParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  wallet: any;
  voteAccount?: PublicKey;
}

export interface CastVoteOverrideParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  stakeAccount: string;
  wallet: any;
  voteAccount?: PublicKey;
}

export interface SupportProposalParams {
  proposalId: string;
  wallet: any;
  voteAccount?: PublicKey;
}

export interface AddMerkleRootParams {
  proposalId: string;
  merkleRootHash: string;
  wallet: any;
}

export interface FinalizeProposalParams {
  proposalId: string;
  wallet: any;
}

export interface InitializeIndexParams {
  wallet: any;
}

// API response types (based on CLI)
export interface VoteAccountProofResponse {
  meta_merkle_leaf: {
    voting_wallet: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface StakeAccountProofResponse {
  stake_merkle_proof: string[];
  stake_merkle_leaf: {
    [key: string]: any;
  };
}

export interface VoterSummaryResponse {
  stake_accounts: Array<{
    stake_account: string;
    [key: string]: any;
  }>;
}

// Constants
export const BASIS_POINTS_TOTAL = 10000;
export const SNAPSHOT_PROGRAM_ID = new PublicKey("gov4qDhw2rBudqwqhyTHXgJEPSaRdNnAZP3vT7BLwgL");
