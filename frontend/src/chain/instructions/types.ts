import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import idl from "@/chain/idl/govcontract.json";
import govV1idl from "@/chain/idl/gov-v1.json";

// Common types
export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface BlockchainParams {
  // programId?: PublicKey;
  network?: string;
  endpoint: string;
}

// Instruction parameter types
export interface CreateProposalParams {
  title: string;
  description: string;
  startEpoch: number;
  votingLengthEpochs: number;
  seed?: number;
  wallet: AnchorWallet | undefined;
  voteAccount?: PublicKey;
}

export interface CastVoteParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  wallet: AnchorWallet | undefined;
  voteAccount?: PublicKey;
}

export interface ModifyVoteParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  wallet: AnchorWallet | undefined;
  voteAccount?: PublicKey;
}

export interface CastVoteOverrideParams {
  proposalId: string;
  forVotesBp: number;
  againstVotesBp: number;
  abstainVotesBp: number;
  stakeAccount: string;
  wallet: AnchorWallet | undefined;
  voteAccount: string;
}

export interface SupportProposalParams {
  proposalId: string;
  wallet: AnchorWallet | undefined;
  voteAccount?: PublicKey;
}

export interface AddMerkleRootParams {
  proposalId: string;
  merkleRootHash: string;
  wallet: AnchorWallet | undefined;
}

export interface FinalizeProposalParams {
  proposalId: string;
  wallet: AnchorWallet | undefined;
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
    [key: string]: unknown;
  };
  stake_merkle_proof: string[];
  network: string;
  snapshot_slot: number;
}

export interface VoterSummaryResponse {
  network: string;
  snapshot_slot: number;
  stake_accounts: Array<{
    [key: string]: unknown;
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
export const SNAPSHOT_PROGRAM_ID = new PublicKey(idl.address);
export const GOV_V1_PROGRAM_ID = new PublicKey(govV1idl.address);
