import { dummyWallets } from "@/dummy-data/wallets";
import { RawVoteAccountData, VoteAccountData } from "@/types";

// TODO: feel free to create a new file for the blockchain fetching logic, and rename this one to proposalsMapper or smth like that

export const getVoteAccounts = async (): Promise<VoteAccountData[]> => {
  // TODO: Juan, do your magic here
  // const response = await fetch("SOMEWHERE IN SOLANA BLOCKCHAIN");
  // if (error) throw new Error("Failed to fetch proposals");

  const responsePromise = Promise.resolve(dummyWallets.both.vote_accounts);

  const rawVoteAccounts = await responsePromise; // array of raw objects
  return rawVoteAccounts.map(mapVoteAccountDto);
};

export function mapVoteAccountDto(raw: RawVoteAccountData): VoteAccountData {
  return {
    voteAccount: raw.vote_account,
    activeStake: raw.active_stake,
    identity: raw.identity,
    commission: raw.commission,
    lastVote: raw.lastVote,
    credits: raw.credits,
    epochCredits: raw.epochCredits,
    activatedStake: raw.activated_stake,
  };
}
