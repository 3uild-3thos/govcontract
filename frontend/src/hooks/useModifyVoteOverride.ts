import { CastVoteOverrideParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { modifyVoteOverrideMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useModifyVoteOverride() {
  const { endpointUrl: endpoint } = useEndpoint();
  return useMutation({
    mutationKey: ["modify-vote-override"],
    mutationFn: (params: CastVoteOverrideParams) =>
      modifyVoteOverrideMutation(params, {
        endpoint,
      }),
  });
}
