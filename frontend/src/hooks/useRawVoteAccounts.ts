import { useEndpoint } from "@/contexts/EndpointContext";
import { Connection, VoteAccountInfo } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { GET_VOTE_ACCOUNTS } from "@/helpers";

export interface RawVoteAccountsData {
  current: VoteAccountInfo[];
  delinquent: VoteAccountInfo[];
}

/**
 * Hook to fetch raw Solana vote accounts (current and delinquent)
 * Caches the data for reuse across components
 * @returns The raw vote accounts data, or undefined if loading/error
 */
export function useRawVoteAccounts() {
  const { endpointUrl } = useEndpoint();

  return useQuery<RawVoteAccountsData>({
    queryKey: [GET_VOTE_ACCOUNTS, endpointUrl],
    queryFn: async () => {
      const connection = new Connection(endpointUrl, "confirmed");
      const voteAccounts = await connection.getVoteAccounts();

      return {
        current: voteAccounts.current,
        delinquent: voteAccounts.delinquent,
      };
    },
    staleTime: 1000 * 120, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

