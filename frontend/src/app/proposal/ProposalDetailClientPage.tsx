"use client";

import { notFound, useSearchParams } from "next/navigation";
import ProposalDetailView from "@/components/proposals/detail/ProposalDetailView";
import { useProposalDetails } from "@/hooks";
import { PROPOSAL_PK_QUERY_PARAM } from "@/helpers/proposalPage";

export const ProposalDetailClientPage = () => {
  const searchParams = useSearchParams();
  const proposalPublicKey = searchParams.get(PROPOSAL_PK_QUERY_PARAM);

  if (!proposalPublicKey) notFound();

  const {
    data: proposalData,
    isFetched,
    isLoading,
  } = useProposalDetails(proposalPublicKey);

  if (!proposalData && isFetched) {
    notFound();
  }

  return (
    <main className="space-y-8 py-8">
      <ProposalDetailView proposal={proposalData} isLoading={isLoading} />
    </main>
  );
};
