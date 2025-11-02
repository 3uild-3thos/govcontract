import { useMemo } from "react";
import { useProposals } from "./useProposals";
import { useGetValidators } from "./useGetValidators";

export type Stat = {
  id: string;
  label: string;
  value: number;
};

export interface Stats {
  stats: Stat[];
  isLoading: boolean;
}

export const useProposalOverviewStats = (): Stats => {
  const { data: proposals, isLoading: isLoadingProposals } = useProposals();

  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();

  const isLoading = isLoadingProposals || isLoadingValidators;

  const activeProposals = useMemo(
    () => proposals?.filter((p) => p.status === "voting").length || 0,
    [proposals]
  );
  const supportingProposals = useMemo(
    () => proposals?.filter((p) => p.status === "support").length || 0,
    [proposals]
  );

  const numOfValidators = useMemo(() => validators?.length || 0, [validators]);

  return {
    isLoading,
    stats: [
      {
        id: "active-proposals",
        label: "Active Proposals",
        value: activeProposals,
      },
      {
        id: "support-phase-proposals",
        label: "Support Phase Proposals",
        value: supportingProposals,
      },
      {
        id: "number-of-validators",
        label: "Number of Validators",
        value: numOfValidators,
      },
      {
        id: "number-of-stakers",
        label: "Number of Stakers",
        value: 123232232,
      },
    ],
  };
};
