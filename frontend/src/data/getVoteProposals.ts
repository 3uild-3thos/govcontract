import { ProposalRecord } from "@/types/proposals";
import { VoteOverrideAccountData } from "@/types";

export interface VoteProposalData {
  voteAccount: VoteOverrideAccountData;
  proposal: ProposalRecord;
  votePublicKey: string;
}

export const getVoteProposals = (
  voteAccounts: VoteOverrideAccountData[],
  proposals: ProposalRecord[]
): VoteProposalData[] => {
  // Create a map of proposal public keys to proposal data
  const proposalMap = new Map(
    proposals.map((proposal) => [proposal.publicKey.toBase58(), proposal])
  );

  // Combine vote and proposal data
  const result: VoteProposalData[] = [];

  for (const voteAccount of voteAccounts) {
    const proposal = proposalMap.get(voteAccount.proposal.toBase58());

    if (proposal) {
      result.push({
        voteAccount,
        proposal,
        votePublicKey: voteAccount.publicKey.toBase58(),
      });
    }
  }

  return result;
};
