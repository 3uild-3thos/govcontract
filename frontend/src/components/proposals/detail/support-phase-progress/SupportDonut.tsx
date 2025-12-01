"use client";

import { useMemo } from "react";
import { useSpring, animated, to } from "@react-spring/web";
import { formatSOL } from "@/lib/governance/formatters";
import { DONUT_CONFIG, DonutChartBase } from "../shared/DonutChartBase";

interface SupportDonutProps {
  currentSupportLamports: number;
  requiredThresholdLamports: number;
}

export function SupportDonut({
  currentSupportLamports,
  requiredThresholdLamports,
}: SupportDonutProps) {
  const { progressPercent, isThresholdMet, remainingSol } = useMemo(() => {
    const progress =
      requiredThresholdLamports > 0
        ? (currentSupportLamports / requiredThresholdLamports) * 100
        : 0;

    const remaining = Math.max(
      0,
      requiredThresholdLamports - currentSupportLamports
    );

    return {
      progressPercent: progress,
      isThresholdMet: currentSupportLamports >= requiredThresholdLamports,
      remainingSol: formatSOL(remaining),
    };
  }, [currentSupportLamports, requiredThresholdLamports]);

  // Clamp display to 100% for the arc (even if progress > 100%)
  const displayPercent = Math.min(progressPercent, 100) / 100;

  // Animation spring
  const { progress } = useSpring({
    progress: displayPercent,
    from: { progress: 0 },
    config: { mass: 1, tension: 170, friction: 26 },
  });

  const arcLength = to([progress], (p) => p * DONUT_CONFIG.circumference);

  const gradients = (
    <linearGradient
      id="supportGradient"
      gradientUnits="userSpaceOnUse"
      x1="60"
      y1="10"
      x2="60"
      y2="110"
    >
      <stop offset="0%" stopColor="#004CC7" />
      <stop offset="100%" stopColor="#11C67D" />
    </linearGradient>
  );

  const centerContent = (
    <>
      <span className="text-2xl font-semibold text-foreground md:text-3xl">
        {progressPercent.toFixed(1)}%
      </span>
      <span className="text-sm text-gray-400">reached</span>
      <span
        className={`mt-1 text-xs font-medium ${
          isThresholdMet ? "text-emerald-400" : "text-primary"
        }`}
      >
        {isThresholdMet ? "Threshold reached!" : `${remainingSol} SOL needed`}
      </span>
    </>
  );

  return (
    <DonutChartBase gradients={gradients} centerContent={centerContent}>
      <animated.circle
        cx={DONUT_CONFIG.center.x}
        cy={DONUT_CONFIG.center.y}
        r={DONUT_CONFIG.radius}
        fill="none"
        stroke="url(#supportGradient)"
        strokeWidth={DONUT_CONFIG.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={to(
          [arcLength],
          (l) => `${l} ${DONUT_CONFIG.circumference}`
        )}
      />
    </DonutChartBase>
  );
}
