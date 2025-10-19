import { CastVoteParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { castVoteMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useCastVote() {
  const { endpointUrl: endpoint } = useEndpoint();
  return useMutation({
    mutationKey: ["cast-vote"],
    mutationFn: (params: CastVoteParams) =>
      castVoteMutation(params, {
        endpoint,
      }),
  });
}
