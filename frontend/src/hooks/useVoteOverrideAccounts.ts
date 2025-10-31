import { useEndpoint } from "@/contexts/EndpointContext";
import { getVoteOverrideAccounts } from "@/data/getVoteOverrideAccounts";
import { GET_VOTE_OVERRIDE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useVoteOverrideAccounts = (enabled = true) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    queryKey: [GET_VOTE_OVERRIDE_ACCOUNTS, endpoint],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getVoteOverrideAccounts({ endpoint }),
  });
};
