import { ModifyVoteParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { modifyVoteMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";
import { useSnapshotMeta } from "./useSnapshotMeta";

export function useModifyVote() {
  const { endpointUrl: endpoint, endpointType } = useEndpoint();

  const { data: meta } = useSnapshotMeta();

  return useMutation({
    mutationKey: ["modify-vote"],
    mutationFn: (params: ModifyVoteParams) =>
      modifyVoteMutation(
        params,
        { endpoint, network: endpointType },
        meta?.slot
      ),
  });
}
