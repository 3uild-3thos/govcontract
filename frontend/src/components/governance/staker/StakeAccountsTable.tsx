"use client";

import {
  ColumnFiltersState,
  OnChangeFn,
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
import { StakeAccountVoteProposals } from "@/components/governance/staker/StakeAccountVoteProposals";
import { StakeAccountData } from "@/types/stakeAccounts";
import { useWalletStakeAccounts } from "@/hooks";
import { Fragment, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

type ExpandedState = Record<string, boolean>;

const getIsExpanded = (state: ExpandedState, rowId: string) =>
  Boolean((state as Record<string, boolean>)[rowId]);

export function StakeAccountsTable({
  userPubKey,
  isLoading: isParentLoading,
}: Props) {
  // State Management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchValue, setSearchValue] = useState("");
  const [stakeSizeFilter, setStakeSizeFilter] = useState("All");
  const [stakeStatusFilter, setStakeStatusFilter] =
    useState<StakeStatusType>("All");

  // Mobile drawer state
  const [selectedRow, setSelectedRow] = useState<StakeAccountData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Expanded rows state
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const enabled = !isParentLoading;
  const { data: stakeAccountsData, isLoading } = useWalletStakeAccounts(
    userPubKey,
    enabled
  );

  const data = useMemo(() => stakeAccountsData || [], [stakeAccountsData]);

  // Data Filtering
  const filteredData = useMemo(() => {
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

  const handleExpandedChange = useCallback<OnChangeFn<ExpandedState | true>>(
    (updater) => {
      setExpanded((previous) => {
        const nextState =
          typeof updater === "function" ? updater(previous) : updater ?? {};

        const openEntries = Object.entries(nextState).filter(([, isOpen]) =>
          Boolean(isOpen)
        );

        if (openEntries.length === 0) return {};

        const newlyOpened = openEntries.find(
          ([rowId]) => !getIsExpanded(previous, rowId)
        );
        const [rowId] = newlyOpened ?? openEntries[0];

        return { [rowId]: true } satisfies ExpandedState;
      });
    },
    []
  );

  const handleRowToggle = useCallback(
    (rowData: StakeAccountData, rowId: string) => {
      setExpanded((previous) => {
        const newValue = previous[rowId] ? !previous[rowId] : true;
        return { ...previous, [rowId]: newValue };
      });
      setSelectedRow(rowData);
    },
    []
  );

  // Table Setup
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onExpandedChange: handleExpandedChange,
    getRowId: (row) => row.id,
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
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold uppercase tracking-wide text-white/50 text-center"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
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
                          className="animate-pulse hover:bg-transparent"
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
                  return (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={table.getAllColumns().length}
                        className="h-24 text-center text-white/60"
                      >
                        No stake accounts found
                      </TableCell>
                    </TableRow>
                  );
                }

                return table.getRowModel().rows.map((row) => {
                  return (
                    <Fragment key={row.id}>
                      {/* Main Row */}
                      <TableRow
                        data-state={row.getIsExpanded() ? "open" : undefined}
                        className="cursor-pointer select-none transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        onClick={() => handleRowToggle(row.original, row.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleRowToggle(row.original, row.id);
                          }
                        }}
                        tabIndex={0}
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

                      <AnimatePresence initial={false} mode="wait">
                        {/* Expanded Content Row */}
                        {row.getIsExpanded() && (
                          <TableRow
                            key={`expanded-${row.id}`}
                            className="hover:bg-transparent"
                          >
                            <TableCell
                              colSpan={row.getVisibleCells().length}
                              className="p-0 bg-black/5"
                            >
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{
                                  height: "auto",
                                  opacity: 1,
                                  transition: {
                                    height: {
                                      duration: 0.25,
                                      ease: "easeInOut",
                                    },
                                    opacity: { duration: 0.2, delay: 0.1 },
                                  },
                                }}
                                exit={{
                                  height: 0,
                                  opacity: 0,
                                  transition: {
                                    height: {
                                      duration: 0.25,
                                      ease: "easeInOut",
                                    },
                                    opacity: { duration: 0.2 },
                                  },
                                }}
                                style={{ overflow: "hidden" }}
                              >
                                <StakeAccountVoteProposals
                                  stakeAccount={row.original}
                                />
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  );
                });
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
