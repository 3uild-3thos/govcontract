"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { StakeAccountData } from "@/dummy-data/wallets";
import { StakeAccountStatus } from "@/components/governance/staker/StakeAccountStatus";
import { CopyableAddress } from "@/components/governance/shared/CopyableAddress";
import { formatLamportsDisplay } from "@/lib/governance/formatters";
import { SortableHeaderButton } from "../shared/SortableHeaderButton";

export const columns: ColumnDef<StakeAccountData>[] = [
  {
    accessorKey: "stake_account",
    header: "STAKE ACCOUNT",
    cell: ({ row }) => {
      const account = row.getValue("stake_account") as string;
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
    accessorKey: "active_stake",
    header: ({ column }) => (
      <SortableHeaderButton column={column} label="AMOUNT" />
    ),
    cell: ({ row }) => {
      const stake = row.getValue("active_stake") as number;
      const solAmount = formatLamportsDisplay(stake);
      return <div>{solAmount.value}</div>;
    },
  },
  {
    accessorKey: "vote_account",
    header: "DELEGATED VALIDATOR",
    cell: ({ row }) => {
      const validator = row.getValue("vote_account") as string;
      return (
        <CopyableAddress
          address={validator}
          shortenedLength={8}
          copyLabel="Copy vote account"
        />
      );
    },
  },
  {
    accessorKey: "state",
    header: "STATE",
    cell: ({ row }) => {
      const state = row.getValue("state") as StakeAccountData["state"];
      return <StakeAccountStatus state={state || "active"} />;
    },
  },
];
