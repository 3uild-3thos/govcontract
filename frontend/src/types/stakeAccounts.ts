export type StakeAccountState =
  | "initialized"
  | "delegated"
  | "inactive"
  | "deactivating"
  | "cooldown";
export interface StakeAccountData {
  stakeAccount: string;
  activeStake: number;
  voteAccount: string | undefined;
  state?: StakeAccountState;
}

export interface RawStakeAccountData {
  stake_account: string;
  active_stake: number;
  vote_account: string;
  state?: StakeAccountState;
}
