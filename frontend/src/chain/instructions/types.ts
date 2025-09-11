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
  programId?: PublicKey;
  network?: string;
  endpoint?: string;
}

export interface CastVoteParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  wallet: any;
  voteAccount?: PublicKey;
  programId?: PublicKey;
  network?: string;
  endpoint?: string;
}

export interface ModifyVoteParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  wallet: any;
  voteAccount?: PublicKey;
  programId?: PublicKey;
  network?: string;
}

export interface CastVoteOverrideParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  stakeAccount: string;
  wallet: any;
  voteAccount?: PublicKey;
  programId?: PublicKey;
  network?: string;
}

export interface SupportProposalParams {
  proposalId: string;
  wallet: any;
  voteAccount?: PublicKey;
  programId?: PublicKey;
  network?: string;
  endpoint?: string;
}

export interface AddMerkleRootParams {
  proposalId: string;
  merkleRootHash: string;
  wallet: any;
  programId?: PublicKey;
  network?: string;
}

export interface FinalizeProposalParams {
  proposalId: string;
  wallet: any;
  programId?: PublicKey;
  network?: string;
}

export interface InitializeIndexParams {
  wallet: any;
  programId?: PublicKey;
  network?: string;
  endpoint?: string;
}

// API response types (based on solgov.online API)
export interface VoteAccountProofResponse {
  meta_merkle_leaf: {
    active_stake: number;
    stake_merkle_root: string;
    vote_account: string;
    voting_wallet: string;
  };
  meta_merkle_proof: string[];
  network: string;
  snapshot_slot: number;
}

export interface StakeAccountProofResponse {
  stake_merkle_leaf: {
    [key: string]: any;
  };
  stake_merkle_proof: string[];
  network: string;
  snapshot_slot: number;
}

export interface VoterSummaryResponse {
  network: string;
  snapshot_slot: number;
  stake_accounts: Array<{
    [key: string]: any;
  }>;
  vote_accounts: Array<{
    active_stake: number;
    vote_account: string;
  }>;
  voting_wallet: string;
}

export interface NetworkMetaResponse {
  network: string;
  slot: number;
  merkle_root: string;
  snapshot_hash: string;
  created_at: string;
}

// Constants
export const BASIS_POINTS_TOTAL = 10000;
export const SNAPSHOT_PROGRAM_ID = new PublicKey("gov4qDhw2rBudqwqhyTHXgJEPSaRdNnAZP3vT7BLwgL");
