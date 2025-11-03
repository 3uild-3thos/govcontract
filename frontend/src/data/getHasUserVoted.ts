import { deriveVoteOverridePda, GOVCONTRACT_PROGRAM_ID } from "@/chain";
import { VoteAccountData, VoteOverrideAccountData } from "@/types";
import { StakeAccountData } from "@/types/stakeAccounts";
import { PublicKey } from "@solana/web3.js";

/**
 * Checks if a given stake account has created a vote override account for a specific proposal
 * @param stakeAccounts - Array of wallet stake accounts and its delegated addresses
 * @param stakeAccount - The stake account public key (as string)
 * @param proposalPublicKey - The proposal public key (as string, optional - if not provided, checks across all proposals)
 * @returns The vote override account if found, undefined otherwise
 */
export const getVoteOverrideByStakeAccount = (
  voteOverrideAccounts: VoteOverrideAccountData[],
  stakeAccount: string,
  proposalPublicKey: string
): VoteOverrideAccountData | undefined => {
  return voteOverrideAccounts.find(
    (voteOverrideAccount) =>
      voteOverrideAccount.stakeAccount.toString() === stakeAccount &&
      voteOverrideAccount.proposal.toString() === proposalPublicKey
  );
};

export const getUserHasVoted = async (
  voteOverrideAccounts: VoteOverrideAccountData[]
  // voteAccounts: VoteAccountData[],
): Promise<boolean> => {
  // console.log("voteOverrideAccount:", voteOverrideAccount);

  // const voteAccount = voteAccounts.find(
  //   (voteAccount) =>
  //     voteAccount.proposal.toString() === proposalPublicKey &&
  //     voteAccount.voteAccount.toString() === userPublicKey
  // );

  return voteOverrideAccounts.length > 0;
};
