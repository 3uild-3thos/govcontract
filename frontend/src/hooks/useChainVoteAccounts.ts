import { ChainVoteAccountData } from "@/chain";
import { useEndpoint } from "@/contexts/EndpointContext";
import { Connection, VoteAccountInfo } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";

export const useChainVoteAccounts = () => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["chain_vote_accounts", endpoint],
    queryFn: async (): Promise<ChainVoteAccountData[]> => {
      const connection = new Connection(endpoint, "confirmed");
      const voteAccounts = await connection.getVoteAccounts();

      const mappedVoteAccounts = voteAccounts.current.map(
        mapChainVoteAccountDto
      );
      return mappedVoteAccounts;
    },
  });
};

function mapChainVoteAccountDto(
  voteAccount: VoteAccountInfo
): ChainVoteAccountData {
  return {
    voteAccount: voteAccount.votePubkey,
    activeStake: voteAccount.activatedStake,
    nodePubkey: voteAccount.nodePubkey,
  };
}
