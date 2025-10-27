import { VoteAccountData, VoteOverrideAccountData } from "@/types";

export const getUserHasVoted = async (
  voteOverrideAccounts: VoteOverrideAccountData[],
  voteAccounts: VoteAccountData[],
  userPublicKey: string | undefined,
  proposalPublicKey: string | undefined
): Promise<boolean> => {
  if (voteOverrideAccounts === undefined)
    throw new Error("Vote override accounts are not loaded");

  if (userPublicKey === undefined)
    throw new Error("User public key is not loaded");

  if (proposalPublicKey === undefined)
    throw new Error("Proposal public key is not loaded");

  const voteOverrideAccount = voteOverrideAccounts.find(
    (voteOverrideAccount) =>
      voteOverrideAccount.proposal.toString() === proposalPublicKey &&
      voteOverrideAccount.voteAccount.toString() === userPublicKey
  );

  const voteAccount = voteAccounts.find(
    (voteAccount) =>
      voteAccount.proposal.toString() === proposalPublicKey &&
      voteAccount.voteAccount.toString() === userPublicKey
  );

  return voteOverrideAccount !== undefined || voteAccount !== undefined;
};
