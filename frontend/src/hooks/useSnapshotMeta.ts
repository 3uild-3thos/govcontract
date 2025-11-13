import { buildSolgovUrl, NetworkMetaResponse } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { useQuery } from "@tanstack/react-query";

export const useSnapshotMeta = () => {
  const { endpointType } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["snapshot_meta", endpointType],
    queryFn: async (): Promise<NetworkMetaResponse> => {
      const network = endpointType;

      const url = buildSolgovUrl(`meta?network=${network}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to get snapshot meta info: ${response.statusText}`
        );
      }

      return await response.json();
    },
  });
};
