"use client";

import FilterPanel from "./FilterPanel";
import ProposalCard, { ProposalCardSkeleton } from "./ProposalCard";
import { useProposals } from "@/hooks";
import { FilterState } from "./ProposalFilterModal";
import { useMemo, useState } from "react";

export default function ProposalList() {
  // const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  // const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quorumFilter, setQuorumFilter] = useState(80);
  const [filterState, setFilterState] = useState<FilterState>({
    onlyEligible: false,
    status: "all",
    lifecycle: "all",
    timeWindow: "all",
    minimumSOL: 0,
  });

  const { data: proposals = [], isLoading } = useProposals();

  const filteredProposals = useMemo(() => {
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
        disabled={isLoading}
      />

      {isLoading ? (
        <>
          <ProposalCardSkeleton />
          <ProposalCardSkeleton />
          <ProposalCardSkeleton />
        </>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {!isLoading && filteredProposals.length === 0 && (
        <div className="text-center py-12 text-dao-color-gray text-default">
          No proposals available.
        </div>
      )}

      {/* Load More Button */}
      {/* {filteredProposals.length > 5 && (
        <div className="flex justify-center pt-4">
          <AppButton
            text="Load More"
            variant="outline"
            size="default"
            onClick={() => console.log("load more")}
            disabled={isLoading}
          />
        </div>
      )} */}
    </div>
  );
}
