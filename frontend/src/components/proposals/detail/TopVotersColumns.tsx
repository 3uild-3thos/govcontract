"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SortableHeaderButton } from "@/components/governance/shared/SortableHeaderButton";
import type { TopVoterRecord } from "@/dummy-data/top-voters";
import { cn } from "@/lib/utils";
import {
  formatAddress,
  formatLamportsDisplay,
} from "@/lib/governance/formatters";
import { formatDate } from "@/helpers";

const LABELS: Record<TopVoterRecord["voteOutcome"], string> = {
  for: "For",
  against: "Against",
  abstain: "Abstain",
};

const BAR_GRADIENTS: Record<TopVoterRecord["voteOutcome"], string> = {
  for: "var(--color-dao-gradient-vote-for)",
  against: "var(--color-dao-gradient-vote-against)",
  abstain: "var(--color-dao-gradient-vote-abstain)",
};

export const topVoterColumns: ColumnDef<TopVoterRecord>[] = [
  {
    accessorKey: "validatorName",
    header: ({ column }) => (
      <SortableHeaderButton
        column={column}
        label="Voter"
        className="flex items-center justify-start gap-1.5 hover:text-white transition-colors"
      />
    ),
    cell: ({ row }) => {
      const { validatorName, validatorIdentity, accentColor } = row.original;

      return (
        <div className="flex items-center gap-4">
          <div
            className="flex size-8 items-center justify-center rounded-full text-[14px] font-semibold uppercase text-white shadow-lg"
            style={{ background: accentColor }}
            aria-hidden
          >
            {validatorName.slice(0, 1)}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium text-white/60">
              {validatorName}
            </span>
            <span className="text-xs font-mono text-white/30">
              {formatAddress(validatorIdentity, 6)}
            </span>
          </div>
        </div>
      );
    },
    sortingFn: "alphanumeric",
    enableHiding: false,
  },
  {
    accessorKey: "stakedLamports",
    header: ({ column }) => (
      <SortableHeaderButton column={column} label="Staked" />
    ),
    cell: ({ row }) => (
      <div className="text-sm font-medium text-white/60">
        {formatLamportsDisplay(row.original.stakedLamports).value}
      </div>
    ),
    sortingFn: "basic",
  },
  {
    accessorKey: "voteOutcome",
    header: "Voter Split",
    cell: ({ row }) => {
      const outcome = row.original.voteOutcome;
      return (
        <div className="flex items-center gap-4 justify-center">
          <div className="h-1.5 w-24 overflow-hidden rounded-full">
            <div
              className="h-full w-full"
              style={{ backgroundImage: BAR_GRADIENTS[outcome] }}
            />
          </div>
          <span
            className={cn(
              "text-xs font-medium",
              outcome === "for" && "text-primary",
              outcome === "against" && "text-destructive",
              outcome === "abstain" && "text-white/30",
            )}
          >
            {LABELS[outcome]}
          </span>
        </div>
      );
    },
    sortingFn: "alphanumeric",
    enableSorting: false,
  },
  {
    accessorKey: "votePercentage",
    header: ({ column }) => (
      <SortableHeaderButton column={column} label="Percentage" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-white/60">
        {row.original.votePercentage.toFixed(2)}%
      </span>
    ),
  },
  {
    accessorKey: "voteTimestamp",
    header: ({ column }) => (
      <SortableHeaderButton column={column} label="Vote Date" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium text-white/60">
        {formatDate(row.original.voteTimestamp)}
      </span>
    ),
    sortingFn: "datetime",
  },
];
