import { useEndpoint } from "@/contexts/EndpointContext";
import { getSupportAccounts, GetSupportFilters } from "@/data";
import { GET_WALLET_SUPPORT_ACCOUNTS } from "@/helpers";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";

/**
 * Builds support filters for a specific proposal and validator
 */
export function buildSupportFilters(
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

export const useSupportAccounts = (
  filters: GetSupportFilters,
  enabled = true
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    queryKey: [GET_WALLET_SUPPORT_ACCOUNTS, endpoint, filters],
    enabled,
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getSupportAccounts(endpoint, filters),
  });
};
