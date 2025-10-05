import { notFound } from "next/navigation";
import ProposalDetailView from "@/components/proposals/detail/ProposalDetailView";
import { proposalsMockData } from "@/dummy-data/proposals";
import { mapProposalDto } from "@/data/getProposals";

interface ProposalDetailsPageProps {
  params: Promise<{ simd: string }>;
}

const findProposalBySimd = async (simd: string) => {
  const rawProposal = proposalsMockData.find(
    (proposal) => proposal.simd.toLowerCase() === simd.toLowerCase(),
  );
  return rawProposal ? mapProposalDto(rawProposal) : undefined;
};

export default async function ProposalDetailsPage({
  params,
}: ProposalDetailsPageProps) {
  const { simd } = await params;
  const proposal = await findProposalBySimd(simd);

  if (!proposal) {
    notFound();
  }

  return (
    <main className="space-y-8 py-8">
      <ProposalDetailView proposal={proposal} />
    </main>
  );
}
