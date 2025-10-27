import { useEndpoint } from "@/contexts/EndpointContext";
import { getVoteAccounts } from "@/data";
import { GET_VOTE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useVoteAccounts = (enabled = true) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    queryKey: [GET_VOTE_ACCOUNTS, endpoint],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getVoteAccounts({ endpoint }),
  });
};
