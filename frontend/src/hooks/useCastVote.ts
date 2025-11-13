import { CastVoteParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { castVoteMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";
import { useSnapshotMeta } from "./useSnapshotMeta";

export function useCastVote() {
  const { endpointUrl: endpoint, endpointType } = useEndpoint();
  const { data: meta } = useSnapshotMeta();

  return useMutation({
    mutationKey: ["cast-vote"],
    mutationFn: (params: CastVoteParams) =>
      castVoteMutation(
        params,
        {
          endpoint,
          network: endpointType,
        },
        meta?.slot
      ),
  });
}
