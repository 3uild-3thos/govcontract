import { useProposals } from "./useProposals";
import { ProposalRecord } from "@/types";
import { useMemo } from "react";

const findProposalBySimd = (
  proposals: ProposalRecord[],
  proposalPublicKey: string
) =>
  proposals.find(
    (proposal) => proposal.publicKey.toBase58() === proposalPublicKey
  );

export const useProposalDetails = (proposalPublicKey: string) => {
  const { data: proposalsData, ...restQueryConfig } = useProposals();

  const proposalDetails = useMemo(
    () => findProposalBySimd(proposalsData || [], proposalPublicKey),
    [proposalsData, proposalPublicKey]
  );

  return { data: proposalDetails, ...restQueryConfig };
};
