import ProposalsHeader from "@/components/proposals/ProposalsHeader";
import ProposalsView from "@/components/proposals/ProposalsView";

export default function ProposalsPage() {
  return (
    <main className="py-8 space-y-10">
      <ProposalsHeader title="Proposal Overview" />
      <ProposalsView title="Recent Proposals" />
    </main>
  );
}
