import { useEndpoint } from "@/contexts/EndpointContext";
import { getDelegatedStakeAccounts } from "@/data/getDelegatedStakeAccounts";
import { GET_DELEGATED_STAKE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useDelegatedStakeAccounts = (userPubKey: string | undefined) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: !!userPubKey,
    queryKey: [GET_DELEGATED_STAKE_ACCOUNTS, userPubKey],
    queryFn: () => getDelegatedStakeAccounts({ endpoint }, userPubKey),
  });
};
