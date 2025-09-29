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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { VoteAccountData } from "@/dummy-data/wallets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AppButton } from "@/components/ui/AppButton";
import { columns } from "./ValidatorColumns";

interface VoteAccountsTableProps {
  data: VoteAccountData[];
}

const stakeSizeOptions = [
  { value: "All", label: "Stake Size" },
  { value: "1000", label: "> 1,000 SOL" },
  { value: "10000", label: "> 10,000 SOL" },
  { value: "100000", label: "> 100,000 SOL" },
  { value: "1000000", label: "> 1,000,000 SOL" },
];

export function VoteAccountsTable({ data }: VoteAccountsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [searchValue, setSearchValue] = React.useState("");
  const [stakeSizeFilter, setStakeSizeFilter] = React.useState("All");

  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    if (searchValue) {
      filtered = filtered.filter((row) =>
        row.vote_account.toLowerCase().includes(searchValue.toLowerCase()),
      );
    }

    if (stakeSizeFilter !== "All") {
      const threshold = parseFloat(stakeSizeFilter) * 1e9;
      filtered = filtered.filter((row) => row.active_stake >= threshold);
    }

    return filtered;
  }, [data, searchValue, stakeSizeFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleReset = () => {
    setSearchValue("");
    setStakeSizeFilter("All");
    setColumnFilters([]);
    setSorting([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Vote Accounts
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/50" />
            <input
              placeholder="Search vote accounts..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 input"
            />
          </div>

          <Select value={stakeSizeFilter} onValueChange={setStakeSizeFilter}>
            <SelectTrigger className="w-[180px] text-white/60">
              <SelectValue placeholder="Stake Size" />
            </SelectTrigger>
            <SelectContent className="select-background">
              {stakeSizeOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-foreground"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AppButton
            variant="outline"
            onClick={handleReset}
            className=" bg-transparent text-white"
          >
            Reset
          </AppButton>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 glass-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-white/10"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold uppercase tracking-wide text-white/50 text-center"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-white/10 hover:bg-transparent"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4 text-white/80 text-center"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-white/60"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-white/60">
          Total Validators: {filteredData.length.toLocaleString()}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Rows per page</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="select-background">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-foreground"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="size-8 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="size-8 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-sm text-white/60">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span className="text-sm text-white/60">/</span>
              <span className="text-sm text-white/60">
                {table.getPageCount()}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="size-8 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="size-8 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
