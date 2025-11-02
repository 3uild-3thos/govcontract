import { program } from "@/chain/helpers";

/**
 * @deprecated old program
 */
export const getAllProposals = async () => {
  const proposals = await program.account.proposal.all();

  return proposals;
};
