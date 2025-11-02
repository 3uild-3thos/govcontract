"use client";

import * as React from "react";
import { Search, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppButton } from "@/components/ui/AppButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountFilterModal } from "./AccountFilterModal";

interface FilterOption {
  value: string;
  label: string;
}

interface TableFiltersProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filters?: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    className?: string;
  }[];
  onReset: () => void;
  disabled?: boolean;
}

export function TableFilters({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  onReset,
  disabled,
}: TableFiltersProps) {
  const [filterModalOpen, setFilterModalOpen] = React.useState(false);

  // Count active filters (only non-default values)
  const activeFilterCount = filters.filter(
    (filter) =>
      filter.value &&
      filter.value !== "all" &&
      filter.value !== "All" &&
      filter.value !== ""
  ).length;

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="h3 font-semibold whitespace-nowrap md:flex-1">
          {title}
        </h3>

        {/* Search, Filters and Reset - aligned right on tablet */}
        <div className="flex items-center gap-3 justify-end md:flex-1">
          <div className="relative flex-1 max-w-xs md:max-w-[200px] lg:max-w-md has-[input:disabled]:opacity-50 ">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/50" />
            <input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 input"
              disabled={disabled}
            />
          </div>

          <div className="relative lg:hidden">
            <Button
              variant="outline"
              size="icon"
              aria-label="Open filters"
              onClick={() => setFilterModalOpen(true)}
              className="size-10 border-white/15 bg-transparent text-white hover:bg-white/10"
              disabled={disabled}
            >
              <ListFilter className="size-4" />
            </Button>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-[10px] font-bold text-foreground pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>

          {/* Mobile/Tablet Reset Button */}
          <AppButton
            variant="outline"
            onClick={onReset}
            className="bg-transparent text-white lg:hidden"
            disabled={disabled}
          >
            Reset
          </AppButton>

          {/* Desktop Filters */}
          <div className="hidden items-center gap-3 lg:flex">
            {filters.map((filter, index) => (
              <Select
                key={index}
                value={filter.value}
                onValueChange={filter.onChange}
                disabled={disabled}
              >
                <SelectTrigger
                  className={filter.className || "w-[180px] text-white/60"}
                >
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent className="select-background">
                  {filter.options.map((option) => (
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
            ))}

            <AppButton
              variant="outline"
              onClick={onReset}
              className="bg-transparent text-white"
              disabled={disabled}
            >
              Reset
            </AppButton>
          </div>
        </div>
      </div>

      {/* Filter Modal for Mobile/Tablet */}
      <AccountFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title={title}
        filters={filters.map((filter) => ({
          label: filter.label || filter.placeholder || "Filter",
          value: filter.value,
          onChange: filter.onChange,
          options: filter.options,
          placeholder: filter.placeholder,
        }))}
        onApply={() => setFilterModalOpen(false)}
      />
    </>
  );
}
