import { useEndpoint } from "@/contexts/EndpointContext";
import { getProposals } from "@/data";
import { GET_ALL_PROPOSALS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";

export const useProposals = () => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: [GET_ALL_PROPOSALS],
    queryFn: () => getProposals({ endpoint }),
  });
};
