import { useEndpoint } from "@/contexts/EndpointContext";
import { getStakeAccounts } from "@/data";
import { GET_STAKE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useStakeAccounts = (userPubKey: string, enabled = true) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled,
    queryKey: [GET_STAKE_ACCOUNTS, userPubKey],
    queryFn: () => getStakeAccounts({ endpoint }, userPubKey),
  });
};
