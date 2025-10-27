import { SupportProposalParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { supportProposalMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useSupportProposal() {
  const { endpointUrl: endpoint } = useEndpoint();
  return useMutation({
    mutationKey: ["support-proposal"],
    mutationFn: (params: SupportProposalParams) =>
      supportProposalMutation(params, {
        endpoint,
      }),
  });
}
