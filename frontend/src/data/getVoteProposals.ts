import { OldVoteAccountData } from "@/types/voteAccounts";
import { ProposalRecord } from "@/types/proposals";
import { StakeAccountData } from "@/types/stakeAccounts";

export interface VoteProposalData {
  voteAccount: OldVoteAccountData;
  proposal: ProposalRecord;
  votePublicKey: string;
}

export const getVoteProposals = (
  voteAccounts: OldVoteAccountData[],
  proposals: ProposalRecord[],
  stakeAccount: StakeAccountData
): VoteProposalData[] => {
  // If the stake account is not delegated to a validator, return empty array
  if (!stakeAccount.voteAccount) {
    return [];
  }

  // Find votes where the validator field matches the stake account's delegated validator
  const validatorVotes = voteAccounts.filter((voteAccount) => {
    return voteAccount.identity?.toBase58() === stakeAccount.voteAccount;
  });

  // Create a map of proposal public keys to proposal data
  const proposalMap = new Map(
    proposals.map((proposal) => [proposal.publicKey.toBase58(), proposal])
  );

  // Combine vote and proposal data
  const result: VoteProposalData[] = [];

  for (const voteAccount of validatorVotes) {
    const proposal = proposalMap.get(voteAccount.proposal.toBase58());

    if (proposal) {
      result.push({
        voteAccount,
        proposal,
        votePublicKey: voteAccount.voteAccount.toBase58(),
      });
    }
  }

  return result;
};
