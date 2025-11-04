import BN from "bn.js";

export interface ValidatorVoteAccountData {
  voteAccount: string;
  activeStake: BN;
  nodePubkey: string;
}

export interface RawValidatorVoteAccountData {
  stake_account: string;
  active_stake: number;
  vote_account: string;
}
