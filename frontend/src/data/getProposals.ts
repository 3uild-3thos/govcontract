import { BlockchainParams, createProgramWitDummyWallet } from "@/chain";
import { getSimd } from "@/hooks";
import { getProposalStatus } from "@/lib/proposals";
import type { ProposalRecord, RawProposalAccount } from "@/types";


export const getProposals = async (
  blockchainParams: BlockchainParams
): Promise<ProposalRecord[]> => {
  const program = createProgramWitDummyWallet(
    blockchainParams.endpoint
  );

  const proposalAccs = await program.account.proposal.all();
  console.log("proposalAccs:", proposalAccs);

  const data = proposalAccs.map(mapProposalDto);
  console.log("data:", data);
  return data;
};

export function mapProposalDto(
  rawAccount: RawProposalAccount,
  index: number
): ProposalRecord {
  const raw = rawAccount.account;
  const status = getProposalStatus(raw.voting, raw.finalized);
  const simd = getSimd(raw.description);

  return {
    publicKey: rawAccount.publicKey,
    id: index.toString(),
    simd,
    title: raw.title,
    summary: raw.description,
    description: raw.description,
    author: raw.author.toBase58(),

    creationEpoch: raw.creationEpoch.toNumber(),
    startEpoch: raw.startEpoch.toNumber(),
    endEpoch: raw.endEpoch.toNumber(),
    creationTimestamp: raw.creationTimestamp?.toNumber() || 0,

    clusterSupportLamports: raw.clusterSupportLamports?.toNumber() || 0,
    forVotesLamports: raw.forVotesLamports?.toNumber() || 0,
    againstVotesLamports: raw.againstVotesLamports?.toNumber() || 0,
    abstainVotesLamports: raw.abstainVotesLamports?.toNumber() || 0,
    voteCount: raw.voteCount,

    quorumPercent: 60, // TODO ?
    solRequired: 100, // TODO ?
    proposerStakeWeightBp: raw.proposerStakeWeightBp?.toNumber() || 0,

    status,
    voting: raw.voting,
    finalized: raw.finalized,

    proposalBump: raw.proposalBump,
    index: raw.index,

    vote: {
      state: status,
      lastUpdated: "raw.voteCount.toString()",
    },
  };
}
