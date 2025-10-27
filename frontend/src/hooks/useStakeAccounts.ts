import { useEndpoint } from "@/contexts/EndpointContext";
import { getStakeAccounts } from "@/data";
import { GET_STAKE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useStakeAccounts = (userPubKey: string | undefined, enabled = true) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: enabled && !!userPubKey,
    queryKey: [GET_STAKE_ACCOUNTS, userPubKey],
    queryFn: () => getStakeAccounts({ endpoint }, userPubKey),
  });
};
