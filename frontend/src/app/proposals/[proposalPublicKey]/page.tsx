"use client";

import { notFound, useParams } from "next/navigation";
import ProposalDetailView from "@/components/proposals/detail/ProposalDetailView";
import { useProposalDetails } from "@/hooks";

const ProposalDetailsPage = () => {
  const params = useParams<{ proposalPublicKey: string }>();
  const { proposalPublicKey } = params;

  const {
    data: proposalData,
    isFetched,
    isLoading,
  } = useProposalDetails(proposalPublicKey);

  if (!proposalData && isFetched) {
    notFound();
  }
  console.log("proposalData", proposalData);
  return (
    <main className="space-y-8 py-8">
      <ProposalDetailView proposal={proposalData} isLoading={isLoading} />
    </main>
  );
};

export default ProposalDetailsPage;
