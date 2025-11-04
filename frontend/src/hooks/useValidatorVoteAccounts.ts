import { useEndpoint } from "@/contexts/EndpointContext";
import { GET_WALLET_VOTE_OVERRIDE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";
import { getValidatorVoteAccounts } from "@/data";

export const useValidatorVoteAccounts = (
  userPubKey: string | undefined,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: enabled && !!userPubKey,
    queryKey: [GET_WALLET_VOTE_OVERRIDE_ACCOUNTS, endpoint, userPubKey],
    queryFn: () => getValidatorVoteAccounts({ endpoint }, userPubKey),
  });
};
