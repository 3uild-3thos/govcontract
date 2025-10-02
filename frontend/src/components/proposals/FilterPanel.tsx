"use client";

import * as React from "react";
import { Search, ListFilter } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { Progress } from "@/components/ui/progress";

interface FilterPanelProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  quorumFilter: number;
  onQuorumFilterChange: (quorum: number) => void;
}

export default function FilterPanel({
  searchQuery,
  onSearchQueryChange,
  quorumFilter,
  onQuorumFilterChange,
}: FilterPanelProps) {
  return (
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
          />
        </div>
        <AppButton
          aria-label="Filter"
          variant="outline"
          size="sm"
          className="flex size-11 items-center justify-center"
          icon={<ListFilter className="size-4" />}
        />
      </div>

      {/* Quorum Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/60 font-medium">
          <span>Quorum Reached (%)</span>
          <span>{quorumFilter}%</span>
        </div>
        <div className="relative group">
          <Progress value={quorumFilter} className="h-2" />
          {/* Thumb indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 size-6 bg-foreground border-3 border-primary rounded-full shadow-lg transition-transform group-hover:scale-110 pointer-events-none"
            style={{ left: `calc(${quorumFilter}% - 10px)` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step={5}
            value={quorumFilter}
            onChange={(e) => onQuorumFilterChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/40">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
