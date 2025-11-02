import { useEndpoint } from "@/contexts/EndpointContext";
import { getUserHasVoted } from "@/data";
import { GET_USER_HAS_VOTED } from "@/helpers";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useVoteOverrideAccounts } from "./useVoteOverrideAccounts";
import { useWalletRole } from "./useWalletRole";
import { WalletRole } from "@/types";
import { useVoteAccounts } from "./useVoteAccounts";

export const useHasUserVoted = (
  proposalPublicKey: string | undefined,
  enabledProp = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();
  const { publicKey, connected } = useWallet();

  const { walletRole } = useWalletRole(publicKey?.toBase58());

  const isValidator = walletRole === WalletRole.VALIDATOR;
  const isStaker = walletRole === WalletRole.STAKER;

  const isBoth = isValidator && isStaker;

  const fetchVoteOverrideEnabled = isBoth || isStaker;
  const fetchVoteAccountsEnabled = isBoth || isValidator;

  const {
    data: voteOverrideAccounts = [],
    isLoading: isLoadingVoteOverrideAccounts,
  } = useVoteOverrideAccounts(fetchVoteOverrideEnabled);

  const { data: voteAccounts = [], isLoading: isLoadingVoteAccounts } =
    useVoteAccounts(fetchVoteAccountsEnabled);

  const enabled =
    connected &&
    !!publicKey &&
    enabledProp &&
    !!proposalPublicKey &&
    !isLoadingVoteOverrideAccounts &&
    !isLoadingVoteAccounts;

  const query = useQuery({
    queryKey: [GET_USER_HAS_VOTED, endpoint, proposalPublicKey],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () =>
      getUserHasVoted(
        voteOverrideAccounts,
        voteAccounts,
        publicKey?.toString(),
        proposalPublicKey
      ),
  });

  const isLoading = isLoadingVoteOverrideAccounts || query.isLoading;

  return { ...query, isLoading };
};
