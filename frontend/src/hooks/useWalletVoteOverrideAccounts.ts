import { useEndpoint } from "@/contexts/EndpointContext";
import { getVoteOverrideAccounts } from "@/data/getVoteOverrideAccounts";
import { GET_WALLET_VOTE_OVERRIDE_ACCOUNTS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";
import { useWalletStakeAccounts } from "./useWalletStakeAccounts";

export const useWalletVoteOverrideAccounts = (
  proposalId: string | undefined,
  userPubKey: string | undefined,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  const { data: stakeAccounts = [], isFetched: isFetchedStakeAccounts } =
    useWalletStakeAccounts(userPubKey);

  const queryEnabled = enabled && isFetchedStakeAccounts;

  return useQuery({
    queryKey: [
      GET_WALLET_VOTE_OVERRIDE_ACCOUNTS,
      endpoint,
      proposalId,
      userPubKey,
    ],
    enabled: queryEnabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getVoteOverrideAccounts(endpoint, proposalId, stakeAccounts),
  });
};
