/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { proposals } from "@/dummy-data/proposals";
import { AppButton } from "@/components/ui/AppButton";
import FilterPanel from "./FilterPanel";
import ProposalCard from "./ProposalCard";

export default function ProposalList() {
  const [showEligibleOnly, setShowEligibleOnly] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [quorumFilter, setQuorumFilter] = React.useState(80);

  const searcheProposals = React.useMemo(() => {
    return proposals.filter((proposal) => {
      if (
        statusFilter !== "all" &&
        proposal.status.toLowerCase() !== statusFilter
      ) {
        return false;
      }
      if (
        searchQuery &&
        !proposal.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (proposal.quorumPercent !== quorumFilter) {
        return false;
      }
      return true;
    });
  }, [statusFilter, searchQuery, quorumFilter]);

  return (
    <div className="space-y-4 -mt-6">
      <FilterPanel
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        quorumFilter={quorumFilter}
        onQuorumFilterChange={setQuorumFilter}
      />

      <div className="space-y-4">
        {searcheProposals.map((proposal) => (
          <ProposalCard key={proposal.simd} proposal={proposal} />
        ))}
      </div>

      {searcheProposals.length === 0 && (
        <div className="text-center py-12 text-dao-color-gray text-default">
          No proposals available.
        </div>
      )}

      {/* Load More Button */}
      {searcheProposals.length > 5 && (
        <div className="flex justify-center pt-4">
          <AppButton
            text="Load More"
            variant="outline"
            size="default"
            onClick={() => console.log("load more")}
          />
        </div>
      )}
    </div>
  );
}
