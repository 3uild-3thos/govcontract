import { useQuery } from "@tanstack/react-query";
import { useGetValidatorsTable } from "./useGetValidatorsTable";
import { useValidatorsVoterSplits, VoteType } from "./useValidatorsVoterSplits";
import { shortenPublicKey } from "@/helpers";

const VOTE_TYPES: VoteType[] = ["yes", "no", "abstain", "undecided"];

export interface Vote {
  type: VoteType;
  address: string;
  value: number;
  image: string | null;
  r?: number;
  x?: number;
  y?: number;
}

export const useGetValidatorsBubbleChart = () => {
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidatorsTable();
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
    queryKey: ["validatorsVotesBubbleChart"],
    enabled,
    queryFn: () => {
      // for each validator, get its voters splits
      const data: Vote[] = [];
      if (voterSplits) {
        validators?.forEach((validator) => {
          const validatorVoterSplits = voterSplits[validator.vote_identity];
          if (validatorVoterSplits !== undefined) {
            VOTE_TYPES.forEach((type) =>
              data.push({
                address: shortenPublicKey(validator.vote_identity),
                type,
                value: validatorVoterSplits[type],
                image: validator.image,
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
