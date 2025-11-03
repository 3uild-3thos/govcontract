import { useEndpoint } from "@/contexts/EndpointContext";
import { getVoteOverrideAccounts } from "@/data/getVoteOverrideAccounts";
import { GET_WALLET_VOTE_OVERRIDE_ACCOUNTS } from "@/helpers";
import { StakeAccountData } from "@/types/stakeAccounts";
import { useQuery } from "@tanstack/react-query";

export const useWalletVoteOverrideAccounts = (
  proposalId: string | undefined,
  stakeAccounts: StakeAccountData[],
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    queryKey: [GET_WALLET_VOTE_OVERRIDE_ACCOUNTS, endpoint],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () =>
      getVoteOverrideAccounts({ endpoint }, proposalId, stakeAccounts),
  });
};
