import { VoteOverrideAccount } from "@/chain";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface VoteOverrideAccountData {
  voteAccount: PublicKey;
  proposal: PublicKey;
  activeStake: number;
  identity?: PublicKey;
  name?: string;
  commission?: number;
  lastVote?: number;
  credits?: number;
  epochCredits?: number;
  activatedStake?: number;
  forVotesBp: BN;
  againstVotesBp: BN;
  abstainVotesBp: BN;
  forVotesLamports: BN;
  againstVotesLamports: BN;
  abstainVotesLamports: BN;
  voteTimestamp: BN;
  bump: number;
}

export interface RawVoteOverrideAccountDataAccount {
  account: VoteOverrideAccount;
  publicKey: PublicKey;
}
