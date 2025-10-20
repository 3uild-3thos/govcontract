import { getStakeAccounts } from "@/data";
import { GET_STAKE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useStakeAccounts = () => {
  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: [GET_STAKE_ACCOUNTS],
    queryFn: getStakeAccounts,
  });
};
