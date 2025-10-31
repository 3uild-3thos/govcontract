import { ModifyVoteParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { modifyVoteMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useModifyVote() {
  const { endpointUrl: endpoint } = useEndpoint();

  return useMutation({
    mutationKey: ["modify-vote"],
    mutationFn: (params: ModifyVoteParams) =>
      modifyVoteMutation(params, { endpoint }),
  });
}
