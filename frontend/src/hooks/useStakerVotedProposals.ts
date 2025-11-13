import { useQuery } from "@tanstack/react-query";
import { useProposals } from "./useProposals";
import { getVoteProposals } from "@/data/getVoteProposals";
import { StakeAccountData } from "@/types/stakeAccounts";
import { useVoteOverrideAccounts } from "./useVoteOverrideAccounts";
import { GetVoteOverrideFilters } from "@/data";

function buildVoteOverrideFilters(
  stakeAccount: StakeAccountData
): GetVoteOverrideFilters {
  return [
    {
      name: "stakeAccount",
      value: stakeAccount.stakeAccount,
    },
  ];
}

export const useStakerVotedProposals = (
  stakeAccount: StakeAccountData,
  enabled = true
) => {
  const voteOverrideFilters = buildVoteOverrideFilters(stakeAccount);
  const { data: voteOverrideAccounts, isLoading: isLoadingVotes } =
    useVoteOverrideAccounts(voteOverrideFilters);

  const { data: proposals, isLoading: isLoadingProposals } = useProposals();

  const dependenciesReady =
    !!voteOverrideAccounts &&
    !isLoadingVotes &&
    !!proposals &&
    !isLoadingProposals;

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: enabled && dependenciesReady,
    queryKey: ["vote-proposals", stakeAccount.stakeAccount],
    queryFn: async () => {
      if (!voteOverrideAccounts) throw new Error("Unable to get vote accounts");
      if (!proposals) throw new Error("Unable to get proposals");

      return getVoteProposals(voteOverrideAccounts, proposals);
    },
  });
};
