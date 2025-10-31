"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { VoteDistribution, VoteOption, VOTE_OPTIONS } from "@/hooks";

const OPTION_CONFIG: Record<
  VoteOption,
  {
    label: string;
    quickLabel: string;
    quickSelectedClass: string;
    progressClass: string;
    thumbClass: string;
  }
> = {
  for: {
    label: "For",
    quickLabel: "100% For",
    quickSelectedClass: "bg-primary/20 hover:bg-primary/30 text-primary",
    progressClass: "[&>div]:bg-primary/60",
    thumbClass: "bg-background border-2 border-primary/60",
  },
  against: {
    label: "Against",
    quickLabel: "100% Against",
    quickSelectedClass:
      "bg-destructive/20 hover:bg-destructive/30 text-destructive",
    progressClass: "[&>div]:bg-destructive/60",
    thumbClass: "bg-background border-2 border-destructive/60",
  },
  abstain: {
    label: "Abstain",
    quickLabel: "100% Abstain",
    quickSelectedClass: "bg-white/3 hover:bg-white/3 text-white/30",
    progressClass: "[&>div]:bg-background/60",
    thumbClass: "bg-background border-2 border-white/40",
  },
};

const QUICK_OPTION_BASE_CLASS =
  "px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 text-white/50";

const MOBILE_INPUT_CLASS = cn(
  "w-full rounded-md border bg-white/5 px-2 py-1.5 text-center",
  "text-default sm:text-sm text-white/50 placeholder:text-white/40",
  "border-white/10 focus:border-primary focus:outline-none sm:py-1",
);

interface VoteDistributionControlsProps {
  distribution: VoteDistribution;
  totalPercentage: number;
  isValidDistribution: boolean;
  onOptionChange: (option: VoteOption, value: string) => void;
  onQuickSelect: (option: VoteOption) => void;
  quickOptionsLabel?: string;
  distributionLabel?: string;
  invalidTotalMessage?: string;
  className?: string;
}

export function VoteDistributionControls({
  distribution,
  totalPercentage,
  isValidDistribution,
  onOptionChange,
  onQuickSelect,
  quickOptionsLabel = "Quick Vote Options",
  distributionLabel = "New Vote Distribution",
  invalidTotalMessage,
  className,
}: VoteDistributionControlsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-3">
        <p className="text-sm font-medium text-white/80">{quickOptionsLabel}</p>
        <div className="grid grid-cols-3 gap-3">
          {VOTE_OPTIONS.map((option) => {
            const config = OPTION_CONFIG[option];
            const isSelected = distribution[option] === 100;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onQuickSelect(option)}
                className={cn(
                  QUICK_OPTION_BASE_CLASS,
                  isSelected && config.quickSelectedClass,
                )}
              >
                {config.quickLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-white/80">{distributionLabel}</p>
        <div className="space-y-3">
          {VOTE_OPTIONS.map((option) => {
            const config = OPTION_CONFIG[option];
            const value = distribution[option];
            const inputId = `vote-${option}`;
            const mobileInputId = `${inputId}-mobile`;

            return (
              <div key={option} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={inputId}
                    className="text-xs sm:text-sm text-white/60"
                  >
                    {config.label}
                  </label>
                  <span className="text-xs sm:text-sm text-white/80">
                    {value}%
                  </span>
                </div>

                <div className="sm:hidden">
                  <input
                    id={mobileInputId}
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={value}
                    onFocus={(event) => {
                      if (event.target.value === "0") {
                        event.target.value = "";
                      }
                    }}
                    onBlur={(event) => {
                      if (event.target.value === "") {
                        onOptionChange(option, "0");
                      }
                    }}
                    onChange={(event) =>
                      onOptionChange(option, event.target.value)
                    }
                    className={MOBILE_INPUT_CLASS}
                  />
                </div>

                <div className="relative hidden sm:block">
                  <Progress
                    value={value}
                    className={cn("h-2 bg-white/10", config.progressClass)}
                  />
                  <input
                    id={inputId}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={value}
                    onChange={(event) =>
                      onOptionChange(option, event.target.value)
                    }
                    className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow-lg",
                      config.thumbClass,
                    )}
                    style={{ left: `calc(${value}% - 8px)` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span
              className={cn(
                "text-sm font-medium",
                isValidDistribution ? "text-foreground" : "text-destructive",
              )}
            >
              {totalPercentage}%
            </span>
          </div>

          {invalidTotalMessage &&
            !isValidDistribution &&
            totalPercentage > 0 && (
              <p className="text-xs text-destructive">{invalidTotalMessage}</p>
            )}
        </div>
      </div>
    </div>
  );
}
