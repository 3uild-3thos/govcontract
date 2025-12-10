import { useEndpoint } from "@/contexts/EndpointContext";
import { getProposals } from "@/data";
import { GET_ALL_PROPOSALS } from "@/helpers";
import { useQuery } from "@tanstack/react-query";
import { useEpochInfo } from "./useEpochInfo";
import { useRawVoteAccounts } from "./useRawVoteAccounts";

export const useProposals = (filters?: {
  voting?: boolean;
  finalized?: boolean;
}) => {
  const { endpointUrl: endpoint } = useEndpoint();
  const { data: epochData, isLoading: isLoadingEpochInfo } = useEpochInfo();
  const { data: voteAccountsData, isLoading: isLoadingVoteAccounts } =
    useRawVoteAccounts();

  const query = useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: [
      GET_ALL_PROPOSALS,
      filters,
      epochData?.epochInfo.epoch,
      voteAccountsData?.current.length,
    ],
    queryFn: () => {
      if (!epochData) {
        throw new Error("Epoch info not available");
      }
      if (!voteAccountsData) {
        throw new Error("Vote accounts not available");
      }
      return getProposals(
        endpoint,
        filters,
        epochData.epochInfo,
        voteAccountsData
      );
    },
    enabled: !!epochData && !!voteAccountsData,
  });

  const isLoading =
    isLoadingEpochInfo || isLoadingVoteAccounts || query.isLoading;
  return { ...query, isLoading };
};
