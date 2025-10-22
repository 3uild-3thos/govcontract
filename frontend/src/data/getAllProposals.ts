import { program } from "@/chain/helpers";

export const getAllProposals = async () => {
  console.log("getAllProposals")
  const proposals = await program.account.proposal.all();
  console.log("proposals", proposals);
  return proposals;
};
