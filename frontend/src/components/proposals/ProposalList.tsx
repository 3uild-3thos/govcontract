/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { AppButton } from "@/components/ui/AppButton";
import FilterPanel from "./FilterPanel";
import ProposalCard, { ProposalCardSkeleton } from "./ProposalCard";
import { useProposals } from "@/hooks";
import { FilterState } from "./ProposalFilterModal";

export default function ProposalList() {
  const [showEligibleOnly, setShowEligibleOnly] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [quorumFilter, setQuorumFilter] = React.useState(80);
  const [filterState, setFilterState] = React.useState<FilterState>({
    onlyEligible: false,
    status: "all",
    lifecycle: "all",
    timeWindow: "all",
    minimumSOL: 0,
  });

  const { data: proposalsData, isLoading: isLoadingProposals } = useProposals();

  const proposals = React.useMemo(() => proposalsData || [], [proposalsData]);

  const filteredProposals = React.useMemo(() => {
    return proposals.filter((proposal) => {
      if (
        filterState.status !== "all" &&
        proposal.status.toLowerCase() !== filterState.status
      ) {
        return false;
      }
      if (
        searchQuery &&
        !proposal.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (proposal.quorumPercent > quorumFilter) {
        return false;
      }
      return true;
    });
  }, [filterState, searchQuery, quorumFilter, proposals]);

  return (
    <div className="space-y-4 -mt-6">
      <FilterPanel
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        quorumFilter={quorumFilter}
        onQuorumFilterChange={setQuorumFilter}
        filterState={filterState}
        onFilterStateChange={setFilterState}
      />

      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <ProposalCard key={proposal.simd} proposal={proposal} />
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12 text-dao-color-gray text-default">
          No proposals available.
        </div>
      )}

      {/* Load More Button */}
      {filteredProposals.length > 5 && (
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
