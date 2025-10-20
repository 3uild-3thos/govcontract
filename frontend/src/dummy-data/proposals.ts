import { RawProposal } from "@/types";

const MOCK_NOW = Date.UTC(2025, 8, 24, 12, 0, 0); // 2025-09-24T12:00:00Z

export const proposalsMockData: RawProposal[] = [
  {
    // Identity
    simd: "SIMD-0326",
    title: "Proposal for the New Alpenglow Consensus Protocol",
    summary:
      "A major overhaul of Solana's core consensus protocol, replacing Proof-of-History and TowerBFT mechanisms with a modern architecture focused on performance, resilience, and simplicity. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators.",
    description: "https://github.com/0326.md",
    author: "9PnPbA4Eny7HsmqkzYjcrFXbChaTC3uLfPqtdvGea4f2",

    // Epochs & Timestamps
    creation_epoch: 650,
    start_epoch: 653,
    end_epoch: 660,
    creation_timestamp: MOCK_NOW - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    voting_start: null,
    voting_ends_in: null,

    // Vote Data (in lamports) - Support phase, no votes yet
    cluster_support_lamports: 145946390400000000, // 80% of required
    for_votes_lamports: 0,
    against_votes_lamports: 0,
    abstain_votes_lamports: 0,
    vote_count: 0,

    // Requirements & Metrics
    quorum_percent: 80,
    sol_required: 182432988,
    proposer_stake_weight_bp: 250, // 2.5%

    // Status
    lifecycle_stage: "support",
    status: "active",

    // Technical
    proposal_bump: 255,
    index: 326,

    // Legacy
    vote_state: "in-progress",
    vote_last_updated: "2025-09-21T09:15:00Z",
  },
  {
    // Identity
    simd: "SIMD-0327",
    title: "Adjust Staking Rewards for Network Security",
    summary:
      "This proposal seeks to adjust validator staking rewards to more effectively support network security and recognize validator contributions. The goal is to ensure that reward distribution is better aligned with the evolving needs of the network and the efforts of its validators.",
    description: "https://github.com/0327.md",
    author: "DqRgKsL8jWvAorPDkGNPtVqTCskqDeVpTa4f56YHsmqk",

    // Epochs & Timestamps
    creation_epoch: 648,
    start_epoch: 651,
    end_epoch: 658,
    creation_timestamp: MOCK_NOW - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    voting_start: "2025-09-28T10:00:00Z",
    voting_ends_in: "2025-10-15T10:00:00Z",

    // Vote Data (in lamports) - Active voting with data
    cluster_support_lamports: 182432988000000000, // 100% of required
    for_votes_lamports: 1234567000000000, // ~1.23M SOL
    against_votes_lamports: 479210000000000, // ~479K SOL
    abstain_votes_lamports: 191284000000000, // ~191K SOL
    vote_count: 2545,

    // Requirements & Metrics
    quorum_percent: 80,
    sol_required: 182432988,
    proposer_stake_weight_bp: 180, // 1.8%

    // Status
    lifecycle_stage: "voting",
    status: "active",

    // Technical
    proposal_bump: 254,
    index: 327,

    // Legacy
    vote_state: "in-progress",
    vote_last_updated: "2025-09-21T09:15:00Z",
  },
  {
    // Identity
    simd: "SIMD-0334",
    title: "Validator Reward Distribution Upgrade",
    summary:
      "Introduce dynamic reward multipliers for validators that exceed uptime and performance benchmarks across multiple epochs.",
    description: "https://github.com/0334.md",
    author: "7K3iFhqVpF4xnwMGWKmQRgNvWqKAoZGmZN6vLkPvJXbd",

    // Epochs & Timestamps
    creation_epoch: 620,
    start_epoch: 623,
    end_epoch: 630,
    creation_timestamp: MOCK_NOW - 45 * 24 * 60 * 60 * 1000, // 45 days ago
    voting_start: "2025-08-15T10:00:00Z",
    voting_ends_in: "2025-08-25T10:00:00Z",

    // Vote Data (in lamports) - Finalized with results
    cluster_support_lamports: 182432988000000000,
    for_votes_lamports: 1567890000000000, // ~1.57M SOL
    against_votes_lamports: 234567000000000, // ~234K SOL
    abstain_votes_lamports: 102543000000000, // ~102K SOL
    vote_count: 3120,

    // Requirements & Metrics
    quorum_percent: 70,
    sol_required: 182432988,
    proposer_stake_weight_bp: 320, // 3.2%

    // Status
    lifecycle_stage: "finalized",
    status: "finalized",

    // Technical
    proposal_bump: 253,
    index: 334,

    // Legacy
    vote_state: "finished",
    vote_last_updated: "2025-09-20T22:40:00Z",
  },
  {
    // Identity
    simd: "SIMD-0338",
    title: "Staker Delegation Transparency Initiative",
    summary:
      "Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators.",
    description: "https://github.com/0338.md",
    author: "EW5YJhVNkPzBhMQWZKMRivaKqJnXMrVDvWbBiXdgaYvn",

    // Epochs & Timestamps
    creation_epoch: 600,
    start_epoch: 603,
    end_epoch: 610,
    creation_timestamp: MOCK_NOW - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    voting_start: "2025-07-01T10:00:00Z",
    voting_ends_in: "2025-07-10T10:00:00Z",

    // Vote Data (in lamports)
    cluster_support_lamports: 182432988000000000,
    for_votes_lamports: 1345678000000000,
    against_votes_lamports: 456789000000000,
    abstain_votes_lamports: 202533000000000,
    vote_count: 2890,

    // Requirements & Metrics
    quorum_percent: 80,
    sol_required: 182432988,
    proposer_stake_weight_bp: 290, // 2.9%

    // Status
    lifecycle_stage: "finalized",
    status: "finalizing",

    // Technical
    proposal_bump: 252,
    index: 338,

    // Legacy

    vote_state: "finished",
    vote_last_updated: "2025-09-18T13:20:00Z",
  },
  {
    // Identity
    simd: "SIMD-0341",
    title: "Validator Infrastructure Hardening",
    summary:
      "Fund upgrades for validator infrastructure redundancy, including geo-distributed failover clusters and shared tooling grants.",
    description: "https://github.com/0341.md",
    author: "3hPrFxPMvHydBE4cYsWqCfGMBxDfayJN8VxQmzqNBUoT",

    // Epochs & Timestamps
    creation_epoch: 580,
    start_epoch: 583,
    end_epoch: 590,
    creation_timestamp: MOCK_NOW - 150 * 24 * 60 * 60 * 1000, // 150 days ago
    voting_start: "2025-05-01T10:00:00Z",
    voting_ends_in: "2025-05-10T10:00:00Z",

    // Vote Data (in lamports)
    cluster_support_lamports: 182432988000000000,
    for_votes_lamports: 1678901000000000,
    against_votes_lamports: 123456000000000,
    abstain_votes_lamports: 102643000000000,
    vote_count: 3340,

    // Requirements & Metrics
    quorum_percent: 80,
    sol_required: 182432988,
    proposer_stake_weight_bp: 410, // 4.1%

    // Status
    lifecycle_stage: "finalized",
    status: "finalized",

    // Technical
    proposal_bump: 251,
    index: 341,

    // Legacy

    vote_state: "finished",
    vote_last_updated: "2025-09-17T06:05:00Z",
  },
  {
    // Identity
    simd: "SIMD-0342",
    title: "Validator Infrastructure Hardening",
    summary:
      "Fund upgrades for validator infrastructure redundancy, including geo-distributed failover clusters and shared tooling grants. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators.",
    description: "https://github.com/0342.md",
    author: "HzYp5bKnG7QTZhcvLbJdRxumFfKDhYxNmXB3jPQqNvAe",

    // Epochs & Timestamps
    creation_epoch: 570,
    start_epoch: 573,
    end_epoch: 580,
    creation_timestamp: MOCK_NOW - 180 * 24 * 60 * 60 * 1000, // 180 days ago
    voting_start: "2025-04-01T10:00:00Z",
    voting_ends_in: "2025-04-10T10:00:00Z",

    // Vote Data (in lamports)
    cluster_support_lamports: 182432988000000000,
    for_votes_lamports: 1789012000000000,
    against_votes_lamports: 98765000000000,
    abstain_votes_lamports: 17223000000000,
    vote_count: 3560,

    // Requirements & Metrics
    quorum_percent: 80,
    sol_required: 182432988,
    proposer_stake_weight_bp: 380, // 3.8%

    // Status
    lifecycle_stage: "finalized",
    status: "finalized",

    // Technical
    proposal_bump: 250,
    index: 342,

    // Legacy

    vote_state: "finished",
    vote_last_updated: "2025-09-16T15:45:00Z",
  },
  {
    // Identity
    simd: "SIMD-0343",
    title: "Validator Infrastructure Hardening",
    summary:
      "Fund upgrades for validator infrastructure redundancy, including geo-distributed failover clusters and shared tooling grants.",
    description: "https://github.com/0343.md",
    author: "A9kVtFmP3jyQRN4ZsGwKLhdVxQTmPkUeXfJhZBcBvRaD",

    // Epochs & Timestamps
    creation_epoch: 560,
    start_epoch: 563,
    end_epoch: 570,
    creation_timestamp: MOCK_NOW - 200 * 24 * 60 * 60 * 1000,
    voting_start: "2025-04-01T10:00:00Z",
    voting_ends_in: "2025-04-10T10:00:00Z",

    // Vote Data (in lamports)
    cluster_support_lamports: 182432988000000000,
    for_votes_lamports: 1890123000000000,
    against_votes_lamports: 76543000000000,
    abstain_votes_lamports: 38334000000000,
    vote_count: 3780,

    // Requirements & Metrics
    quorum_percent: 80,
    sol_required: 182432988,
    proposer_stake_weight_bp: 420,

    // Status
    lifecycle_stage: "finalized",
    status: "finalized",

    // Technical
    proposal_bump: 249,
    index: 343,

    // Legacy

    vote_state: "finished",
    vote_last_updated: "2025-09-16T15:45:00Z",
  },
  // {
  //   // Identity
  //   simd: "SIMD-0344",
  //   title: "Validator Reward Harmonization",
  //   summary:
  //     "Normalize validator reward distribution windows to align with epoch rollovers and improve payout predictability.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0344.md",
  //   author: "BsRQ8mNJvFkXKvDRtqMCgP3xZJ7UhYsKLqBV4fzNwtEM",

  //   // Epochs & Timestamps
  //   creation_epoch: 655,
  //   start_epoch: 658,
  //   endEpoch: 665,
  //   creationTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports)
  //   clusterSupportLamports: 76830000000000000, // 78% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 78,
  //   solRequired: 98500000,
  //   proposerStakeWeightBp: 190,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 248,
  //   index: 344,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-14T08:10:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0345",
  //   title: "Regional Validator Outreach",
  //   summary:
  //     "Provide grants for validator education programs in underrepresented geographic regions.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0345.md",
  //   author: "CnT5VJyDNzPxLkBRmQKjsFH9wAQgZQVTPeLbUhxqgAhm",

  //   // Epochs & Timestamps
  //   creation_epoch: 654,
  //   start_epoch: 657,
  //   endEpoch: 664,
  //   creationTimestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports)
  //   clusterSupportLamports: 46080000000000000, // 72% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 72,
  //   solRequired: 64000000,
  //   proposerStakeWeightBp: 150,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 247,
  //   index: 345,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-13T18:25:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0346",
  //   title: "Validator Alerting Enhancements",
  //   summary:
  //     "Introduce standardized incident alerting requirements for validators to improve coordination during outages.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0346.md",
  //   author: "DykX8mJeqK2SfVg3HBmZRkTvQjNPKRMvEzJQKhYDrPwa",

  //   // Epochs & Timestamps
  //   creation_epoch: 649,
  //   start_epoch: 652,
  //   endEpoch: 659,
  //   creationTimestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-09-20 10:00:00",
  //   votingEndsIn: "2025-09-30 10:00:00",

  //   // Vote Data (in lamports) - Active voting
  //   clusterSupportLamports: 112300000000000000,
  //   forVotesLamports: 890123000000000,
  //   againstVotesLamports: 234567000000000,
  //   abstainVotesLamports: 145310000000000,
  //   voteCount: 1890,

  //   // Requirements & Metrics
  //   quorum_percent: 81,
  //   solRequired: 112300000,
  //   proposerStakeWeightBp: 210,

  //   // Status
  //   lifecycleStage: "voting",
  //   status: "active",
  //   voting: true,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 246,
  //   index: 346,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-21T06:05:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0347",
  //   title: "RPC Performance Enhancements",
  //   summary:
  //     "Upgrade RPC infrastructure guidelines to improve throughput during peak governance activity.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0347.md",
  //   author: "EjtR8kQvPxLmZgKcNhJvQZFkYrPUoBk9XzmTVhfGiYQn",

  //   // Epochs & Timestamps
  //   creation_epoch: 647,
  //   start_epoch: 650,
  //   endEpoch: 657,
  //   creationTimestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-09-18 12:00:00",
  //   votingEndsIn: "2025-09-28 12:00:00",

  //   // Vote Data (in lamports) - Active voting
  //   clusterSupportLamports: 134900000000000000,
  //   forVotesLamports: 1012345000000000,
  //   againstVotesLamports: 156789000000000,
  //   abstainVotesLamports: 100866000000000,
  //   voteCount: 2234,

  //   // Requirements & Metrics
  //   quorum_percent: 84,
  //   solRequired: 134900000,
  //   proposerStakeWeightBp: 230,

  //   // Status
  //   lifecycleStage: "voting",
  //   status: "active",
  //   voting: true,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 245,
  //   index: 347,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-20T16:30:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0348",
  //   title: "Validator Insurance Fund",
  //   summary:
  //     "Create a shared insurance fund to offset slashing incidents for compliant validators.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0348.md",
  //   author: "FksE9YmRqDmTvJgNK3xPzQhWfYcLBnRVjkDpQbMaHxty",

  //   // Epochs & Timestamps
  //   creation_epoch: 646,
  //   start_epoch: 649,
  //   endEpoch: 656,
  //   creationTimestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-09-15 09:00:00",
  //   votingEndsIn: "2025-09-25 09:00:00",

  //   // Vote Data (in lamports) - Active voting
  //   clusterSupportLamports: 205000000000000000,
  //   forVotesLamports: 1456789000000000,
  //   againstVotesLamports: 345678000000000,
  //   abstainVotesLamports: 102533000000000,
  //   voteCount: 2678,

  //   // Requirements & Metrics
  //   quorum_percent: 86,
  //   solRequired: 205000000,
  //   proposerStakeWeightBp: 270,

  //   // Status
  //   lifecycleStage: "voting",
  //   status: "active",
  //   voting: true,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 244,
  //   index: 348,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-19T11:55:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0349",
  //   title: "Validator SLA Enforcement",
  //   summary:
  //     "Enforce minimum uptime requirements for validators participating in governance votes.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0349.md",
  //   author: "GmnR9zTQhyNk8xWb5JvMtVPR5w7RYzPEYPTkrdRPFkwy",

  //   // Epochs & Timestamps
  //   creation_epoch: 625,
  //   start_epoch: 628,
  //   endEpoch: 635,
  //   creationTimestamp: Date.now() - 50 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-08-05 10:00:00",
  //   votingEndsIn: "2025-08-15 10:00:00",

  //   // Vote Data (in lamports) - Finalized
  //   clusterSupportLamports: 175750000000000000,
  //   forVotesLamports: 1678901000000000,
  //   againstVotesLamports: 234567000000000,
  //   abstainVotesLamports: 91532000000000,
  //   voteCount: 3120,

  //   // Requirements & Metrics
  //   quorum_percent: 88,
  //   solRequired: 175750000,
  //   proposerStakeWeightBp: 340,

  //   // Status
  //   lifecycleStage: "finalized",
  //   status: "finalizing",
  //   voting: false,
  //   finalized: true,

  //   // Technical
  //   proposalBump: 243,
  //   index: 349,

  //   // Legacy
  //   vote: {
  //     state: "finished",
  //     lastUpdated: "2025-09-10T07:20:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0350",
  //   title: "Governance Dashboard Refresh",
  //   summary:
  //     "Refresh the governance portal UI to highlight proposal timelines and validator participation.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0350.md",
  //   author: "HnYX8mNKjQRF3xHcLfJhP8ecYKypQsK5jMYmRaYzPBnr",

  //   // Epochs & Timestamps
  //   creation_epoch: 622,
  //   start_epoch: 625,
  //   endEpoch: 632,
  //   creationTimestamp: Date.now() - 55 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-08-01 10:00:00",
  //   votingEndsIn: "2025-08-11 10:00:00",

  //   // Vote Data (in lamports) - Finalized
  //   clusterSupportLamports: 95400000000000000,
  //   forVotesLamports: 1234567000000000,
  //   againstVotesLamports: 456789000000000,
  //   abstainVotesLamports: 213644000000000,
  //   voteCount: 2780,

  //   // Requirements & Metrics
  //   quorum_percent: 82,
  //   solRequired: 95400000,
  //   proposerStakeWeightBp: 260,

  //   // Status
  //   lifecycleStage: "finalized",
  //   status: "finalizing",
  //   voting: false,
  //   finalized: true,

  //   // Technical
  //   proposalBump: 242,
  //   index: 350,

  //   // Legacy
  //   vote: {
  //     state: "finished",
  //     lastUpdated: "2025-09-08T03:15:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0351",
  //   title: "Validator Health API",
  //   summary:
  //     "Publish a standard health reporting API for validators to share live performance data.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0351.md",
  //   author: "JpQ8MZfNkh3xR7ynYHBKQEpRLVaF2cGjTmYmRhzPBsnW",

  //   // Epochs & Timestamps
  //   creation_epoch: 610,
  //   start_epoch: 613,
  //   endEpoch: 620,
  //   creationTimestamp: Date.now() - 75 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-07-10 10:00:00",
  //   votingEndsIn: "2025-07-20 10:00:00",

  //   // Vote Data (in lamports) - Finalized
  //   clusterSupportLamports: 123000000000000000,
  //   forVotesLamports: 1345678000000000,
  //   againstVotesLamports: 345678000000000,
  //   abstainVotesLamports: 213644000000000,
  //   voteCount: 2890,

  //   // Requirements & Metrics
  //   quorum_percent: 80,
  //   solRequired: 123000000,
  //   proposerStakeWeightBp: 280,

  //   // Status
  //   lifecycleStage: "finalized",
  //   status: "finalizing",
  //   voting: false,
  //   finalized: true,

  //   // Technical
  //   proposalBump: 241,
  //   index: 351,

  //   // Legacy
  //   vote: {
  //     state: "finished",
  //     lastUpdated: "2025-09-06T14:45:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0352",
  //   title: "Stake Pool Transparency",
  //   summary:
  //     "Require stake pools to publish validator allocation updates and reward histories.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0352.md",
  //   author: "KzNkgP8MRYqJfnLxHhBXKEGjQyTmZbsVaF2crPBnrWpQ",

  //   // Epochs & Timestamps
  //   creation_epoch: 595,
  //   start_epoch: 598,
  //   endEpoch: 605,
  //   creationTimestamp: Date.now() - 100 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-06-05 10:00:00",
  //   votingEndsIn: "2025-06-15 10:00:00",

  //   // Vote Data (in lamports) - Finalized
  //   clusterSupportLamports: 155000000000000000,
  //   forVotesLamports: 1567890000000000,
  //   againstVotesLamports: 234567000000000,
  //   abstainVotesLamports: 102543000000000,
  //   voteCount: 3340,

  //   // Requirements & Metrics
  //   quorum_percent: 83,
  //   solRequired: 155000000,
  //   proposerStakeWeightBp: 310,

  //   // Status
  //   lifecycleStage: "finalized",
  //   status: "finalized",
  //   voting: false,
  //   finalized: true,

  //   // Technical
  //   proposalBump: 240,
  //   index: 352,

  //   // Legacy
  //   vote: {
  //     state: "finished",
  //     lastUpdated: "2025-09-01T19:30:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0353",
  //   title: "Validator Cooling Period Update",
  //   summary:
  //     "Adjust key rotation cooling periods to reduce downtime during scheduled maintenance.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0353.md",
  //   author: "LmRYqJfKnxHzgPBh8MNKbEGXKQyT2cVaFrPBnrWpQjZb",

  //   // Epochs & Timestamps
  //   creation_epoch: 585,
  //   start_epoch: 588,
  //   endEpoch: 595,
  //   creationTimestamp: Date.now() - 120 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-05-20 10:00:00",
  //   votingEndsIn: "2025-05-30 10:00:00",

  //   // Vote Data (in lamports) - Finalized
  //   clusterSupportLamports: 142000000000000000,
  //   forVotesLamports: 1456789000000000,
  //   againstVotesLamports: 345678000000000,
  //   abstainVotesLamports: 102533000000000,
  //   voteCount: 3120,

  //   // Requirements & Metrics
  //   quorum_percent: 77,
  //   solRequired: 142000000,
  //   proposerStakeWeightBp: 300,

  //   // Status
  //   lifecycleStage: "finalized",
  //   status: "finalized",
  //   voting: false,
  //   finalized: true,

  //   // Technical
  //   proposalBump: 239,
  //   index: 353,

  //   // Legacy
  //   vote: {
  //     state: "finished",
  //     lastUpdated: "2025-08-28T12:05:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0354",
  //   title: "Light Client Incentives",
  //   summary:
  //     "Offer incentives for validators operating light client endpoints to improve mobile access.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0354.md",
  //   author: "MnKQyTzgPBh8XRYqJfLxHbEGKnVaF2crPBnrWpQjZbmL",

  //   // Epochs & Timestamps
  //   creation_epoch: 575,
  //   start_epoch: 578,
  //   endEpoch: 585,
  //   creationTimestamp: Date.now() - 140 * 24 * 60 * 60 * 1000,
  //   votingStart: "2025-05-01 10:00:00",
  //   votingEndsIn: "2025-05-11 10:00:00",

  //   // Vote Data (in lamports) - Finalized
  //   clusterSupportLamports: 118500000000000000,
  //   forVotesLamports: 1234567000000000,
  //   againstVotesLamports: 456789000000000,
  //   abstainVotesLamports: 213644000000000,
  //   voteCount: 2980,

  //   // Requirements & Metrics
  //   quorum_percent: 79,
  //   solRequired: 118500000,
  //   proposerStakeWeightBp: 290,

  //   // Status
  //   lifecycleStage: "finalized",
  //   status: "finalized",
  //   voting: false,
  //   finalized: true,

  //   // Technical
  //   proposalBump: 238,
  //   index: 354,

  //   // Legacy
  //   vote: {
  //     state: "finished",
  //     lastUpdated: "2025-08-25T09:40:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0355",
  //   title: "Validator Security Workshops",
  //   summary:
  //     "Fund quarterly workshops for validators covering security best practices and tooling.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0355.md",
  //   author: "NoPQyTRYqJfzgKnxLhBXKEGHbVaF2crPBnrWpQjZbmL",

  //   // Epochs & Timestamps
  //   creation_epoch: 653,
  //   start_epoch: 656,
  //   endEpoch: 663,
  //   creationTimestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 50505000000000000, // 74% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 74,
  //   solRequired: 68250000,
  //   proposerStakeWeightBp: 160,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 237,
  //   index: 355,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-05T07:10:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0356",
  //   title: "Validator Energy Audit",
  //   summary:
  //     "Commission an energy consumption audit for validator hardware to establish sustainability benchmarks.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0356.md",
  //   author: "PqRSTYzgKnxLhBJfNkQEGHbVaF2crPBnrWpQjZbmLXM",

  //   // Epochs & Timestamps
  //   creation_epoch: 652,
  //   start_epoch: 655,
  //   endEpoch: 662,
  //   creationTimestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 77520000000000000, // 76% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 76,
  //   solRequired: 102000000,
  //   proposerStakeWeightBp: 170,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 236,
  //   index: 356,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-04T11:50:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0357",
  //   title: "Validator Peer Review Council",
  //   summary:
  //     "Establish a review council to evaluate validator grant applications for infrastructure scaling.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0357.md",
  //   author: "QrSTUVWzgKnxLhBJfNkQEGHbVaF2crPBnrWpQjZbmLNY",

  //   // Epochs & Timestamps
  //   creation_epoch: 651,
  //   start_epoch: 654,
  //   endEpoch: 661,
  //   creationTimestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 78080000000000000, // 80% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 80,
  //   solRequired: 97600000,
  //   proposerStakeWeightBp: 200,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 235,
  //   index: 357,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-03T22:30:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0358",
  //   title: "Cross-Chain Governance Bridge",
  //   summary:
  //     "Explore interoperability for governance signals with aligned ecosystems to improve proposal reach.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0358.md",
  //   author: "RsVWXYZagKnxLhBJfNkQEGHbVaF2crPBnrWpQjZbmPQR",

  //   // Epochs & Timestamps
  //   creation_epoch: 649,
  //   start_epoch: 652,
  //   endEpoch: 659,
  //   creationTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 210800000000000000, // 85% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 85,
  //   solRequired: 248000000,
  //   proposerStakeWeightBp: 350,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 234,
  //   index: 358,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-02T17:05:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0359",
  //   title: "Validator Insurance Expansion",
  //   summary:
  //     "Expand insurance coverage tiers for validators taking on additional network duties.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0359.md",
  //   author: "StWXYZabcKnxLhBJfNkQEGHbVaF2crPBnrWpQjZbmQST",

  //   // Epochs & Timestamps
  //   creation_epoch: 648,
  //   start_epoch: 651,
  //   endEpoch: 658,
  //   creationTimestamp: Date.now() - 8 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 176710000000000000, // 82% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 82,
  //   solRequired: 215500000,
  //   proposerStakeWeightBp: 330,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 233,
  //   index: 359,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-01T09:55:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0360",
  //   title: "Validator Health Monitoring APIs",
  //   summary:
  //     "Launch standardized APIs for real-time validator health metrics exposed to integrators.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0360.md",
  //   author: "TuXYZabcdefKnxLhBJfNkQEGHbVaF2crPBnrWpQjZbRT",

  //   // Epochs & Timestamps
  //   creation_epoch: 647,
  //   start_epoch: 650,
  //   endEpoch: 657,
  //   creationTimestamp: Date.now() - 9 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 114872000000000000, // 83% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 83,
  //   solRequired: 138400000,
  //   proposerStakeWeightBp: 220,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 232,
  //   index: 360,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-08-30T13:40:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0361",
  //   title: "Validator Tooling Grants",
  //   summary:
  //     "Provide grants for shared validator tooling focused on monitoring and automation.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0361.md",
  //   author: "UvWXYZabcghiKnxLhBJfNkQEGHbVaF2crPBnrWpQjUV",

  //   // Epochs & Timestamps
  //   creation_epoch: 646,
  //   start_epoch: 649,
  //   endEpoch: 656,
  //   creationTimestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 86385000000000000, // 78% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 78,
  //   solRequired: 110750000,
  //   proposerStakeWeightBp: 195,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 231,
  //   index: 361,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-08-29T20:05:00Z",
  //   },
  // },
  // {
  //   // Identity
  //   simd: "SIMD-0362",
  //   title: "Validator Tooling Grants",
  //   summary:
  //     "Provide grants for shared validator tooling focused on monitoring and automation.",
  //   description:
  //     "https://github.com/solana-foundation/solana-improvement-documents/blob/main/proposals/0362.md",
  //   author: "VwXYZabcdefghiKnxLhBJfNkQEGHbVaF2crPBnrWpQjZbUV",

  //   // Epochs & Timestamps
  //   creation_epoch: 645,
  //   start_epoch: 648,
  //   endEpoch: 655,
  //   creationTimestamp: Date.now() - 11 * 24 * 60 * 60 * 1000,
  //   votingStart: null,
  //   votingEndsIn: null,

  //   // Vote Data (in lamports) - Support phase
  //   clusterSupportLamports: 69600000000000000, // 75% of required
  //   forVotesLamports: 0,
  //   againstVotesLamports: 0,
  //   abstainVotesLamports: 0,
  //   voteCount: 0,

  //   // Requirements & Metrics
  //   quorum_percent: 75,
  //   solRequired: 92800000,
  //   proposerStakeWeightBp: 185,

  //   // Status
  //   lifecycleStage: "support",
  //   status: "active",
  //   voting: false,
  //   finalized: false,

  //   // Technical
  //   proposalBump: 230,
  //   index: 362,

  //   // Legacy
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-08-28T15:30:00Z",
  //   },
  // },
];
