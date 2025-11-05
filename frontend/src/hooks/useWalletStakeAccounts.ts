import { useEndpoint } from "@/contexts/EndpointContext";
import { getWalletStakeAccounts } from "@/data";
import { GET_STAKE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useWalletStakeAccounts = (
  userPubKey: string | undefined,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: enabled && !!userPubKey,
    queryKey: [GET_STAKE_ACCOUNTS, endpoint, userPubKey],
    queryFn: () => getWalletStakeAccounts(endpoint, userPubKey),
  });
};
