"use client";

import { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps<TData> {
  table: Table<TData>;
  totalLabel: string;
  totalCount: number;
  pageSizeOptions?: number[];
}

export function TablePaginationMobile<TData>({
  table,
  totalLabel,
  totalCount,
  pageSizeOptions = [10, 20, 30],
}: TablePaginationProps<TData>) {
  return (
    <div className="flex flex-col gap-3 px-2 text-sm text-white/60 sm:hidden">
      {/* First Row: Total count and page size */}
      <div className="flex items-center justify-between">
        <span>{totalLabel}: {totalCount.toLocaleString()}</span>
        <div className="flex items-center gap-2">
          <span>Show</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-background">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem
                  key={pageSize}
                  value={`${pageSize}`}
                  className="text-white"
                >
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Second Row: Pagination controls */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="size-9 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="size-9 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="px-3 py-1 bg-white/5 rounded-lg">
          <span className="text-sm font-medium text-white/80">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="size-9 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="size-9 border-white/10 text-white hover:bg-white/5 disabled:opacity-50"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function TablePaginationDesktop<TData>({
  table,
  totalLabel,
  totalCount,
  pageSizeOptions = [10, 20, 30, 40, 50],
}: TablePaginationProps<TData>) {
  return (
    <div className="hidden sm:flex flex-row items-center justify-between gap-4 px-2 text-sm text-white/60">
      <div>
        {totalLabel}: {totalCount.toLocaleString()}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-background">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem
                  key={pageSize}
                  value={`${pageSize}`}
                  className="text-white"
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
  );
}