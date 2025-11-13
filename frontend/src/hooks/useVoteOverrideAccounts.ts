import { useEndpoint } from "@/contexts/EndpointContext";
import { getVoteOverrideAccounts, GetVoteOverrideFilters } from "@/data";
import { GET_WALLET_VOTE_OVERRIDE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useVoteOverrideAccounts = (
  filters: GetVoteOverrideFilters,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    queryKey: [GET_WALLET_VOTE_OVERRIDE_ACCOUNTS, endpoint, filters],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getVoteOverrideAccounts(endpoint, filters),
  });
};
