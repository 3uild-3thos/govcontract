import { CastVoteOverrideParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import {  castVoteOverrideMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useCastVoteOverride() {
  const { endpointUrl: endpoint } = useEndpoint();
  return useMutation({
    mutationKey: ["cast-vote-override"],
    mutationFn: (params: CastVoteOverrideParams) =>
      castVoteOverrideMutation(params, {
        endpoint,
      }),
  });
}
