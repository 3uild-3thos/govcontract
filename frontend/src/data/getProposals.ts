import { createProgramWitDummyWallet } from "@/chain";
import { getSimd } from "@/hooks";
import { getProposalStatus } from "@/lib/proposals";
import type { ProposalRecord, RawProposalAccount } from "@/types";
import { EpochInfo, VoteAccountInfo } from "@solana/web3.js";

export interface RawVoteAccountsData {
  current: VoteAccountInfo[];
  delinquent: VoteAccountInfo[];
}

export const getProposals = async (
  endpoint: string,
  filters:
    | {
        voting?: boolean;
        finalized?: boolean;
      }
    | undefined,
  epochInfo: EpochInfo,
  voteAccountsData: RawVoteAccountsData
): Promise<ProposalRecord[]> => {
  const program = createProgramWitDummyWallet(endpoint);

  // Fetch proposals
  const proposalAccs = await program.account.proposal.all();
  console.log("voteAccountsData:", voteAccountsData);
  // Calculate total staked lamports from all vote accounts
  const allVotes = [
    ...voteAccountsData.current,
    // ...voteAccountsData.delinquent,
  ];
  const totalStakedLamports = allVotes.reduce(
    (sum, vote) => sum + (vote.activatedStake || 0),
    0
  );

  const currentEpoch = epochInfo.epoch;

  let data = proposalAccs.map((acc, index) =>
    mapProposalDto(acc, index, currentEpoch, totalStakedLamports)
  );

  if (filters) {
    if (filters.voting !== undefined) {
      data = data.filter((proposal) => proposal.voting === filters.voting);
    }
    if (filters.finalized !== undefined) {
      data = data.filter(
        (proposal) => proposal.finalized === filters.finalized
      );
    }
  }

  data = data.sort((a, b) => b.creationTimestamp - a.creationTimestamp);

  return data;
};

export function mapProposalDto(
  rawAccount: RawProposalAccount,
  index: number,
  currentEpoch: number,
  totalStakedLamports: number
): ProposalRecord {
  const raw = rawAccount.account;
  const creationEpoch = raw.creationEpoch.toNumber();
  const clusterSupportLamports = raw.clusterSupportLamports?.toNumber() || 0;
  const consensusResult = rawAccount.account.consensusResult || undefined;
  const finalized = raw.finalized;

  const status = getProposalStatus({
    creationEpoch,
    currentEpoch,
    clusterSupportLamports,
    totalStakedLamports,
    consensusResult,
    finalized,
    voting: raw.voting,
  });

  const simd = getSimd(raw.description);

  return {
    publicKey: rawAccount.publicKey,
    id: index.toString(),
    simd,
    title: raw.title,
    description: raw.description,
    author: raw.author.toBase58(),

    creationEpoch,
    startEpoch: raw.startEpoch.toNumber(),
    endEpoch: raw.endEpoch.toNumber(),
    creationTimestamp: raw.creationTimestamp?.toNumber() || 0,

    clusterSupportLamports,
    forVotesLamports: raw.forVotesLamports?.toNumber() || 0,
    againstVotesLamports: raw.againstVotesLamports?.toNumber() || 0,
    abstainVotesLamports: raw.abstainVotesLamports?.toNumber() || 0,
    voteCount: raw.voteCount,

    quorumPercent: 60, // TODO ?
    solRequired: 100, // TODO ?
    proposerStakeWeightBp: raw.proposerStakeWeightBp?.toNumber() || 0,

    status,
    voting: raw.voting,
    finalized,

    consensusResult,

    proposalBump: raw.proposalBump,
    index: raw.index,

    vote: {
      state: status,
      lastUpdated: "raw.voteCount.toString()",
    },
  };
}
