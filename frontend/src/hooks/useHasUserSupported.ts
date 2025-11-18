import { useEndpoint } from "@/contexts/EndpointContext";
import { getUserHasSupported, GetSupportFilters } from "@/data";
import { GET_USER_HAS_SUPPORTED } from "@/helpers";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useSupportAccounts } from "./useSupportAccounts";
import { useWalletRole } from "./useWalletRole";
import { WalletRole } from "@/types";

/**
 * Builds support filters for a specific proposal and validator
 */
function buildSupportFilters(
  proposalPublicKey: string | undefined,
  validatorPublicKey: PublicKey | null
): GetSupportFilters {
  const filters: GetSupportFilters = [];

  if (proposalPublicKey) {
    filters.push({
      name: "proposal" as const,
      value: proposalPublicKey,
    });
  }

  if (validatorPublicKey) {
    filters.push({
      name: "validator" as const,
      value: validatorPublicKey.toBase58(),
    });
  }

  return filters;
}

export const useHasUserSupported = (
  proposalPublicKey: string | undefined,
  enabledProp = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();
  const { publicKey, connected } = useWallet();

  const { walletRole } = useWalletRole(publicKey?.toBase58());

  const isValidator = walletRole === WalletRole.VALIDATOR;
  const isBoth = walletRole === WalletRole.BOTH;

  const fetchSupportEnabled = isBoth || isValidator;

  const supportFilters = buildSupportFilters(proposalPublicKey, publicKey);

  const fetchSupportAccountsEnabled =
    fetchSupportEnabled && supportFilters.length > 0; // at least one filter is required

  const { data: supportAccounts = [], isLoading: isLoadingSupportAccounts } =
    useSupportAccounts(supportFilters, fetchSupportAccountsEnabled);

  const enabled =
    connected &&
    !!publicKey &&
    enabledProp &&
    !!proposalPublicKey &&
    !isLoadingSupportAccounts;

  const query = useQuery({
    queryKey: [
      GET_USER_HAS_SUPPORTED,
      endpoint,
      proposalPublicKey,
      supportAccounts.length,
    ],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getUserHasSupported(supportAccounts),
  });

  const isLoading = isLoadingSupportAccounts || query.isLoading;

  return { ...query, isLoading };
};
