import { VoteAccount } from "@/chain";
import { PublicKey } from "@solana/web3.js";

export interface VoteAccountData {
  voteAccount: string;
  activeStake: number;
  identity?: string;
  commission?: number;
  lastVote?: number;
  credits?: number;
  epochCredits?: number;
  activatedStake?: number;
}

export interface RawVoteAccountDataAccount {
  account: VoteAccount;
  publicKey: PublicKey;
}
export interface RawVoteAccountData {
  vote_account: string;
  active_stake: number;
  identity?: string;
  commission?: number;
  lastVote?: number;
  credits?: number;
  epochCredits?: number;
  activated_stake?: number;
}
