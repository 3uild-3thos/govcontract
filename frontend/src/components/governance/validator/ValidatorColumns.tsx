"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { VoteAccountData } from "@/dummy-data/wallets";
import {
  formatAddress,
  formatCommission,
  formatLamportsDisplay,
  formatOptionalCount,
} from "@/lib/governance/formatters";
import { CopyableAddress } from "../shared/CopyableAddress";
import { SortableHeaderButton } from "../shared/SortableHeaderButton";

export const columns: ColumnDef<VoteAccountData>[] = [
  {
    accessorKey: "vote_account",
    header: "VOTE ACCOUNT",
    cell: ({ row }) => {
      const account = row.getValue("vote_account") as string;
      return (
        <CopyableAddress
          address={account}
          shortenedLength={4}
          copyLabel="Copy full address"
        />
      );
    },
  },
  {
    accessorKey: "identity",
    header: "IDENTITY",
    cell: ({ row }) => {
      const identity = row.getValue("identity") as string | undefined;
      if (!identity) return <div>-</div>;
      const displayIdentity = formatAddress(identity, 6);
      return <div className="font-mono">{displayIdentity}</div>;
    },
  },
  {
    accessorKey: "active_stake",
    header: "DELEGATED STAKE",
    cell: ({ row }) => {
      const stake = row.getValue("active_stake") as number;
      const solAmount = formatLamportsDisplay(stake);
      return <div>{solAmount.value}</div>;
    },
  },
  {
    accessorKey: "commission",
    header: "COMMISSION",
    cell: ({ row }) => {
      const commission = row.getValue("commission") as number | undefined;
      const formattedCommission = formatCommission(commission);
      return <div>{formattedCommission}</div>;
    },
  },
  {
    accessorKey: "lastVote",
    header: ({ column }) => (
      <SortableHeaderButton column={column} label="LAST VOTE" />
    ),
    cell: ({ row }) => {
      const lastVote = row.getValue("lastVote") as number | undefined;
      const formattedLastVote = formatOptionalCount(lastVote);
      return <div>{formattedLastVote}</div>;
    },
  },
  {
    accessorKey: "credits",
    header: ({ column }) => (
      <SortableHeaderButton column={column} label="CREDITS" />
    ),
    cell: ({ row }) => {
      const credits = row.getValue("credits") as number | undefined;
      const formattedCredits = formatOptionalCount(credits);
      return <div>{formattedCredits}</div>;
    },
  },
];
