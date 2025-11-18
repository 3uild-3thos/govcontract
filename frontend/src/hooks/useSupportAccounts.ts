import { useEndpoint } from "@/contexts/EndpointContext";
import { getSupportAccounts, GetSupportFilters } from "@/data";
import { GET_WALLET_SUPPORT_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useSupportAccounts = (
  filters: GetSupportFilters,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    queryKey: [GET_WALLET_SUPPORT_ACCOUNTS, endpoint, filters],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getSupportAccounts(endpoint, filters),
  });
};
