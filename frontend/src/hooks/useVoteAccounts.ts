import { getVoteAccounts } from "@/data";
import { GET_VOTE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useVoteAccounts = () => {
  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: [GET_VOTE_ACCOUNTS],
    queryFn: getVoteAccounts,
  });
};
