import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useEndpoint } from "@/contexts/EndpointContext";
import { createProgramWitDummyWallet } from "@/chain";
import { REQUIRED_QUORUM_PCT } from "@/chain/quorum";
import { useProposalVotes } from "./useProposalVotes";
import { useGetValidators } from "./useGetValidators";

interface ProposalVoteBreakdown {
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
  totalStake: number;
}

export const useProposalVoteBreakdown = (
  proposalPubKey: PublicKey | undefined
) => {
  const { endpointUrl: endpoint } = useEndpoint();

  // useProposalVotes already fetches both votes and vote overrides
  const { data: proposalVotes, isLoading: isLoadingVotes } =
    useProposalVotes(proposalPubKey);
  // Get all validators to calculate total stake from all validators
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();

  const query = useQuery({
    staleTime: 1000 * 120, // 2 minutes
    enabled: !!proposalPubKey && !!endpoint && !!proposalVotes && !!validators,
    queryKey: ["proposal-vote-breakdown", proposalPubKey?.toBase58(), endpoint],
    queryFn: () =>
      getData(proposalPubKey!, endpoint, proposalVotes, validators),
  });

  return {
    ...query,
    isLoading: query.isLoading || isLoadingVotes || isLoadingValidators,
  };
};

const getData = async (
  proposalPubKey: PublicKey,
  endpoint: string,
  proposalVotes: Awaited<ReturnType<typeof useProposalVotes>>["data"],
  validators: Awaited<ReturnType<typeof useGetValidators>>["data"]
): Promise<ProposalVoteBreakdown> => {
  if (!proposalVotes) {
    throw new Error("Proposal votes not available");
  }
  if (!validators) {
    throw new Error("Validators not available");
  }

  const program = createProgramWitDummyWallet(endpoint);

  // Fetch proposal account for title, description, voting, finalized
  const proposalAccount = await program.account.proposal.fetch(proposalPubKey);

  // Calculate total stake from all validators (not just those who voted)
  const totalStake = validators.reduce(
    (sum, validator) => sum + (validator.activated_stake || 0),
    0
  );

  // Calculate vote breakdown from proposalVotes
  // proposalVotes contains TopVoterRecord[] with walletType "validator" or "staker"
  let totalForStake = 0;
  let totalAgainstStake = 0;
  let totalAbstainStake = 0;

  // Process all votes (both validators and stakers)
  // TopVoterRecord has stakedLamports and voteData with basis points
  proposalVotes.forEach((vote) => {
    const stake = vote.stakedLamports || 0;
    const bpToDecimal = 1 / 10000; // basis points to decimal (10000 bp = 1.0)

    const forBp = vote.voteData.forVotesBp?.toNumber() || 0;
    const againstBp = vote.voteData.againstVotesBp?.toNumber() || 0;
    const abstainBp = vote.voteData.abstainVotesBp?.toNumber() || 0;

    const forStake = stake * (forBp * bpToDecimal);
    const againstStake = stake * (againstBp * bpToDecimal);
    const abstainStake = stake * (abstainBp * bpToDecimal);

    totalForStake += forStake;
    totalAgainstStake += againstStake;
    totalAbstainStake += abstainStake;
  });

  // Calculate total voted stake
  const totalVotedStake = totalForStake + totalAgainstStake + totalAbstainStake;
  const undecidedStake = totalStake - totalVotedStake;

  // Calculate percentages
  const forVotesPercentage =
    totalStake > 0 ? (totalForStake / totalStake) * 100 : 0;
  const againstVotesPercentage =
    totalStake > 0 ? (totalAgainstStake / totalStake) * 100 : 0;
  const abstainVotesPercentage =
    totalStake > 0 ? (totalAbstainStake / totalStake) * 100 : 0;
  const undecidedVotesPercentage =
    totalStake > 0 ? (undecidedStake / totalStake) * 100 : 0;

  // Calculate quorum
  const requiredQuorum = REQUIRED_QUORUM_PCT * 100; // Convert to percentage
  const currentQuorumPct =
    totalStake > 0 ? (totalVotedStake / totalStake) * 100 : 0;

  // Get votes count
  const votesCount = proposalVotes.length;

  return {
    title: proposalAccount.title,
    description: proposalAccount.description,
    voting: proposalAccount.voting,
    finalized: proposalAccount.finalized,
    forVotesPercentage,
    againstVotesPercentage,
    abstainVotesPercentage,
    undecidedVotesPercentage,
    forStake: totalForStake,
    againstStake: totalAgainstStake,
    abstainStake: totalAbstainStake,
    undecidedStake,
    votesCount,
    requiredQuorum,
    currentQuorumPct,
    totalStake,
  };
};
