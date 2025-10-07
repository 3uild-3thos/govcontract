"use client";

import ProposalsTable from "./proposals-table/ProposalsTable";
import ProposalList from "./ProposalList";

interface ProposalsViewProps {
  title: string;
}

export default function ProposalsView({ title }: ProposalsViewProps) {
  return (
    <>
      {/* Desktop only - hidden on mobile/tablet */}
      <div className="hidden lg:block">
        <ProposalsTable title={title} />
      </div>

      {/* Mobile/Tablet - hidden on desktop */}
      <div className="block lg:hidden">
        <ProposalList />
      </div>
    </>
  );
}
