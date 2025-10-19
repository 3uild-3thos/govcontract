import { BlockchainParams, createProgramWitDummyWallet } from "@/chain";
import { proposalsMockData } from "@/dummy-data/proposals";
import {
  ProposalLifecycleStage,
  ProposalRecord,
  ProposalStatus,
  RawProposal,
} from "@/types";

// TODO: feel free to create a new file for the blockchain fetching logic, and rename this one to proposalsMapper or smth like that

export const getProposals = async (
  blockchainParams: BlockchainParams
): Promise<ProposalRecord[]> => {
  // TODO: Juan, do your magic here
  // const response = await fetch("SOMEWHERE IN SOLANA BLOCKCHAIN");
  // if (error) throw new Error("Failed to fetch proposals");

  const program = createProgramWitDummyWallet(
    blockchainParams.endpoint
    // params.programId,
  );

  const proposalAccs = await program.account.proposal.all();
  console.log("proposalAccs:", proposalAccs);

  const responsePromise = Promise.resolve(proposalsMockData);

  const rawProposals = await responsePromise; // array of raw objects
  return rawProposals.map(mapProposalDto);
};

export function mapProposalDto(raw: RawProposal): ProposalRecord {
  const lifecycleStage = normalizeLifecycleStage(raw.lifecycle_stage);
  const status = normalizeStatus(raw.status);

  return {
    id: raw.simd,
    simd: raw.simd,
    title: raw.title,
    summary: raw.summary,
    description: raw.description,
    author: raw.author,

    creationEpoch: raw.creation_epoch,
    startEpoch: raw.start_epoch,
    endEpoch: raw.end_epoch,
    creationTimestamp: raw.creation_timestamp,
    votingStart: raw.voting_start ?? null,
    votingEndsIn: raw.voting_ends_in ?? null,

    clusterSupportLamports: raw.cluster_support_lamports,
    forVotesLamports: raw.for_votes_lamports,
    againstVotesLamports: raw.against_votes_lamports,
    abstainVotesLamports: raw.abstain_votes_lamports,
    voteCount: raw.vote_count,

    quorumPercent: raw.quorum_percent,
    solRequired: raw.sol_required,
    proposerStakeWeightBp: raw.proposer_stake_weight_bp,

    lifecycleStage,
    status,
    voting: lifecycleStage === "voting",
    finalized: status === "finalized",

    proposalBump: raw.proposal_bump,
    index: raw.index,

    vote: {
      state: raw.vote_state,
      lastUpdated: raw.vote_last_updated,
    },
  };
}

function normalizeLifecycleStage(value: string): ProposalLifecycleStage {
  if (["support", "voting", "finalized"].includes(value))
    return value as ProposalLifecycleStage;
  return "support";
}

function normalizeStatus(value: string): ProposalStatus {
  if (["active", "finalizing", "finalized"].includes(value))
    return value as ProposalStatus;
  return "active";
}
