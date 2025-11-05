import { useEndpoint } from "@/contexts/EndpointContext";
import { getVoteOverrideAccounts } from "@/data";
import { GET_WALLET_VOTE_OVERRIDE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useWalletVoteOverrideAccounts = (
  proposalId: string | undefined,
  userPubKey: string | undefined,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  const queryEnabled = enabled && !!proposalId && !!userPubKey;

  return useQuery({
    queryKey: [
      GET_WALLET_VOTE_OVERRIDE_ACCOUNTS,
      endpoint,
      proposalId,
      userPubKey,
    ],
    enabled: queryEnabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getVoteOverrideAccounts(endpoint, proposalId, userPubKey),
  });
};
