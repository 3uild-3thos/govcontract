"use client";

import { BubbleVote } from "@/hooks";
import { BubbleChart } from "./ui/BubbleChart";
import { BubbleChartLoadingSkeleton } from "./ui/BubbleChartLoadingSkeleton";

interface Props {
  votes: BubbleVote[];
  isLoading: boolean;
  selectedValidator?: string | undefined;
  handleSelectValidator?: (id: string) => void;
}

export function VotesBubbleChart({
  votes,
  isLoading,
  selectedValidator,
  handleSelectValidator,
}: Props) {
  if (isLoading || votes.length === 0) {
    return <BubbleChartLoadingSkeleton />;
  }

  return (
    <BubbleChart
      votes={votes}
      selectedValidator={selectedValidator}
      handleSelectValidator={handleSelectValidator}
    />
  );
}
