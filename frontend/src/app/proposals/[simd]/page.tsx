"use client";

import { notFound } from "next/navigation";
import ProposalDetailView from "@/components/proposals/detail/ProposalDetailView";
import { useProposalDetails } from "@/hooks";
import { use } from "react";
interface ProposalDetailsPageProps {
  params: Promise<{ simd: string }>;
}

const ProposalDetailsPage = ({ params }: ProposalDetailsPageProps) => {
  const paramsAwaited = use(params);
  const { simd } = paramsAwaited;

  const {
    data: proposalsData,
    isFetched,
    isLoading,
  } = useProposalDetails(simd);

  if (!proposalsData && isFetched) {
    notFound();
  }

  if (!isFetched || isLoading) {
    // TODO: create loading state
    // probably easier for <ProposalDetailView /> to implement loading skeletons on all component
    return <main className="space-y-8 py-8">loading...</main>;
  }

  if (!proposalsData) {
    notFound();
  }

  return (
    <main className="space-y-8 py-8">
      <ProposalDetailView proposal={proposalsData} isLoading={isLoading} />
    </main>
  );
};

export default ProposalDetailsPage;
