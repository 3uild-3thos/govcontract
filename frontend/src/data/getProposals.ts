import { BlockchainParams, createProgramWitDummyWallet } from "@/chain";
import {
  ProposalLifecycleStage,
  ProposalRecord,
  ProposalStatus,
  RawProposalAccount,
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

  const data = proposalAccs.map(mapProposalDto);
  console.log("data:", data);
  return data;
};

export function mapProposalDto(
  rawAccount: RawProposalAccount,
  index: number
): ProposalRecord {
  const raw = rawAccount.account;
  const lifecycleStage = getLifecycleStage(raw);
  const status = "finalizing";

  return {
    publicKey: rawAccount.publicKey,
    id: index.toString(),
    simd: `simd${index}`,
    title: raw.title,
    summary: raw.description,
    description: raw.description,
    author: raw.author.toBase58(),

    creationEpoch: raw.creationEpoch.toNumber(),
    startEpoch: raw.startEpoch.toNumber(),
    endEpoch: raw.endEpoch.toNumber(),
    creationTimestamp: raw.creationTimestamp?.toNumber() || 0,
    votingStart: null,
    votingEndsIn: null,

    clusterSupportLamports: raw.clusterSupportLamports?.toNumber() || 0,
    forVotesLamports: raw.forVotesLamports?.toNumber() || 0,
    againstVotesLamports: raw.againstVotesLamports?.toNumber() || 0,
    abstainVotesLamports: raw.abstainVotesLamports?.toNumber() || 0,
    voteCount: raw.voteCount,

    quorumPercent: 60, // TODO ?
    solRequired: 100, // TODO ?
    proposerStakeWeightBp: raw.proposerStakeWeightBp?.toNumber() || 0,

    lifecycleStage,
    status,
    voting: lifecycleStage === "voting",
    finalized: status === "finalizing",

    proposalBump: raw.proposalBump,
    index: raw.index,

    vote: {
      state: raw.voting ? "in-progress" : "finished",
      lastUpdated: "raw.voteCount.toString()",
    },
  };
}

function normalizeLifecycleStage(value: string): ProposalLifecycleStage {
  if (["support", "voting", "finalized"].includes(value))
    return value as ProposalLifecycleStage;
  return "support";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeStatus(value: string): ProposalStatus {
  if (["active", "finalizing", "finalized"].includes(value))
    return value as ProposalStatus;
  return "active";
}

const getLifecycleStage = (raw: RawProposalAccount["account"]) => {
  return normalizeLifecycleStage(raw.voting ? "voting" : "finalized");
};
