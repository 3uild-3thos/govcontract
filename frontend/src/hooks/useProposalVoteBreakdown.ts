import { useQuery } from "@tanstack/react-query";

import { useGetValidators } from "./useGetValidators";
import { ProposalRecord, Validators } from "@/types";

import {
  useVoteAccountsWithValidators,
  VoteAccountsWithValidators,
} from "./useVoteAccountsWithValidators";
import { REQUIRED_QUORUM_PCT } from "@/chain";
import { useProposals } from "./useProposals";
import { PublicKey } from "@solana/web3.js";

interface LatestProposal {
  title: string;
  description: string;
  voting: boolean;
  finalized: boolean;
  forVotesPercentage: number;
  againstVotesPercentage: number;
  abstainVotesPercentage: number;
  undecidedVotesPercentage: number;
  forStake: number;
  againstStake: number;
  abstainStake: number;
  undecidedStake: number;
  votesCount: number;
  requiredQuorum: number;
  currentQuorumPct: number;
}

export const useProposalVoteBreakdown = (
  proposalPubKey: PublicKey | undefined
) => {
  const { data: proposals, isLoading: isLoadingProposals } = useProposals();
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();
  const { data: votesHashMap, isLoading: isLoadingVotesHashMap } =
    useVoteAccountsWithValidators();

  const isLoading =
    isLoadingProposals || isLoadingValidators || isLoadingVotesHashMap;

  const query = useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: !!proposalPubKey && !!validators && !!proposals && !!votesHashMap,
    queryKey: [
      "latestProposalData",
      proposalPubKey,
      validators?.length,
      proposals?.length,
      votesHashMap,
    ],
    queryFn: () => getData(proposalPubKey, validators, proposals, votesHashMap),
  });

  return { ...query, isLoading };
};

const getData = async (
  proposalPubKey: PublicKey | undefined,
  validators: Validators | undefined,
  proposals: ProposalRecord[] | undefined,
  votesHashMap: VoteAccountsWithValidators | undefined
) => {
  if (
    validators === undefined ||
    proposals === undefined ||
    proposalPubKey === undefined
  )
    throw new Error("Unable to get validators info");
  // if (votes === undefined) throw new Error("Unable to get votes info");

  if (proposals.length === 0) throw new Error("No proposals found");
  // if (votes.length === 0) throw new Error("No votes found");

  const totalStake = validators.reduce((acc, curr) => {
    return (acc += curr.activated_stake);
  }, 0);

  // filter out finished
  // sort bt creationEpoch
  // grab the first one
  const proposal = proposals.find((p) => p.publicKey.equals(proposalPubKey));

  if (proposal === undefined) {
    throw new Error("Proposal not found");
  }

  const { title, description, voting, finalized } = proposal;

  if (votesHashMap === undefined) {
    const latestProposalDataEmpty: LatestProposal = {
      title,
      description,
      voting,
      finalized,
      forVotesPercentage: 0,
      againstVotesPercentage: 0,
      abstainVotesPercentage: 0,
      undecidedVotesPercentage: 0,
      forStake: 0,
      againstStake: 0,
      abstainStake: 0,
      undecidedStake: totalStake,
      votesCount: 0,
      requiredQuorum: 0,
      currentQuorumPct: 0,
    };

    return latestProposalDataEmpty;
  }

  const votes = Object.values(votesHashMap.voteMap);

  let forStakeSum = 0;
  let againstStakeSum = 0;
  let abstainStakeSum = 0;

  let votesCount = 0;
  // for each vote, get validator's activated_stake
  for (const { voteAccount, validator } of votes) {
    if (!proposal.publicKey.equals(voteAccount.proposal) || !validator) {
      continue;
    }

    const stake = validator.activated_stake;

    const forBp = voteAccount.forVotesBp.toNumber(); // 0 - 10000
    const againstBp = voteAccount.againstVotesBp.toNumber();
    const abstainBp = voteAccount.abstainVotesBp.toNumber();

    forStakeSum += (stake * forBp) / 10_000;
    againstStakeSum += (stake * againstBp) / 10_000;
    abstainStakeSum += (stake * abstainBp) / 10_000;
    votesCount += 1;
  }

  // undecided stake = total validator's stake - voted stake
  const votedStake = forStakeSum + againstStakeSum + abstainStakeSum;
  const undecidedStakeSum = totalStake - votedStake;

  const forVotesPercentage = Math.round((forStakeSum / totalStake) * 100);
  const againstVotesPercentage = Math.round(
    (againstStakeSum / totalStake) * 100
  );
  const abstainVotesPercentage = Math.round(
    (abstainStakeSum / totalStake) * 100
  );
  const undecidedVotesPercentage = Math.round(
    (undecidedStakeSum / totalStake) * 100
  );

  const requiredQuorum = Math.round(totalStake * REQUIRED_QUORUM_PCT);
  const currentQuorumPct = Math.round((votedStake * 100) / totalStake);

  const latestProposalData: LatestProposal = {
    title,
    description,
    voting,
    finalized,
    forVotesPercentage,
    againstVotesPercentage,
    abstainVotesPercentage,
    undecidedVotesPercentage,
    forStake: Math.round(forStakeSum),
    againstStake: Math.round(againstStakeSum),
    abstainStake: Math.round(abstainStakeSum),
    undecidedStake: Math.round(undecidedStakeSum),
    votesCount,
    requiredQuorum,
    currentQuorumPct,
  };

  return latestProposalData;
};
