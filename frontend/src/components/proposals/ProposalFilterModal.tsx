"use client";

import * as React from "react";
import { AppButton } from "@/components/ui/AppButton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export interface FilterState {
  onlyEligible: boolean;
  status: "all" | "active" | "finalizing" | "finalized";
  lifecycle: "all" | "support" | "voting" | "finished";
  timeWindow: "all" | "24h" | "7d" | "30d";
  minimumSOL: number;
}

const FILTER_OPTIONS = {
  status: [
    { value: "all" as const, label: "All" },
    { value: "active" as const, label: "Active" },
    { value: "finalizing" as const, label: "Finalizing" },
    { value: "finalized" as const, label: "Finalized" },
  ],
  lifecycle: [
    { value: "all" as const, label: "All" },
    { value: "support" as const, label: "Support" },
    { value: "voting" as const, label: "Voting" },
    { value: "finished" as const, label: "Finished" },
  ],
  timeWindow: [
    { value: "all" as const, label: "All Time" },
    { value: "24h" as const, label: "Last 24 Hours" },
    { value: "7d" as const, label: "Last 7 Days" },
    { value: "30d" as const, label: "Last 30 Days" },
  ],
} as const;

const defaultFilters: FilterState = {
  onlyEligible: false,
  status: "all",
  lifecycle: "all",
  timeWindow: "all",
  minimumSOL: 0,
};

export function ProposalFilterModal({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}: FilterModalProps) {
  const [filters, setFilters] = React.useState<FilterState>(initialFilters);

  React.useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  // const handleClose = () => {
  //   setFilters(initialFilters);
  //   onClose();
  // };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="app-modal-content"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="app-modal-scroll-region">
          <div className="app-modal-body">
            {/* Mobile handle bar */}
            <div className="app-modal-handle" />

            <DialogHeader>
              <DialogTitle className="text-foreground font-bold">
                Filter Proposals
              </DialogTitle>
              <DialogDescription className="sr-only">
                Filter and customize the proposal list view
              </DialogDescription>
            </DialogHeader>

            {/* Content */}
            <div className="space-y-6">
              {/* Eligibility Toggle */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">
                  Only show proposals I am eligible to vote on
                </p>
                <Switch
                  checked={filters.onlyEligible}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({ ...prev, onlyEligible: checked }))
                  }
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-wide text-white/60">
                  Status
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {FILTER_OPTIONS.status.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          status: option.value,
                        }))
                      }
                      className={cn(
                        "px-3 py-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-w-0",
                        filters.status === option.value
                          ? "bg-gradient-to-r from-primary to-secondary text-foreground"
                          : "bg-white/10 text-white/70 hover:bg-white/20",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lifecycle Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-wide text-white/60">
                  Lifecycle
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {FILTER_OPTIONS.lifecycle.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          lifecycle: option.value,
                        }))
                      }
                      className={cn(
                        "px-3 py-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-w-0",
                        filters.lifecycle === option.value
                          ? "bg-gradient-to-r from-primary to-secondary text-foreground"
                          : "bg-white/10 text-white/70 hover:bg-white/20",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Window Filter */}
              <div className="space-y-3">
                <p className="text-sm font-semibold tracking-wide text-white/60">
                  Time Window
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                  {FILTER_OPTIONS.timeWindow.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          timeWindow: option.value,
                        }))
                      }
                      className={cn(
                        "px-3 py-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap min-w-0",
                        filters.timeWindow === option.value
                          ? "bg-gradient-to-r from-primary to-secondary text-foreground"
                          : "bg-white/10 text-white/70 hover:bg-white/20",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced - Minimum SOL */}
              <div className="space-y-2">
                <label
                  htmlFor="minimum-sol"
                  className="text-sm font-semibold tracking-wide text-white/60"
                >
                  Minimum SOL Required
                </label>
                <input
                  id="minimum-sol"
                  type="number"
                  min="0"
                  step="0.1"
                  value={filters.minimumSOL === 0 ? "" : filters.minimumSOL}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      minimumSOL: value === "" ? 0 : parseFloat(value) || 0,
                    }));
                  }}
                  className={cn(
                    "input",
                    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 mt-2",
                    "placeholder:text-sm placeholder:text-white/80",
                  )}
                  placeholder="0.0"
                />
                <p className="text-xs text-white/50">
                  Only show proposals requiring at least this amount of SOL
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="app-modal-footer">
          <AppButton
            variant="outline"
            text="Reset"
            size="lg"
            onClick={handleReset}
            className="font-semibold"
          />
          <AppButton
            variant="gradient"
            text="Apply"
            size="lg"
            onClick={handleApply}
            className="font-semibold"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
