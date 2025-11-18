import { useMemo } from "react";
import { useProposals } from "./useProposals";

export interface SummaryStatsData {
  total: number;
  active: number;
  finalized: number;
}

export const useSummaryStats = () => {
  const { data: proposals, isLoading, error } = useProposals();

  const stats = useMemo((): SummaryStatsData => {
    if (!proposals) {
      return {
        total: 0,
        active: 0,
        finalized: 0,
      };
    }

    const total = proposals.length;
    const active = proposals.filter(
      (proposal) =>
        proposal.status === "supporting" || proposal.status === "voting"
    ).length;
    const finalized = proposals.filter(
      (proposal) => proposal.status === "finalized"
    ).length;

    return {
      total,
      active,
      finalized,
    };
  }, [proposals]);

  return {
    data: stats,
    isLoading,
    error,
  };
};
