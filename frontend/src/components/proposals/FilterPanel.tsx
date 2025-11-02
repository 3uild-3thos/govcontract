"use client";

import * as React from "react";
import { Search, ListFilter } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { Progress } from "@/components/ui/progress";
import { FilterState } from "./ProposalFilterModal";
import { ProposalFilterModal } from "./ProposalFilterModal";

interface FilterPanelProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  quorumFilter: number;
  onQuorumFilterChange: (quorum: number) => void;
  filterState: FilterState;
  onFilterStateChange: (filters: FilterState) => void;
  disabled?: boolean;
}

function countActiveFilters(filterState: FilterState) {
  let count = 0;

  if (filterState.onlyEligible) count++;
  if (filterState.status !== "all") count++;
  if (filterState.lifecycle !== "all") count++;
  if (filterState.timeWindow !== "all") count++;
  if (filterState.minimumSOL > 0) count++;

  return count;
}

export default function FilterPanel({
  searchQuery,
  onSearchQueryChange,
  quorumFilter,
  onQuorumFilterChange,
  filterState,
  onFilterStateChange,
  disabled,
}: FilterPanelProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);

  const activeFilterCount = countActiveFilters(filterState);

  return (
    <>
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 input"
              disabled={disabled}
            />
          </div>
          <div className="relative">
            <AppButton
              aria-label="Filter"
              variant="outline"
              size="sm"
              className="flex size-11 items-center justify-center"
              icon={<ListFilter className="size-4" />}
              onClick={() => setIsFilterModalOpen(true)}
              disabled={disabled}
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>

        {/* Quorum Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/60 font-medium">
            <span>Quorum Reached (%)</span>
            <span>{quorumFilter}%</span>
          </div>
          <div className="relative group">
            <Progress
              value={quorumFilter}
              className="h-2"
              disabled={disabled}
            />
            {/* Thumb indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 size-6 bg-foreground border-3 border-primary rounded-full shadow-lg transition-transform group-hover:scale-110 pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:bg-muted aria-disabled:border-border"
              style={{ left: `calc(${quorumFilter}% - 10px)` }}
              aria-disabled={disabled}
            />
            <input
              type="range"
              min="0"
              max="100"
              step={5}
              value={quorumFilter}
              onChange={(e) => onQuorumFilterChange(Number(e.target.value))}
              className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={disabled}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/40">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Filter Modal - responsive for all screen sizes */}
      {isFilterModalOpen && (
        <ProposalFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApply={onFilterStateChange}
          initialFilters={filterState}
        />
      )}
    </>
  );
}
