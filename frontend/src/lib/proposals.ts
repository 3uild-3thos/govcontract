export const getProposalPhase = (voting: boolean, finalized: boolean) => {
  let currentPhase: "Support" | "Voting" | "Finished" | undefined = undefined;
  if (!voting && !finalized) currentPhase = "Support";
  else if (voting && !finalized) currentPhase = "Voting";
  else if (!voting && finalized) currentPhase = "Finished";

  return currentPhase;
};
