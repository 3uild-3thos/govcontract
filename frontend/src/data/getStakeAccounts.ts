import { dummyWallets } from "@/dummy-data/wallets";
import { RawStakeAccountData, StakeAccountData } from "@/types/stakeAccounts";

// TODO: feel free to create a new file for the blockchain fetching logic, and rename this one to proposalsMapper or smth like that

export const getStakeAccounts = async (): Promise<StakeAccountData[]> => {
  // TODO: Juan, do your magic here
  // const response = await fetch("SOMEWHERE IN SOLANA BLOCKCHAIN");
  // if (error) throw new Error("Failed to fetch proposals");

  const responsePromise = Promise.resolve(dummyWallets.both.stake_accounts);

  const rawStakeAccounts = await responsePromise; // array of raw objects
  return rawStakeAccounts.map(mapStakeAccountDto);
};

export function mapStakeAccountDto(raw: RawStakeAccountData): StakeAccountData {
  return {
    voteAccount: raw.vote_account,
    activeStake: raw.active_stake,
    stakeAccount: raw.stake_account,
    state: raw.state,
  };
}
