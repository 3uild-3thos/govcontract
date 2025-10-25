import { useEndpoint } from "@/contexts/EndpointContext";
import { getDelegatedStakeAccounts } from "@/data/getDelegatedStakeAccounts";
import { GET_DELEGATED_STAKE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useDelegatedStakeAccounts = (userPubKey: string) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: [GET_DELEGATED_STAKE_ACCOUNTS, userPubKey],
    queryFn: () => getDelegatedStakeAccounts({ endpoint }, userPubKey),
  });
};
