import ProposalsHeader from "@/components/proposals/ProposalsHeader";
import ProposalsView from "@/components/proposals/ProposalsView";
import { proposalStats } from "@/dummy-data/proposal-stats";

export default function ProposalsPage() {
  return (
    <main className="py-8 space-y-10">
      <ProposalsHeader title="Proposal Overview" stats={proposalStats} />
      <ProposalsView title="Recent Proposals" />
    </main>
  );
}
