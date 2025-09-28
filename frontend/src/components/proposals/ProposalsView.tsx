"use client";

import type { DeviceType } from "@/lib/device-detection";
import ProposalsTable from "./proposals-table/ProposalsTable";
import ProposalList from "./ProposalList";

interface ProposalsViewProps {
  title: string;
  initialDevice?: DeviceType;
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
