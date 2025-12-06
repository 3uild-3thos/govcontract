import { useEndpoint } from "@/contexts/EndpointContext";
import { useNcnApi } from "@/contexts/NcnApiContext";
import { getVoterWalletSummary } from "@/data";
import { useQuery } from "@tanstack/react-query";
import { useSnapshotMeta } from "./useSnapshotMeta";

export const useVoterWalletSummary = (userPubKey: string | undefined) => {
  const { endpointType } = useEndpoint();
  const { ncnApiUrl } = useNcnApi();
  const { data: meta, isFetched: isFetchedMeta } = useSnapshotMeta();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: isFetchedMeta && !!userPubKey,
    queryKey: ["vote_wallet_summary", endpointType, userPubKey, ncnApiUrl],
    queryFn: () => {
      if (meta === undefined) throw new Error("Snapshot meta info not found");

      return getVoterWalletSummary(
        endpointType,
        userPubKey,
        meta.slot,
        ncnApiUrl
      );
    },
  });
};
