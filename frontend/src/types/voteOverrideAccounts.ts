import { VoteOverrideAccount } from "@/chain";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export interface VoteOverrideAccountData {
  publicKey: PublicKey;
  stakeAccount: PublicKey;
  delegator: PublicKey;
  validator: PublicKey;
  proposal: PublicKey;
  voteAccountValidator: PublicKey;
  forVotesBp: BN;
  againstVotesBp: BN;
  abstainVotesBp: BN;
  forVotesLamports: BN;
  againstVotesLamports: BN;
  abstainVotesLamports: BN;
  stakeAmount: BN;
  voteOverrideTimestamp: BN;
  bump: number;
}

export interface RawVoteOverrideAccountDataAccount {
  account: VoteOverrideAccount;
  publicKey: PublicKey;
}
