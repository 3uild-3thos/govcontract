import { VoteAccount } from "@/chain";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface VoteAccountData {
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
  stake: BN;
  overrideLamports: BN;
  voteTimestamp: BN;
  bump: number;
}

export interface RawVoteAccountDataAccount {
  account: VoteAccount;
  publicKey: PublicKey;
}
