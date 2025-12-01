"use client";

import type { ReactNode } from "react";

export const DONUT_CONFIG = {
  radius: 50,
  strokeWidth: 7,
  viewBox: "0 0 120 120",
  center: { x: 60, y: 60 },
  get circumference() {
    return 2 * Math.PI * this.radius;
  },
} as const;

interface DonutChartBaseProps {
  children: ReactNode;
  centerContent: ReactNode;
  centerClassName?: string;
  gradients?: ReactNode;
  overlay?: ReactNode;
  className?: string;
}

export function DonutChartBase({
  children,
  centerContent,
  centerClassName,
  gradients,
  overlay,
  className,
}: DonutChartBaseProps) {
  return (
    <div
      className={className ?? "relative w-full max-w-[220px] sm:max-w-[240px]"}
    >
      <svg viewBox={DONUT_CONFIG.viewBox} className="h-full w-full">
        {gradients && <defs>{gradients}</defs>}

        {/* Background circle */}
        <circle
          cx={DONUT_CONFIG.center.x}
          cy={DONUT_CONFIG.center.y}
          r={DONUT_CONFIG.radius}
          fill="none"
          stroke="#374151"
          strokeWidth={DONUT_CONFIG.strokeWidth}
        />

        {/* Arcs container - rotated to start from top */}
        <g
          transform={`rotate(-90 ${DONUT_CONFIG.center.x} ${DONUT_CONFIG.center.y})`}
        >
          {children}
        </g>

        {/* Overlay elements (markers, etc.) - not rotated */}
        {overlay}
      </svg>

      {/* Center content */}
      <div
        className={
          centerClassName ??
          "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        }
      >
        {centerContent}
      </div>
    </div>
  );
}
