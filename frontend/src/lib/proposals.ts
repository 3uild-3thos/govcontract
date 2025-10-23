import type { ProposalStatus } from "@/types";

export const getProposalStatus = (
  voting: boolean,
  finalized: boolean
): ProposalStatus => {
  if (!voting && !finalized) return "support";
  else if (voting && !finalized) return "voting";
  else if (!voting && finalized) return "finalized";

  return "support";
};
