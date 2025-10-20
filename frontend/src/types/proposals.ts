export type ProposalStatus = "active" | "finalizing" | "finalized";

export type ProposalLifecycleStage = "support" | "voting" | "finalized";

export type ProposalRecord = {
  id: string; // used for table
  // Identity
  simd: string;
  title: string;
  summary: string; // Short text description for list view
  description: string; // GitHub URL (renamed from 'link')
  author: string; // Pubkey

  // Epochs & Timestamps
  creationEpoch: number;
  startEpoch: number;
  endEpoch: number;
  creationTimestamp: number; // Unix timestamp
  votingStart: string | null;
  votingEndsIn: string | null;

  // Vote Data (in lamports)
  clusterSupportLamports: number;
  forVotesLamports: number;
  againstVotesLamports: number;
  abstainVotesLamports: number;
  voteCount: number;

  // Requirements & Metrics
  quorumPercent: number; // Required quorum (e.g., 80)
  solRequired: number; // In SOL (not lamports)
  proposerStakeWeightBp: number; // Basis points

  // Status
  lifecycleStage: ProposalLifecycleStage;
  status: ProposalStatus;
  voting: boolean; // Is currently voting
  finalized: boolean; // Is finalized

  // Technical
  proposalBump: number;
  index: number;

  // Legacy (keep for now)
  vote: {
    state: "in-progress" | "finished";
    lastUpdated: string;
  };
};

// RAW DATA, that will come from our govcontract program. we will later transform into frontend data structure

// Input type depends on your data source
export interface RawProposal {
  simd: string;
  title: string;
  summary: string;
  description: string;
  author: string;
  creation_epoch: number;
  start_epoch: number;
  end_epoch: number;
  creation_timestamp: number;
  voting_start?: string | null;
  voting_ends_in?: string | null;
  cluster_support_lamports: number;
  for_votes_lamports: number;
  against_votes_lamports: number;
  abstain_votes_lamports: number;
  vote_count: number;
  quorum_percent: number;
  sol_required: number;
  proposer_stake_weight_bp: number;
  lifecycle_stage: string;
  status: string;
  proposal_bump: number;
  index: number;
  vote_state: "in-progress" | "finished";
  vote_last_updated: string;
}
