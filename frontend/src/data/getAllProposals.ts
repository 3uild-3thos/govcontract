import { program } from "@/chain/helpers";

export const getAllProposals = async () => {
  const proposals = await program.account.proposal.all();

  return proposals;
};
