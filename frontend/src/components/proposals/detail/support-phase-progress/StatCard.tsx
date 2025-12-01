"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
  secondaryText?: string | ReactNode;
  progressBar?: {
    percent: number;
    colorClass?: string;
  };
  className?: string;
}

export function StatCard({
  label,
  value,
  badge,
  icon,
  secondaryText,
  progressBar,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-xl bg-white/3 p-4",
        className
      )}
    >
      {/* Mobile - title left, badge right / Desktop - title only */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">{label}</span>
          {icon && <div className="flex-shrink-0">{icon}</div>}
        </div>
        {/* Badge on right for mobile, hidden on desktop */}
        {badge && <div className="sm:hidden flex-shrink-0">{badge}</div>}
      </div>

      {/* Badge (desktop only - reserve space for consistent alignment) */}
      <div className="hidden sm:block mt-0.5 min-h-[22px] flex-shrink-0">
        {badge}
      </div>

      {/* Value */}
      <span className="text-xl font-semibold text-foreground mt-1">
        {value}
      </span>

      {/*  Progress bar or secondary text*/}
      <div className="mt-auto pt-2">
        {progressBar && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressBar.colorClass ?? "bg-primary"
              )}
              style={{ width: `${Math.min(progressBar.percent, 100)}%` }}
            />
          </div>
        )}

        {secondaryText && (
          <div className="m-0 text-xs leading-[1.2] text-white/40">
            {secondaryText}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatBadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "purple";
}

export function StatBadge({ children, variant = "default" }: StatBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-white/10 text-white/80",
        variant === "primary" && "bg-primary/20 text-primary",
        variant === "purple" && "bg-purple-500/20 text-purple-400"
      )}
    >
      {children}
    </span>
  );
}
