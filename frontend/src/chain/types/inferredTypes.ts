import type { BN, Program, ProgramAccount } from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";
import { GovcontractOLD } from "./OLD.govcontract";

export type GovContract = Program<GovcontractOLD>;

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
  proposal: PublicKey;
  forVotesBp: BN;
  againstVotesBp: BN;
  abstainVotesBp: BN;
  voteTimestamp: BN;
  bump: number;
}

export type Vote = ProgramAccount<RawVote>;

export type Votes = Vote[];
