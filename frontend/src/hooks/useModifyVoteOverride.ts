import { CastVoteOverrideParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { modifyVoteOverrideMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";
import { useSnapshotMeta } from "./useSnapshotMeta";

export function useModifyVoteOverride() {
  const { endpointUrl: endpoint, endpointType } = useEndpoint();

  const { data: meta } = useSnapshotMeta();
  return useMutation({
    mutationKey: ["modify-vote-override"],
    mutationFn: (params: CastVoteOverrideParams) =>
      modifyVoteOverrideMutation(
        params,
        {
          endpoint,
          network: endpointType,
        },
        meta?.slot
      ),
  });
}
