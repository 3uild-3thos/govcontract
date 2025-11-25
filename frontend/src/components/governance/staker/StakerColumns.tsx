"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StakeAccountStatus } from "@/components/governance/staker/StakeAccountStatus";
import { CopyableAddress } from "@/components/governance/shared/CopyableAddress";
import {
  formatLamportsDisplay,
  formatAddress,
} from "@/lib/governance/formatters";
import { SortableHeaderButton } from "@/components/governance/shared/SortableHeaderButton";
import { StakeAccountData } from "@/types/stakeAccounts";
import { ChevronDown } from "lucide-react";

export const columns: ColumnDef<StakeAccountData>[] = [
  {
    accessorKey: "stakeAccount",
    header: "STAKE ACCOUNT",
    cell: ({ row }) => {
      const account = row.getValue("stakeAccount") as string;
      return (
        <>
          {/* Mobile: Simple text without copy button */}
          <div className="sm:hidden">
            <p className="font-mono text-white/90 text-xs">
              {formatAddress(account)}
            </p>
          </div>
          {/* Desktop: Full CopyableAddress component */}
          <div className="hidden sm:block">
            <CopyableAddress
              address={account}
              shortenedLength={4}
              copyLabel="Copy full address"
            />
          </div>
        </>
      );
    },
  },
  {
    accessorKey: "activeStake",
    header: ({ column }) => (
      <div className="hidden sm:block">
        <SortableHeaderButton column={column} label="AMOUNT" />
      </div>
    ),
    cell: ({ row }) => {
      const stake = row.original.activeStake;
      const solAmount = formatLamportsDisplay(stake);
      return <div className="hidden sm:block">{solAmount.value}</div>;
    },
  },
  {
    accessorKey: "voteAccount",
    header: () => <span className="hidden sm:inline">DELEGATED VOTER</span>,
    cell: ({ row }) => {
      const validator = row.original.voteAccount;
      if (!validator) return <div className="hidden sm:block">-</div>;

      return (
        <div className="hidden sm:block">
          <CopyableAddress
            address={validator}
            shortenedLength={8}
            copyLabel="Copy vote account"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "state",
    header: "STATE",
    cell: ({ row }) => {
      const state = row.getValue("state") as StakeAccountData["state"];
      return <StakeAccountStatus state={state || "initialized"} />;
    },
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
