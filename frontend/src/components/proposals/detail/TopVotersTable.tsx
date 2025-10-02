"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { Download, Search } from "lucide-react";

import { topVoters } from "@/dummy-data/top-voters";
import { topVoterColumns } from "./TopVotersColumns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppButton } from "@/components/ui/AppButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TablePaginationDesktop,
  TablePaginationMobile,
} from "@/components/governance/shared/TablePagination";
import { cn } from "@/lib/utils";

type VoteOutcomeFilter = "all" | "for" | "against" | "abstain";

const FILTER_OPTIONS: { label: string; value: VoteOutcomeFilter }[] = [
  { label: "All Outcomes", value: "all" },
  { label: "For", value: "for" },
  { label: "Against", value: "against" },
  { label: "Abstain", value: "abstain" },
];

const DEFAULT_SORTING: SortingState = [{ id: "stakedLamports", desc: true }];

const TABLE_COLUMNS = topVoterColumns;

export default function TopVotersTable() {
  const [searchValue, setSearchValue] = React.useState("");
  const [outcomeFilter, setOutcomeFilter] =
    React.useState<VoteOutcomeFilter>("all");
  const [sorting, setSorting] = React.useState<SortingState>(() => [
    ...DEFAULT_SORTING,
  ]);

  const filteredData = React.useMemo(() => {
    const searchTerm = searchValue.trim().toLowerCase();

    return topVoters.filter((voter) => {
      if (outcomeFilter !== "all" && voter.voteOutcome !== outcomeFilter) {
        return false;
      }

      if (searchTerm.length === 0) {
        return true;
      }

      return (
        voter.validatorName.toLowerCase().includes(searchTerm) ||
        voter.validatorIdentity.toLowerCase().includes(searchTerm)
      );
    });
  }, [outcomeFilter, searchValue]);

  const table = useReactTable({
    data: filteredData,
    columns: TABLE_COLUMNS,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageSize: 10,
      },
      sorting: DEFAULT_SORTING,
    },
  });

  const handleReset = () => {
    const nextSorting: SortingState = [...DEFAULT_SORTING];
    setSearchValue("");
    setOutcomeFilter("all");
    table.setSorting(nextSorting);
    table.setPageIndex(0);
  };

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-white/10">
      <div className="flex flex-col gap-4 border-b border-white/10  px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <h4 className="h4 font-semibold">Top Voters</h4>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <div className="relative flex-1 max-w-xs md:max-w-[200px] lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/50" />
            <input
              placeholder="Search voters..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 input"
            />
          </div>
          <Select
            key="outcomeFilter"
            value={outcomeFilter}
            onValueChange={(value) =>
              setOutcomeFilter(value as VoteOutcomeFilter)
            }
          >
            <SelectTrigger className="w-[150px] text-foreground">
              <SelectValue placeholder="All Outcomes" />
            </SelectTrigger>
            <SelectContent className="select-background">
              {FILTER_OPTIONS.map((option) => (
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
            className="bg-transparent text-white"
          >
            Reset
          </AppButton>
          <AppButton
            variant="outline"
            size="icon"
            className="bg-transparent text-white"
            aria-label="Download top voters"
          >
            <Download className="size-4" />
          </AppButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full min-w-[720px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-white/10 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/50",
                        columnId === "validatorName"
                          ? "text-left"
                          : "text-center",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-white/5 bg-transparent transition hover:bg-white/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-6 py-5 text-sm",
                        cell.column.id === "validatorName"
                          ? "text-left"
                          : "text-center",
                      )}
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
                  colSpan={TABLE_COLUMNS.length}
                  className="h-28 text-center text-sm text-white/60"
                >
                  No voters match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4 border-t border-white/10 bg-black/20 px-6 py-5">
        <TablePaginationMobile
          table={table}
          totalLabel="Validators"
          totalCount={filteredData.length}
          pageSizeOptions={[10, 20, 30]}
        />
        <TablePaginationDesktop
          table={table}
          totalLabel="Total Validators"
          totalCount={filteredData.length}
          pageSizeOptions={[10, 20, 30, 40, 50]}
        />
      </div>
    </div>
  );
}
