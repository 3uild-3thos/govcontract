import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useVoteAccountsWithValidators } from "./useVoteAccountsWithValidators";
import { TopVoterRecord } from "@/dummy-data/top-voters";
import { VoteAccountData, Validator } from "@/types";

const accentColors = [
  "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
  "linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)",
  "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
  "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
  "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
  "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
];

const getColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % accentColors.length;
  return accentColors[index];
};

/**
 * Maps vote account data to TopVoterRecord format
 */
function mapVoteToTopVoterRecord(
  voteAccount: VoteAccountData,
  validator: Validator | undefined,
  totalStakedLamports: number
): TopVoterRecord {
  const validatorName = validator?.name || `Unknown Validator`;
  const validatorIdentity =
    validator?.vote_identity || voteAccount.identity?.toBase58() || "";

  const totalStake = voteAccount.activeStake || 0;

  // Calculate vote percentage: this voter's stake / total stake of all voters * 100
  const votePercentage =
    totalStakedLamports > 0 && totalStake > 0
      ? (totalStake / totalStakedLamports) * 100
      : 0;

  // Format vote timestamp
  const voteTimestamp = voteAccount.voteTimestamp
    ? new Date(voteAccount.voteTimestamp.toNumber() * 1000).toISOString()
    : new Date().toISOString();

  return {
    id: validatorIdentity || voteAccount.voteAccount.toBase58(),
    validatorName,
    validatorIdentity,
    stakedLamports: totalStake,
    votePercentage,
    voteTimestamp,
    voteData: {
      forVotesBp: voteAccount.forVotesBp || new BN(0),
      againstVotesBp: voteAccount.againstVotesBp || new BN(0),
      abstainVotesBp: voteAccount.abstainVotesBp || new BN(0),
    },
    accentColor: getColorFromString(validatorName),
  };
}

export const useProposalVotes = (proposalPublicKey: PublicKey | undefined) => {
  const { data: voteAccountsWithValidators, isLoading } =
    useVoteAccountsWithValidators();

  const query = useQuery({
    queryKey: ["proposal-votes", proposalPublicKey?.toBase58()],
    staleTime: 1000 * 120, // 2 minutes
    enabled: !!proposalPublicKey && !!voteAccountsWithValidators && !isLoading,
    queryFn: async (): Promise<TopVoterRecord[]> => {
      if (!proposalPublicKey || !voteAccountsWithValidators) {
        throw new Error("Missing required data");
      }

      const { voteMap } = voteAccountsWithValidators;

      // Filter votes for the specific proposal
      const proposalVotes = Object.values(voteMap).filter((entry) =>
        entry.voteAccount.proposal.equals(proposalPublicKey)
      );

      // Calculate total staked lamports across all voters for percentage calculation
      const totalStakedLamports = proposalVotes.reduce(
        (sum, entry) => sum + (entry.voteAccount.activeStake || 0),
        0
      );

      // Map to TopVoterRecord format
      const topVoterRecords: TopVoterRecord[] = proposalVotes.map((entry) =>
        mapVoteToTopVoterRecord(
          entry.voteAccount,
          entry.validator,
          totalStakedLamports
        )
      );

      // Filter out voters that didn't vote (all vote splits are 0)
      const votersWhoVoted = topVoterRecords.filter((voter) => {
        const { forVotesBp, againstVotesBp, abstainVotesBp } = voter.voteData;
        return (
          forVotesBp.gt(new BN(0)) ||
          againstVotesBp.gt(new BN(0)) ||
          abstainVotesBp.gt(new BN(0))
        );
      });

      // Sort by staked lamports (descending)
      return votersWhoVoted.sort((a, b) => b.stakedLamports - a.stakedLamports);
    },
  });

  return { ...query, isLoading: isLoading || query.isLoading };
};
