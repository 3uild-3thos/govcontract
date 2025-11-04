import { useEndpoint } from "@/contexts/EndpointContext";
import { getUserHasVoted } from "@/data";
import { GET_USER_HAS_VOTED } from "@/helpers";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useWalletVoteOverrideAccounts } from "./useWalletVoteOverrideAccounts";
import { useWalletRole } from "./useWalletRole";
import { WalletRole } from "@/types";
import { useValidatorProposalVoteAccount } from "./useValidatorProposalVoteAccount";

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
  } = useWalletVoteOverrideAccounts(
    proposalPublicKey,
    publicKey?.toBase58(),
    fetchVoteOverrideEnabled
  );

  const { data: voteAccount, isLoading: isLoadingVoteAccount } =
    useValidatorProposalVoteAccount(
      proposalPublicKey,
      publicKey?.toBase58(),
      fetchVoteAccountsEnabled
    );

  const enabled =
    connected &&
    !!publicKey &&
    enabledProp &&
    !!proposalPublicKey &&
    !isLoadingVoteOverrideAccounts &&
    !isLoadingVoteAccount;

  const query = useQuery({
    queryKey: [
      GET_USER_HAS_VOTED,
      endpoint,
      proposalPublicKey,
      voteOverrideAccounts.length,
      !!voteAccount,
    ],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getUserHasVoted(voteOverrideAccounts, voteAccount),
  });

  const isLoading = isLoadingVoteOverrideAccounts || query.isLoading;

  return { ...query, isLoading };
};
