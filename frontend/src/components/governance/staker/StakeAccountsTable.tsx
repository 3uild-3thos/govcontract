"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { columns } from "@/components/governance/staker/StakerColumns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableFilters } from "@/components/governance/shared/TableFilters";
import {
  TablePaginationMobile,
  TablePaginationDesktop,
} from "@/components/governance/shared/TablePagination";
import {
  MobileRowDrawer,
  DetailRow,
} from "@/components/governance/shared/MobileRowDrawer";
import { CopyableAddress } from "@/components/governance/shared/CopyableAddress";
import { formatLamportsDisplay } from "@/lib/governance/formatters";
import { StakeAccountStatus } from "@/components/governance/staker/StakeAccountStatus";
import { StakeAccountData } from "@/types/stakeAccounts";
import { useStakeAccounts } from "@/hooks/useStakeAccounts";

const stakeAmountOptions = [
  { value: "All", label: "Stake Amount" },
  { value: "10000", label: "> 10,000 SOL" },
  { value: "50000", label: "> 50,000 SOL" },
  { value: "100000", label: "> 100,000 SOL" },
  { value: "500000", label: "> 500,000 SOL" },
];

type StakeStatusType = NonNullable<StakeAccountData["state"]> | "All";

const stakeStatusOptions: { value: StakeStatusType; label: string }[] = [
  { value: "All", label: "Status" },
  { value: "delegated", label: "Delegated" },
  { value: "inactive", label: "Inactive" },
  { value: "initialized", label: "Initialized" },
  { value: "deactivating", label: "Deactivating" },
  { value: "cooldown", label: "Cooldown" },
];

interface Props {
  userPubKey: string;
  isLoading?: boolean;
}

export function StakeAccountsTable({
  userPubKey,
  isLoading: isParentLoading,
}: Props) {
  // State Management
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [searchValue, setSearchValue] = React.useState("");
  const [stakeSizeFilter, setStakeSizeFilter] = React.useState("All");
  const [stakeStatusFilter, setStakeStatusFilter] =
    React.useState<StakeStatusType>("All");

  // Mobile drawer state
  const [selectedRow, setSelectedRow] = React.useState<StakeAccountData | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const enabled = !isParentLoading;
  const { data: stakeAccountsData, isLoading } = useStakeAccounts(
    userPubKey,
    enabled
  );

  const data = React.useMemo(
    () => stakeAccountsData || [],
    [stakeAccountsData]
  );

  // Data Filtering
  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    if (searchValue) {
      filtered = filtered.filter(
        (row) =>
          row.stakeAccount.toLowerCase().includes(searchValue.toLowerCase()) ||
          row.voteAccount?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (stakeSizeFilter !== "All") {
      const threshold = parseFloat(stakeSizeFilter) * 1e9;
      filtered = filtered.filter((row) => row.activeStake >= threshold);
    }

    if (stakeStatusFilter !== "All") {
      filtered = filtered.filter(
        (row) => (row.state ?? "active") === stakeStatusFilter
      );
    }

    return filtered;
  }, [data, searchValue, stakeSizeFilter, stakeStatusFilter]);

  // Table Setup
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  // Handlers
  const handleReset = () => {
    setSearchValue("");
    setStakeSizeFilter("All");
    setStakeStatusFilter("All");
    setColumnFilters([]);
    setSorting([]);
  };

  const handleRowClick = (rowData: StakeAccountData) => {
    // Only on mobile (check if screen width is less than sm breakpoint)
    if (window.innerWidth < 640) {
      setSelectedRow(rowData);
      setDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <TableFilters
        title="Stake Accounts"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search stake accounts..."
        filters={[
          {
            label: "Stake Amount",
            value: stakeSizeFilter,
            onChange: setStakeSizeFilter,
            options: stakeAmountOptions,
            placeholder: "Stake Amount",
            className: "w-[140px] text-white/60",
          },
          {
            label: "Status",
            value: stakeStatusFilter,
            onChange: (value) => setStakeStatusFilter(value as StakeStatusType),
            options: stakeStatusOptions,
            placeholder: "Status",
            className: "w-[120px] text-white/60",
          },
        ]}
        onReset={handleReset}
        disabled={isLoading}
      />

      {/* Table */}
      <div className="rounded-2xl border glass-card overflow-hidden">
        <div className="sm:overflow-x-auto">
          <Table className="w-full table-auto sm:table-fixed">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-white/10"
                >
                  {headerGroup.headers.map((header) => {
                    const columnId = header.column.id;
                    const isMobileHidden = [
                      "active_stake",
                      "vote_account",
                    ].includes(columnId);

                    return (
                      <TableHead
                        key={header.id}
                        className={`text-xs font-semibold uppercase tracking-wide text-white/50 text-center px-2 sm:px-4
                          ${isMobileHidden ? "hidden sm:table-cell" : ""}
                          ${
                            columnId === "stake_account"
                              ? "w-3/5 sm:w-auto"
                              : ""
                          }
                          ${columnId === "state" ? "w-2/5 sm:w-auto" : ""}
                        `}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {(() => {
                if (isLoading) {
                  return (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <TableRow
                          key={`skeleton-${i}`}
                          className="animate-pulse"
                        >
                          {table.getAllColumns().map((col) => (
                            <TableCell
                              key={col.id}
                              className="py-5 px-6 text-center"
                            >
                              <div className="mx-auto h-4 w-3/4 rounded bg-white/10" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </>
                  );
                }
                if (table.getRowModel().rows.length === 0) {
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-white/60"
                    >
                      No results.
                    </TableCell>
                  </TableRow>;
                }

                return table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-white/10 hover:bg-white/5 sm:hover:bg-transparent cursor-pointer sm:cursor-default"
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const columnId = cell.column.id;
                      const isMobileHidden = [
                        "active_stake",
                        "vote_account",
                      ].includes(columnId);

                      return (
                        <TableCell
                          key={cell.id}
                          className={`py-4 text-white/80 text-center px-2 sm:px-4
                            ${isMobileHidden ? "hidden sm:table-cell" : ""}
                          `}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <TablePaginationMobile
        table={table}
        totalLabel="Total"
        totalCount={filteredData.length}
        disabled={isLoading}
      />
      <TablePaginationDesktop
        table={table}
        totalLabel="Total Accounts"
        totalCount={filteredData.length}
        disabled={isLoading}
      />

      {/* Mobile Row Details Drawer */}
      <MobileRowDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Stake Account Details"
      >
        {selectedRow && (
          <>
            <DetailRow
              label="Stake Account"
              value={
                <CopyableAddress
                  address={selectedRow.stakeAccount}
                  shortenedLength={8}
                  copyLabel="Copy full address"
                />
              }
              fullWidth
            />
            <DetailRow
              label="Delegated Validator"
              value={
                <CopyableAddress
                  address={selectedRow.voteAccount || ""}
                  shortenedLength={8}
                  copyLabel="Copy vote account"
                />
              }
              fullWidth
            />
            <DetailRow
              label="Amount"
              value={formatLamportsDisplay(selectedRow.activeStake).value}
            />
            <DetailRow
              label="State"
              value={
                <StakeAccountStatus
                  state={selectedRow.state || "initialized"}
                />
              }
            />
          </>
        )}
      </MobileRowDrawer>
    </div>
  );
}
