"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowUp, ArrowDown } from "lucide-react";

interface SortableHeaderButtonProps<TData, TValue> {
  column: Column<TData, TValue>;
  label: string;
  uppercase?: boolean;
  className?: string;
}

export function SortableHeaderButton<TData, TValue>({
  column,
  label,
  uppercase = true,
  className = "flex items-center justify-center gap-1.5 hover:text-white transition-colors mx-auto",
}: SortableHeaderButtonProps<TData, TValue>) {
  const sorted = column.getIsSorted();

  return (
    <button
      className={className}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {uppercase ? label.toUpperCase() : label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" strokeWidth={3} />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" strokeWidth={3} />
      ) : (
        <ArrowUp className="size-3.5 opacity-40" strokeWidth={3} />
      )}
    </button>
  );
}
