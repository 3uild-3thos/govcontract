import { useQuery } from "@tanstack/react-query";
import { useGetValidatorsTable } from "./useGetValidatorsTable";
import { useValidatorsVoterSplits } from "./useValidatorsVoterSplits";
import { shortenPublicKey } from "@/helpers";

export type VoteTypeText = "Yes" | "No" | "Abstain" | "None";

const VOTE_TYPES: VoteTypeText[] = ["Yes", "No", "Abstain", "None"];

interface ValidatorVote {
  address: string;
  voteType: VoteTypeText;
  voteWeight?: number;
}

export const useGetValidatorsTableMobile = () => {
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidatorsTable("weight");
  const { data: voterSplits, isLoading: isLoadingSplits } =
    useValidatorsVoterSplits();

  const validatorsReady =
    !isLoadingValidators && validators && validators.length > 0;
  const voterSplitsReady =
    !isLoadingSplits && voterSplits && Object.keys(voterSplits).length > 0;
  const enabled = !!(validatorsReady && voterSplitsReady);

  const isLoadingSubqueries = isLoadingSplits || isLoadingValidators;

  const query = useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["validatorsVotes"],
    enabled,
    queryFn: () => {
      // for each validator, get its voters splits
      const data: ValidatorVote[] = [];
      if (voterSplits) {
        validators?.forEach((validator) => {
          const validatorVoterSplits =
            voterSplits.voterSplits[validator.vote_identity];
          if (validatorVoterSplits !== undefined) {
            VOTE_TYPES.forEach((voteType) =>
              data.push({
                address: shortenPublicKey(validator.vote_identity),
                voteType,
                voteWeight: validator.stake_weight,
              })
            );
          }
        });
      }

      return data;
    },
  });

  return { ...query, isLoading: isLoadingSubqueries || query.isLoading };
};
