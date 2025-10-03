"use client";

import React, { useMemo } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { formatSOL } from "@/lib/governance/formatters";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const defaultColors = {
  for: { start: "#004CC7", end: "#11C67D" },
  against: { start: "#a855f7", end: "#F43F5F" },
  abstain: { start: "#000000", end: "#9ca3af" },
};

interface QuorumDonutProps {
  forLamports: number;
  againstLamports: number;
  abstainLamports: number;
  quorumPercentage?: number;
}

export default function QuorumDonut({
  forLamports,
  againstLamports,
  abstainLamports,
  quorumPercentage,
}: QuorumDonutProps) {
  const colors = defaultColors;

  // Memoize calculations to avoid re-computing on every render
  const { chartData, totalLamports, totalSol } = useMemo(() => {
    const totalLamports = forLamports + againstLamports + abstainLamports;
    const totalSol = formatSOL(totalLamports);

    const chartData = [
      { name: "For", value: forLamports },
      { name: "Against", value: againstLamports },
      { name: "Abstain", value: abstainLamports },
    ];

    return { chartData, totalLamports, totalSol };
  }, [forLamports, againstLamports, abstainLamports]);

  // Calculate the rotation for the quorum marker in degrees
  const quorumAngleDegrees = quorumPercentage ? quorumPercentage * 360 : 0;

  // SVG Donut Chart calculations
  const radius = 50;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;

  const forPercent = totalLamports > 0 ? chartData[0].value / totalLamports : 0;
  const againstPercent =
    totalLamports > 0 ? chartData[1].value / totalLamports : 0;
  const abstainPercent =
    totalLamports > 0 ? chartData[2].value / totalLamports : 0;

  // Animation spring for the percentages
  const { forP, againstP, abstainP } = useSpring({
    to: {
      forP: forPercent,
      againstP: againstPercent,
      abstainP: abstainPercent,
    },
    from: {
      forP: 0,
      againstP: 0,
      abstainP: 0,
    },
    config: { mass: 1, tension: 170, friction: 26 },
  });

  // Animated lengths
  const forLength = to([forP], (p) => p * circumference);
  const againstLength = to([againstP], (p) => p * circumference);
  const abstainLength = to([abstainP], (p) => p * circumference);

  // Animated offsets
  const againstOffset = to([forP], (fp) => -fp * circumference);
  const abstainOffset = to(
    [forP, againstP],
    (fp, ap) => -(fp + ap) * circumference,
  );

  // Static angles for gradients
  const forAngle = forPercent * 360;
  const againstAngle = againstPercent * 360;

  // Rotation for each gradient to align with its arc
  const forGradientRotate = forAngle / 2;
  const againstGradientRotate = forAngle + againstAngle / 2;
  const abstainGradientRotate =
    forAngle + againstAngle + (abstainPercent * 360) / 2;

  // Calculate marker position using trigonometry so it's independent of segment rotation
  const quorumAngleForCalc = quorumAngleDegrees - 90;
  const quorumAngleRadians = quorumAngleForCalc * (Math.PI / 180);
  const markerX = 60 + radius * Math.cos(quorumAngleRadians);
  const markerY = 60 + radius * Math.sin(quorumAngleRadians);

  return (
    <div className="relative w-full max-w-[220px] sm:max-w-[240px]">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <defs>
          <linearGradient
            id="forGradient"
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="10"
            x2="60"
            y2="110"
            gradientTransform={`rotate(${forGradientRotate} 60 60)`}
          >
            <stop offset="0%" stopColor={colors.for.start} />
            <stop offset="100%" stopColor={colors.for.end} />
          </linearGradient>
          <linearGradient
            id="againstGradient"
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="10"
            x2="60"
            y2="110"
            gradientTransform={`rotate(${againstGradientRotate} 60 60)`}
          >
            <stop offset="0%" stopColor={colors.against.start} />
            <stop offset="100%" stopColor={colors.against.end} />
          </linearGradient>
          <linearGradient
            id="abstainGradient"
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="10"
            x2="60"
            y2="110"
            gradientTransform={`rotate(${abstainGradientRotate} 60 60)`}
          >
            <stop offset="0%" stopColor={colors.abstain.start} />
            <stop offset="100%" stopColor={colors.abstain.end} />
          </linearGradient>
        </defs>
        {/* Chart Background */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
        ></circle>

        <g transform="rotate(-90 60 60)">
          {/* Draw three separate arcs with smooth react-spring animation */}
          {/* Abstain Arc */}
          <animated.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#abstainGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={to(
              [abstainLength],
              (l) => `${l} ${circumference}`,
            )}
            style={{ strokeDashoffset: abstainOffset }}
          />
          {/* Against Arc */}
          <animated.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#againstGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={to(
              [againstLength],
              (l) => `${l} ${circumference}`,
            )}
            style={{ strokeDashoffset: againstOffset }}
          />
          {/* For Arc */}
          <animated.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#forGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={to([forLength], (l) => `${l} ${circumference}`)}
          />
        </g>

        {/* Quorum Marker - Placed with calculated coordinates */}
        <Tooltip>
          <TooltipTrigger asChild>
            <circle
              cx={markerX}
              cy={markerY}
              r={strokeWidth / 2}
              fill="white"
              stroke="#141D2D"
              strokeWidth="1.5"
              className="cursor-pointer"
            />
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="rounded-lg bg-background/50 px-3 py-2 backdrop-blur-xs"
            sideOffset={8}
          >
            <p className="text-xs font-medium text-foreground">
              Quorum:{" "}
              {(quorumPercentage ? quorumPercentage * 100 : 0).toFixed(0)}%
            </p>
          </TooltipContent>
        </Tooltip>
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 mt-3 sm:mt-2 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-lg md:text-lg font-bold text-foreground leading-tight">
          {totalSol}
        </span>
        <span className="text-sm text-gray-400 -mt-0.5 md:mt-0">Total SOL</span>
      </div>
    </div>
  );
}
