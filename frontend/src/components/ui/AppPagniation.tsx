"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const DOTS = "...";

const getPaginationRange = (
  totalPages: number,
  page: number,
): (string | number)[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pageNumbers = new Set<number>();

  pageNumbers.add(1);
  pageNumbers.add(2);
  pageNumbers.add(page);
  pageNumbers.add(totalPages - 1);
  pageNumbers.add(totalPages);

  const sortedPages = Array.from(pageNumbers)
    .sort((a, b) => a - b)
    .filter((p) => p >= 1 && p <= totalPages);

  const resultWithDots: (string | number)[] = [];
  let lastPage = 0;

  for (const p of sortedPages) {
    if (lastPage !== 0 && p > lastPage + 1) {
      resultWithDots.push(DOTS);
    }
    resultWithDots.push(p);
    lastPage = p;
  }
  return resultWithDots;
};

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const paginationRange = getPaginationRange(totalPages, page);

  return (
    <div className="flex w-auto items-center gap-2 text-xs text-white/60">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="inline-flex size-7 items-center justify-center rounded-full bg-transparent text-white/70 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2.5} />
      </button>
      {paginationRange.map((pageNumber, i) => {
        if (pageNumber === DOTS) {
          return (
            <span
              key={i}
              className="flex size-7 items-center justify-center px-1.5"
            >
              <MoreHorizontal className="size-4" />
            </span>
          );
        }
        return (
          <button
            key={i}
            onClick={() => onPageChange(pageNumber as number)}
            className={cn(
              "px-1.5 py-1 text-xs transition",
              pageNumber === page
                ? "font-extrabold text-primary"
                : "font-medium text-white/70 hover:text-white",
            )}
          >
            {pageNumber}
          </button>
        );
      })}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex size-7 items-center justify-center rounded-full bg-transparent text-white/70 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="size-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
};
