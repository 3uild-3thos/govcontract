import { SupportProposalParams } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { supportProposalMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";
import { useSnapshotMeta } from "./useSnapshotMeta";
import { useChainVoteAccount } from "./useChainVoteAccount";

export function useSupportProposal(userPubKey: string | undefined) {
  const { endpointUrl: endpoint, endpointType } = useEndpoint();
  const { data: meta } = useSnapshotMeta();
  const { data: chainVoteAccount } = useChainVoteAccount(userPubKey);

  return useMutation({
    mutationKey: ["support-proposal", chainVoteAccount],
    mutationFn: (params: SupportProposalParams) =>
      supportProposalMutation(
        params,
        {
          endpoint,
          network: endpointType,
        },
        meta?.slot,
        chainVoteAccount || undefined
      ),
  });
}
