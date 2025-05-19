import type { BN, Program, ProgramAccount } from "@coral-xyz/anchor";
import type { Govcontract } from "./govcontract";

import { PublicKey } from "@solana/web3.js";

export type GovContract = Program<Govcontract>;

export interface Proposal {
  author: PublicKey;
  title: string;
  description: string;
  creation_epoch: BN;
  startEpoch: BN;
  endEpoch: BN;
  proposerStakeWeightBp: BN;
  clusterSupportBp: BN;
  forVotesBp: BN;
  againstVotesBp: BN;
  abstainVotesBp: BN;
  voting: boolean;
  finalized: boolean;
  proposalBump: number;
}

export interface Support {
  proposal: PublicKey;
  validator: PublicKey;
  bump: number;
}

interface RawVote {
  proposalId: PublicKey;
  forVotesBp: BN;
  againstVotesBp: BN;
  abstainVotesBp: BN;
  voteTimestamp: BN;
  bump: number;
}

export type Vote = ProgramAccount<RawVote>;

export type Votes = Vote[];
