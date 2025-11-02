import { useQuery } from "@tanstack/react-query";
import { useVoteAccounts } from "./useVoteAccounts";
import { useProposals } from "./useProposals";
import { getVoteProposals } from "@/data/getVoteProposals";
import { StakeAccountData } from "@/types/stakeAccounts";

export const useVoteProposals = (stakeAccount: StakeAccountData, enabled = true) => {
  const { data: voteAccounts, isLoading: isLoadingVotes } = useVoteAccounts();
  const { data: proposals, isLoading: isLoadingProposals } = useProposals();

  const dependenciesReady = 
    !!voteAccounts && !isLoadingVotes && !!proposals && !isLoadingProposals;

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: enabled && dependenciesReady,
    queryKey: ["vote-proposals", stakeAccount.stakeAccount],
    queryFn: async () => {
      if (!voteAccounts) throw new Error("Unable to get vote accounts");
      if (!proposals) throw new Error("Unable to get proposals");

      return getVoteProposals(voteAccounts, proposals, stakeAccount);
    },
  });
};
