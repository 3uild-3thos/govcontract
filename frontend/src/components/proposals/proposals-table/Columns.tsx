"use client";

import type { ProposalRow } from "@/components/proposals/proposals-table/ProposalsTable";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import LifecycleIndicator from "@/components/ui/LifecycleIndicator";
import { formatDate, calculateVotingEndsIn, formatNumber } from "@/helpers";
import { useMounted } from "@/hooks/useMounted";

function VotingEndsInCell({ votingEndsIn }: { votingEndsIn: string }) {
  const mounted = useMounted();

  if (!mounted) {
    return <span className="text-sm font-medium text-white/60">-</span>;
  }

  const value = calculateVotingEndsIn(votingEndsIn);
  return (
    <span className="text-sm font-medium text-white/60">{value || "-"}</span>
  );
}

export const columns: ColumnDef<ProposalRow>[] = [
  {
    accessorKey: "simd",
    header: "Proposal SIMD",
    cell: ({ row }) => (
      <div className="text-sm font-medium text-white/90">
        {row.original.simd}
      </div>
    ),
  },
  {
    accessorKey: "lifecycleStage",
    header: ({ column }) => (
      <button
        className="flex items-center justify-center gap-1.5 hover:text-white transition-colors mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {"Lifecycle Stage".toUpperCase()}
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="size-3.5" strokeWidth={3} />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="size-3.5" strokeWidth={3} />
        ) : (
          <ArrowUp className="size-3.5 opacity-40" strokeWidth={3} />
        )}
      </button>
    ),
    cell: ({ row }) => (
      <LifecycleIndicator stage={row.original.lifecycleStage} />
    ),
  },
  {
    accessorKey: "quorumPercent",
    header: "Quorum (%)",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-white/60">
        {getValue<number>()}
      </span>
    ),
  },
  {
    accessorKey: "solRequired",
    header: "SOL Required",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-white/60">
        {formatNumber(getValue<number>())}
      </span>
    ),
  },
  {
    accessorKey: "votingStart",
    header: ({ column }) => (
      <button
        className="flex items-center justify-center gap-1.5 hover:text-white transition-colors mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {"Voting Start".toUpperCase()}
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="size-3.5" strokeWidth={3} />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="size-3.5" strokeWidth={3} />
        ) : (
          <ArrowUp className="size-3.5 opacity-40" strokeWidth={3} />
        )}
      </button>
    ),
    cell: ({ row }) => {
      const value = formatDate(row.original.votingStart);
      return (
        <span className="text-sm font-medium text-white/60">
          {value || "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "votingEndsIn",
    header: ({ column }) => (
      <button
        className="flex items-center justify-center gap-1.5 hover:text-white transition-colors mx-auto"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {"Voting Ends In".toUpperCase()}
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="size-3.5" strokeWidth={3} />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="size-3.5" strokeWidth={3} />
        ) : (
          <ArrowUp className="size-3.5 opacity-40" strokeWidth={3} />
        )}
      </button>
    ),
    cell: ({ row }) => (
      <VotingEndsInCell votingEndsIn={row.original.votingEndsIn ?? ""} />
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "toggle",
    header: () => null,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <ChevronDown
          className={`size-4 text-white/60 transition-transform ${
            row.getIsExpanded() ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        />
      </div>
    ),
    size: 56,
  },
];
