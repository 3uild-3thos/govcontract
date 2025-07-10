import { useQuery } from "@tanstack/react-query";
import { useGetValidatorsTable } from "./useGetValidatorsTable";
import {
  useValidatorsVoterSplits,
  VoteSplitAnalytics,
  VoteType,
} from "./useValidatorsVoterSplits";

const VOTE_TYPES: VoteType[] = ["yes", "no", "abstain", "undecided"];

export interface BubbleVote {
  type: VoteType;
  voteIdentity: string;
  value: number;
  image?: string | null;
  r?: number;
  x?: number;
  y?: number;
}

export interface ValidatorInfo {
  voteIdentity: string;
  name: string;
  description: string;
  commission: number;
  asn: string;
  staked: number;
  voterSplit: VoteSplitAnalytics;
  voteCount: number;
}

export type BubbleValidatorInfoMap = Record<string, ValidatorInfo>;

export const useGetValidatorsBubbleChart = () => {
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
    staleTime: 0, // no need to stale/cache this query
    queryKey: ["validatorsVotesBubbleChart"],
    enabled,
    initialData: { votes: [], validatorsInfo: {} },
    queryFn: () => {
      // for each validator, get its voters splits
      const rawData: BubbleVote[] = [];

      const validatorsInfo: BubbleValidatorInfoMap = {};

      let maxValue = 0;
      if (voterSplits) {
        validators?.slice(0, 10)?.forEach((validator) => {
          const validatorVoterSplits =
            voterSplits.voterSplits[validator.vote_identity];
          if (validatorVoterSplits !== undefined) {
            validatorsInfo[validator.vote_identity] = {
              voteIdentity: validator.vote_identity,
              name: validator.name,
              description: validator.description || "-",
              commission: validator.commission,
              asn: validator.asn || "-",
              staked: validator.activated_stake,
              voterSplit: validatorVoterSplits,
              voteCount: voterSplits.votesCount[validator.vote_identity],
            };
            VOTE_TYPES.forEach((type) => {
              // scale it by validators stake
              const value =
                (validatorVoterSplits[type] * 100) / validator.activated_stake;
              if (value > maxValue) maxValue = value;
              rawData.push({
                voteIdentity: validator.vote_identity,
                type,
                value,
                image: validator.image,
              });
            });
          }
        });
      }

      const data = rawData.map((d) => ({
        ...d,
        value: (d.value / maxValue) * 100,
      }));

      return { votes: data, validatorsInfo };
    },
  });

  return { ...query, isLoading: isLoadingSubqueries || query.isLoading };
};
