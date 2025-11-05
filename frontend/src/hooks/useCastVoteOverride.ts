import { CastVoteOverrideParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { castVoteOverrideMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";
import { useSnapshotMeta } from "./useSnapshotMeta";

export function useCastVoteOverride() {
  const { endpointUrl: endpoint, endpointType } = useEndpoint();
  const { data: meta } = useSnapshotMeta();

  return useMutation({
    mutationKey: ["cast-vote-override"],
    mutationFn: (params: CastVoteOverrideParams) =>
      castVoteOverrideMutation(
        params,
        {
          endpoint,
          network: endpointType,
        },
        meta?.slot
      ),
  });
}
