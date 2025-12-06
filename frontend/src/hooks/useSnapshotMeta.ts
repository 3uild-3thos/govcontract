import { NetworkMetaResponse } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { useNcnApi } from "@/contexts/NcnApiContext";
import { useQuery } from "@tanstack/react-query";

export const useSnapshotMeta = () => {
  const { endpointType } = useEndpoint();
  const { ncnApiUrl } = useNcnApi();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["snapshot_meta", endpointType, ncnApiUrl],
    queryFn: async (): Promise<NetworkMetaResponse> => {
      const network = endpointType;
      const url = `${ncnApiUrl}/meta?network=${network}`;
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
