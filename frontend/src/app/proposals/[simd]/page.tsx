import { notFound } from "next/navigation";
import ProposalDetailView from "@/components/proposals/detail/ProposalDetailView";
import { proposals } from "@/dummy-data/proposals";

interface ProposalDetailsPageProps {
  params: Promise<{ simd: string }>;
}

const findProposalBySimd = async (simd: string) =>
  proposals.find(
    (proposal) => proposal.simd.toLowerCase() === simd.toLowerCase(),
  );

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
