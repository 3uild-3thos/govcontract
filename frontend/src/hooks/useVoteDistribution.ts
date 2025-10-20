"use client";

import * as React from "react";

export type VoteOption = "for" | "against" | "abstain";

export interface VoteDistribution {
  for: number;
  against: number;
  abstain: number;
}

export const VOTE_OPTIONS: VoteOption[] = ["for", "against", "abstain"];

const DEFAULT_DISTRIBUTION: VoteDistribution = {
  for: 0,
  against: 0,
  abstain: 0,
};

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

function parsePercentage(raw: string | number) {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return clampPercentage(Math.round(raw));
  }

  const trimmed = String(raw).trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed.replace(/^0+/, "") || "0";
  const parsed = Number.parseInt(normalized, 10);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return clampPercentage(parsed);
}

function adjustDistribution(
  previous: VoteDistribution,
  option: VoteOption,
  nextValue: number,
) {
  const distribution: VoteDistribution = {
    ...previous,
    [option]: nextValue,
  };

  let excess =
    distribution.for + distribution.against + distribution.abstain - 100;

  if (excess <= 0) {
    return distribution;
  }

  for (const currentOption of VOTE_OPTIONS) {
    if (currentOption === option) continue;

    if (distribution[currentOption] <= 0) {
      continue;
    }

    const reduction = Math.min(distribution[currentOption], excess);
    distribution[currentOption] -= reduction;
    excess -= reduction;

    if (excess <= 0) {
      break;
    }
  }

  return distribution;
}

export function useVoteDistribution(
  initial: VoteDistribution = DEFAULT_DISTRIBUTION,
) {
  const initialRef = React.useRef(initial);

  React.useEffect(() => {
    initialRef.current = initial;
  }, [initial]);

  const [distribution, setDistribution] = React.useState(initialRef.current);

  const handleOptionChange = React.useCallback(
    (option: VoteOption, rawValue: string) => {
      setDistribution((prev) =>
        adjustDistribution(prev, option, parsePercentage(rawValue)),
      );
    },
    [],
  );

  const handleQuickSelect = React.useCallback((option: VoteOption) => {
    setDistribution({
      for: option === "for" ? 100 : 0,
      against: option === "against" ? 100 : 0,
      abstain: option === "abstain" ? 100 : 0,
    });
  }, []);

  const resetDistribution = React.useCallback((next?: VoteDistribution) => {
    setDistribution(next ?? initialRef.current);
  }, []);

  const totalPercentage =
    distribution.for + distribution.against + distribution.abstain;
  const isValidDistribution = totalPercentage === 100;

  return {
    distribution,
    totalPercentage,
    isValidDistribution,
    handleOptionChange,
    handleQuickSelect,
    resetDistribution,
  };
}

