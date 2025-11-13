import { SupportProposalParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { supportProposalMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";
import { useSnapshotMeta } from "./useSnapshotMeta";

export function useSupportProposal() {
  const { endpointUrl: endpoint, endpointType } = useEndpoint();
  const { data: meta } = useSnapshotMeta();

  return useMutation({
    mutationKey: ["support-proposal"],
    mutationFn: (params: SupportProposalParams) =>
      supportProposalMutation(
        params,
        {
          endpoint,
          network: endpointType,
        },
        meta?.slot
      ),
  });
}
