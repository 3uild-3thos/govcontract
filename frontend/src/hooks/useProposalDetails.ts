import { useProposals } from "./useProposals";
import { ProposalRecord } from "@/types";
import { useMemo } from "react";

const findProposalBySimd = (proposals: ProposalRecord[], simd: string) =>
  proposals.find(
    (proposal) => proposal.simd.toLowerCase() === simd.toLowerCase()
  );

export const useProposalDetails = (simd: string) => {
  const { data: proposalsData, ...restQueryConfig } = useProposals();

  const proposalDetails = useMemo(
    () => findProposalBySimd(proposalsData || [], simd),
    [proposalsData, simd]
  );

  return { data: proposalDetails, ...restQueryConfig };
};
