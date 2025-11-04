import { useEndpoint } from "@/contexts/EndpointContext";
import { getValidatorProposalVoteAccount } from "@/data/getValidatorProposalVoteAccount";
import { GET_VALIDATOR_PROPOSAL_VOTE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";
import { useValidatorVoteAccounts } from "./useValidatorVoteAccounts";

export const useValidatorProposalVoteAccount = (
  proposalId: string | undefined,
  userPubKey: string | undefined,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  const { data: voteAccount, isFetched: isFetchedVoteAccounts } =
    useValidatorVoteAccounts(userPubKey, enabled);

  const queryEnabled = enabled && isFetchedVoteAccounts && !!voteAccount;

  return useQuery({
    queryKey: [
      GET_VALIDATOR_PROPOSAL_VOTE_ACCOUNTS,
      endpoint,
      proposalId,
      userPubKey,
      voteAccount,
    ],
    enabled: queryEnabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () =>
      getValidatorProposalVoteAccount({ endpoint }, proposalId, voteAccount),
  });
};
