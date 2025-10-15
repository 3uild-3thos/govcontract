export interface StakeAccountData {
  stakeAccount: string;
  activeStake: number;
  voteAccount: string;
  state?: "active" | "inactive" | "activating" | "deactivating";
}

export interface RawStakeAccountData {
  stake_account: string;
  active_stake: number;
  vote_account: string;
  state?: "active" | "inactive" | "activating" | "deactivating";
}
