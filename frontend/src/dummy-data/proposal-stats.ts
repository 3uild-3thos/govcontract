export type ProposalStat = {
  id: string;
  label: string;
  value: number;
};

export const proposalStats: ProposalStat[] = [
  {
    id: "active-proposals",
    label: "Active Proposals",
    value: 15,
  },
  {
    id: "support-phase-proposals",
    label: "Support Phase Proposals",
    value: 34,
  },
  {
    id: "number-of-validators",
    label: "Number of Validators",
    value: 550332,
  },
  {
    id: "number-of-stakers",
    label: "Number of Stakers",
    value: 123232232,
  },
];
