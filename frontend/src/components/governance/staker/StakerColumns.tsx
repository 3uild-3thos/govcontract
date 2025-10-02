"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { StakeAccountData } from "@/dummy-data/wallets";
import { StakeAccountStatus } from "@/components/governance/staker/StakeAccountStatus";
import { CopyableAddress } from "@/components/governance/shared/CopyableAddress";
import { formatLamportsDisplay, formatAddress } from "@/lib/governance/formatters";
import { SortableHeaderButton } from "@/components/governance/shared/SortableHeaderButton";

export const columns: ColumnDef<StakeAccountData>[] = [
  {
    accessorKey: "stake_account",
    header: "STAKE ACCOUNT",
    cell: ({ row }) => {
      const account = row.getValue("stake_account") as string;
      return (
        <>
          {/* Mobile: Simple text without copy button */}
          <div className="sm:hidden">
            <p className="font-mono text-white/90 text-xs">
              {formatAddress(account, 4)}
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
    accessorKey: "active_stake",
    header: ({ column }) => (
      <div className="hidden sm:block">
        <SortableHeaderButton column={column} label="AMOUNT" />
      </div>
    ),
    cell: ({ row }) => {
      const stake = row.getValue("active_stake") as number;
      const solAmount = formatLamportsDisplay(stake);
      return <div className="hidden sm:block">{solAmount.value}</div>;
    },
  },
  {
    accessorKey: "vote_account",
    header: () => <span className="hidden sm:inline">DELEGATED VOTER</span>,
    cell: ({ row }) => {
      const validator = row.getValue("vote_account") as string;
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
      return <StakeAccountStatus state={state || "active"} />;
    },
  },
];
