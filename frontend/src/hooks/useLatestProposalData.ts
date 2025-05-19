import { useQuery } from "@tanstack/react-query";

import { getAllProposals } from "@/data";
import { useGetValidators } from "./useGetValidators";
import { Validators } from "@/types";

import {
  useVoteAccountsWithValidators,
  VoteAccountsWithValidators,
} from "./useVoteAccountsWithValidators";
import { connection } from "@/chain/helpers";
import { REQUIRED_QUORUM_PCT } from "@/chain";

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
  endDate: Date | undefined;
  currentEpoch: number | undefined;
  requiredQuorum: number;
  currentQuorumPct: number;
}

export const useLatestProposalData = () => {
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();
  // const { data: votes, isLoading: isLoadingVotes } = useVotes();

  const { data: votesHashMap, isLoading: isLoadingVotesHashMap } =
    useVoteAccountsWithValidators();

  const enabled =
    !isLoadingValidators &&
    validators !== undefined &&
    // !isLoadingVotes &&
    // votes !== undefined &&
    !isLoadingVotesHashMap &&
    votesHashMap !== undefined;

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["latestProposalData"],
    enabled,
    queryFn: () => getData(validators, votesHashMap),
  });
};

const getData = async (
  validators: Validators | undefined,
  // votes: Votes | undefined,
  votesHashMap: VoteAccountsWithValidators | undefined
) => {
  const proposals = await getAllProposals();

  if (validators === undefined)
    throw new Error("Unable to get validators info");
  // if (votes === undefined) throw new Error("Unable to get votes info");
  if (votesHashMap === undefined)
    throw new Error("Unable to get votesHashMap info");

  if (proposals.length === 0) throw new Error("No proposals found");
  // if (votes.length === 0) throw new Error("No votes found");

  const totalStake = validators.reduce((acc, curr) => {
    return (acc += curr.activated_stake);
  }, 0);

  console.log("proposals:", proposals);

  // filter out finished
  // sort bt creationEpoch
  // grab the first one
  const latest = proposals
    .filter((p) => !p.account.finalized)
    .sort(
      (a, b) =>
        Number(b.account.creationEpoch) - Number(a.account.creationEpoch)
    )[0];

  const votes = Object.values(votesHashMap.voteMap);

  let forStakeSum = 0;
  let againstStakeSum = 0;
  let abstainStakeSum = 0;

  let votesCount = 0;
  // for each vote, get validator's activated_stake
  for (const { voteAccount, validator } of votes) {
    if (
      !latest.publicKey.equals(voteAccount.account.proposalId) ||
      !validator
    ) {
      continue;
    }

    const stake = validator.activated_stake;

    const forBp = voteAccount.account.forVotesBp.toNumber(); // 0 - 10000
    const againstBp = voteAccount.account.againstVotesBp.toNumber();
    const abstainBp = voteAccount.account.abstainVotesBp.toNumber();

    forStakeSum += (stake * forBp) / 10_000;
    againstStakeSum += (stake * againstBp) / 10_000;
    abstainStakeSum += (stake * abstainBp) / 10_000;
    votesCount += 1;
  }

  // undecided stake = total validator's stake - voted stake
  const { title, description, voting, finalized, endEpoch } = latest.account;

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

  let endDate: Date | undefined = undefined;
  try {
    const epochSchedule = await connection.getEpochSchedule();
    const endEpochFirstSlot = epochSchedule.getSlotsInEpoch(
      endEpoch.toNumber()
    );
    const endDateBlockTime = await connection.getBlockTime(endEpochFirstSlot);
    endDate = endDateBlockTime ? new Date(endDateBlockTime * 1000) : undefined;
  } catch (error) {
    console.error("error getting end epoch to date:", error);
  }
  let currentEpoch: number | undefined = undefined;
  try {
    currentEpoch = (await connection.getEpochInfo()).epoch;
  } catch (error) {
    console.error("error getting currentEpoch:", error);
  }

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
    endDate,
    currentEpoch,
    requiredQuorum,
    currentQuorumPct,
  };
  console.log("latestProposalData:", latestProposalData);

  return latestProposalData;
};

// type ProposalAccountData = Awaited<
//   ReturnType<Program<Govcontract>["account"]["proposal"]["fetch"]>
// >;

// async function isVotingActive(
//   connection: Connection,
//   proposal: ProposalAccountData
// ): Promise<boolean> {
//   const { epoch } = await connection.getEpochInfo();

//   return (
//     proposal.voting &&
//     epoch >= Number(proposal.startEpoch) &&
//     epoch < Number(proposal.endEpoch) &&
//     !proposal.finalized
//   );
// }

// async function canTallyProposal(
//   connection: Connection,
//   proposal: ProposalAccountData
// ): Promise<boolean> {
//   const { epoch } = await connection.getEpochInfo();

//   return !proposal.finalized && epoch >= Number(proposal.endEpoch);
// }
