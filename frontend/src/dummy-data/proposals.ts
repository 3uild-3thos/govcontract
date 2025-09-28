export type ProposalStatus = "active" | "finalizing" | "finalized";

export type ProposalLifecycleStage = "support" | "voting" | "finished";

export type ProposalRecord = {
  simd: string;
  title: string;
  summary: string;
  lifecycleStage: ProposalLifecycleStage;
  quorumPercent: number;
  solRequired: number;
  votingStart: string | null;
  votingEndsIn: string | null;
  status: ProposalStatus;
  link: string;
  vote: {
    state: "in-progress" | "finished";
    lastUpdated: string;
  };
};

export const proposals: ProposalRecord[] = [
  {
    simd: "SIMD-0326",
    title: "Proposal for the New Alpenglow Consensus Protocol",
    summary:
      "A major overhaul of Solana's core consensus protocol, replacing Proof-of-History and TowerBFT mechanisms with a modern architecture focused on performance, resilience, and simplicity. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators.",
    lifecycleStage: "support",
    quorumPercent: 80,
    solRequired: 182432988,
    votingStart: null,
    votingEndsIn: null,
    status: "active",
    link: "https://example.com/proposals/simd-0326",
    vote: {
      state: "in-progress",
      lastUpdated: "2025-09-21T09:15:00Z",
    },
  },
  {
    simd: "SIMD-0327",
    title: "Proposal for the New Alpenglow Consensus Protocol",
    summary:
      "A major overhaul of Solana's core consensus protocol, replacing Proof-of-History and TowerBFT mechanisms with a modern architecture focused on performance, resilience, and simplicity.",
    lifecycleStage: "voting",
    quorumPercent: 80,
    solRequired: 182432988,
    votingStart: "2025-09-28 10:00:00",
    votingEndsIn: "2025-10-15 10:00:00",
    status: "active",
    link: "https://example.com/proposals/simd-0327",
    vote: {
      state: "in-progress",
      lastUpdated: "2025-09-21T09:15:00Z",
    },
  },
  {
    simd: "SIMD-0334",
    title: "Validator Reward Distribution Upgrade",
    summary:
      "Introduce dynamic reward multipliers for validators that exceed uptime and performance benchmarks across multiple epochs.",
    lifecycleStage: "finished",
    quorumPercent: 80,
    solRequired: 182432988,
    votingStart: "2025-08-15 10:00:00",
    votingEndsIn: "2025-08-25 10:00:00",
    status: "finalized",
    link: "https://example.com/proposals/simd-0334",
    vote: {
      state: "finished",
      lastUpdated: "2025-09-20T22:40:00Z",
    },
  },
  {
    simd: "SIMD-0338",
    title: "Staker Delegation Transparency Initiative",
    summary:
      "Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators.",
    lifecycleStage: "finished",
    quorumPercent: 80,
    solRequired: 182432988,
    votingStart: "2025-07-01 10:00:00",
    votingEndsIn: "2025-07-10 10:00:00",
    status: "finalizing",
    link: "https://example.com/proposals/simd-0338",
    vote: {
      state: "finished",
      lastUpdated: "2025-09-18T13:20:00Z",
    },
  },
  {
    simd: "SIMD-0341",
    title: "Validator Infrastructure Hardening",
    summary:
      "Fund upgrades for validator infrastructure redundancy, including geo-distributed failover clusters and shared tooling grants.",
    lifecycleStage: "finished",
    quorumPercent: 80,
    solRequired: 182432988,
    votingStart: "2025-05-01 10:00:00",
    votingEndsIn: "2025-05-10 10:00:00",
    status: "finalized",
    link: "https://example.com/proposals/simd-0341",
    vote: {
      state: "finished",
      lastUpdated: "2025-09-17T06:05:00Z",
    },
  },
  {
    simd: "SIMD-0342",
    title: "Validator Infrastructure Hardening",
    summary:
      "Fund upgrades for validator infrastructure redundancy, including geo-distributed failover clusters and shared tooling grants. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators. Require validator pools to disclose detailed staking metrics and provide standardized reporting dashboards for large delegators.",
    lifecycleStage: "finished",
    quorumPercent: 80,
    solRequired: 182432988,
    votingStart: "2025-04-01 10:00:00",
    votingEndsIn: "2025-04-10 10:00:00",
    status: "finalized",
    link: "https://example.com/proposals/simd-0342",
    vote: {
      state: "finished",
      lastUpdated: "2025-09-16T15:45:00Z",
    },
  },
  // {
  //   simd: "SIMD-0343",
  //   title: "Validator Infrastructure Hardening",
  //   summary:
  //     "Fund upgrades for validator infrastructure redundancy, including geo-distributed failover clusters and shared tooling grants.",
  //   lifecycleStage: "finalized",
  //   quorumPercent: 80,
  //   solRequired: 182,432,988,
  //   votingStart: "2025-04-01 10:00:00",
  //   votingEndsIn: "2025-04-10 10:00:00",
  //   status: "finalized",
  //   link: "https://example.com/proposals/simd-0343",
  //   vote: {
  //     state: "executed",
  //     lastUpdated: "2025-09-16T15:45:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0344",
  //   title: "Validator Reward Harmonization",
  //   summary:
  //     "Normalize validator reward distribution windows to align with epoch rollovers and improve payout predictability.",
  //   lifecycleStage: "support",
  //   quorumPercent: 78,
  //   solRequired: 98500000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0344",
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-14T08:10:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0345",
  //   title: "Regional Validator Outreach",
  //   summary:
  //     "Provide grants for validator education programs in underrepresented geographic regions.",
  //   lifecycleStage: "support",
  //   quorumPercent: 72,
  //   solRequired: 64000000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0345",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-09-13T18:25:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0346",
  //   title: "Validator Alerting Enhancements",
  //   summary:
  //     "Introduce standardized incident alerting requirements for validators to improve coordination during outages.",
  //   lifecycleStage: "voting",
  //   quorumPercent: 81,
  //   solRequired: 112300000,
  //   votingStart: "2025-09-20 10:00:00",
  //   votingEndsIn: "2025-09-30 10:00:00",
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0346",
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-21T06:05:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0347",
  //   title: "RPC Performance Enhancements",
  //   summary:
  //     "Upgrade RPC infrastructure guidelines to improve throughput during peak governance activity.",
  //   lifecycleStage: "voting",
  //   quorumPercent: 84,
  //   solRequired: 134900000,
  //   votingStart: "2025-09-18 12:00:00",
  //   votingEndsIn: "2025-09-28 12:00:00",
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0347",
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-20T16:30:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0348",
  //   title: "Validator Insurance Fund",
  //   summary:
  //     "Create a shared insurance fund to offset slashing incidents for compliant validators.",
  //   lifecycleStage: "voting",
  //   quorumPercent: 86,
  //   solRequired: 205000000,
  //   votingStart: "2025-09-15 09:00:00",
  //   votingEndsIn: "2025-09-25 09:00:00",
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0348",
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-19T11:55:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0349",
  //   title: "Validator SLA Enforcement",
  //   summary:
  //     "Enforce minimum uptime requirements for validators participating in governance votes.",
  //   lifecycleStage: "finalized",
  //   quorumPercent: 88,
  //   solRequired: 175750000,
  //   votingStart: "2025-08-05 10:00:00",
  //   votingEndsIn: "2025-08-15 10:00:00",
  //   status: "finalizing",
  //   link: "https://example.com/proposals/simd-0349",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-09-10T07:20:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0350",
  //   title: "Governance Dashboard Refresh",
  //   summary:
  //     "Refresh the governance portal UI to highlight proposal timelines and validator participation.",
  //   lifecycleStage: "finalized",
  //   quorumPercent: 82,
  //   solRequired: 95400000,
  //   votingStart: "2025-08-01 10:00:00",
  //   votingEndsIn: "2025-08-11 10:00:00",
  //   status: "finalizing",
  //   link: "https://example.com/proposals/simd-0350",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-09-08T03:15:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0351",
  //   title: "Validator Health API",
  //   summary:
  //     "Publish a standard health reporting API for validators to share live performance data.",
  //   lifecycleStage: "finalized",
  //   quorumPercent: 80,
  //   solRequired: 123000000,
  //   votingStart: "2025-07-10 10:00:00",
  //   votingEndsIn: "2025-07-20 10:00:00",
  //   status: "finalizing",
  //   link: "https://example.com/proposals/simd-0351",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-09-06T14:45:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0352",
  //   title: "Stake Pool Transparency",
  //   summary:
  //     "Require stake pools to publish validator allocation updates and reward histories.",
  //   lifecycleStage: "finalized",
  //   quorumPercent: 83,
  //   solRequired: 155000000,
  //   votingStart: "2025-06-05 10:00:00",
  //   votingEndsIn: "2025-06-15 10:00:00",
  //   status: "finalized",
  //   link: "https://example.com/proposals/simd-0352",
  //   vote: {
  //     state: "executed",
  //     lastUpdated: "2025-09-01T19:30:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0353",
  //   title: "Validator Cooling Period Update",
  //   summary:
  //     "Adjust key rotation cooling periods to reduce downtime during scheduled maintenance.",
  //   lifecycleStage: "finalized",
  //   quorumPercent: 77,
  //   solRequired: 142000000,
  //   votingStart: "2025-05-20 10:00:00",
  //   votingEndsIn: "2025-05-30 10:00:00",
  //   status: "finalized",
  //   link: "https://example.com/proposals/simd-0353",
  //   vote: {
  //     state: "executed",
  //     lastUpdated: "2025-08-28T12:05:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0354",
  //   title: "Light Client Incentives",
  //   summary:
  //     "Offer incentives for validators operating light client endpoints to improve mobile access.",
  //   lifecycleStage: "finalized",
  //   quorumPercent: 79,
  //   solRequired: 118500000,
  //   votingStart: "2025-05-01 10:00:00",
  //   votingEndsIn: "2025-05-11 10:00:00",
  //   status: "finalized",
  //   link: "https://example.com/proposals/simd-0354",
  //   vote: {
  //     state: "executed",
  //     lastUpdated: "2025-08-25T09:40:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0355",
  //   title: "Validator Security Workshops",
  //   summary:
  //     "Fund quarterly workshops for validators covering security best practices and tooling.",
  //   lifecycleStage: "support",
  //   quorumPercent: 74,
  //   solRequired: 68250000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0355",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-09-05T07:10:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0356",
  //   title: "Validator Energy Audit",
  //   summary:
  //     "Commission an energy consumption audit for validator hardware to establish sustainability benchmarks.",
  //   lifecycleStage: "support",
  //   quorumPercent: 76,
  //   solRequired: 102000000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0356",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-09-04T11:50:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0357",
  //   title: "Validator Peer Review Council",
  //   summary:
  //     "Establish a review council to evaluate validator grant applications for infrastructure scaling.",
  //   lifecycleStage: "support",
  //   quorumPercent: 80,
  //   solRequired: 97600000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0357",
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-03T22:30:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0358",
  //   title: "Cross-Chain Governance Bridge",
  //   summary:
  //     "Explore interoperability for governance signals with aligned ecosystems to improve proposal reach.",
  //   lifecycleStage: "support",
  //   quorumPercent: 85,
  //   solRequired: 248000000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0358",
  //   vote: {
  //     state: "in-progress",
  //     lastUpdated: "2025-09-02T17:05:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0359",
  //   title: "Validator Insurance Expansion",
  //   summary:
  //     "Expand insurance coverage tiers for validators taking on additional network duties.",
  //   lifecycleStage: "support",
  //   quorumPercent: 82,
  //   solRequired: 215500000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0359",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-09-01T09:55:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0360",
  //   title: "Validator Health Monitoring APIs",
  //   summary:
  //     "Launch standardized APIs for real-time validator health metrics exposed to integrators.",
  //   lifecycleStage: "support",
  //   quorumPercent: 83,
  //   solRequired: 138400000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0360",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-08-30T13:40:00Z",
  //   },
  // },
  // {
  //   simd: "SIMD-0361",
  //   title: "Validator Tooling Grants",
  //   summary:
  //     "Provide grants for shared validator tooling focused on monitoring and automation.",
  //   lifecycleStage: "support",
  //   quorumPercent: 78,
  //   solRequired: 110750000,
  //   votingStart: null,
  //   votingEndsIn: null,
  //   status: "active",
  //   link: "https://example.com/proposals/simd-0361",
  //   vote: {
  //     state: "queued",
  //     lastUpdated: "2025-08-29T20:05:00Z",
  //   },
  // },
];
