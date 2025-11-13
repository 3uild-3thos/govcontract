"use client";

import type { ProposalRecord } from "@/types";
import { CircleCheck, CircleX } from "lucide-react";
import VoteItem, { VoteItemSkeleton } from "./VoteItem";
import QuorumDonut, { QuorumDonutSkeleton } from "./QuorumDonut";
import {
  formatLamportsDisplay,
  formatPercentage,
} from "@/lib/governance/formatters";
import { useHasUserVoted, useProposalVoteBreakdown } from "@/hooks";

interface VoteBreakdownWrapperProps {
  proposal: ProposalRecord | undefined;
  isLoading: boolean;
}
interface VoteBreakdownProps {
  proposal: ProposalRecord | undefined;
  isLoading: boolean;
}

export default function VoteBreakdownWrapper({
  proposal,
  isLoading,
}: VoteBreakdownWrapperProps) {
  if (!proposal && !isLoading) return <div>No proposal data...</div>;

  return <VoteBreakdown proposal={proposal} isLoading={isLoading} />;
}

const VoteBreakdown = ({
  proposal,
  isLoading: isLoadingParent,
}: VoteBreakdownProps) => {
  const { data: votes, isLoading: isLoadingProposalVotes } =
    useProposalVoteBreakdown(proposal?.publicKey);

  const { data: hasUserVoted = false, isLoading: isLoadingHasUserVoted } =
    useHasUserVoted(proposal?.publicKey?.toBase58());

  const isLoading =
    isLoadingParent || isLoadingProposalVotes || isLoadingHasUserVoted;

  if (!votes && !isLoadingProposalVotes) return <div>No vote breakdown</div>;
  if (!proposal && !isLoadingParent) return <div>No proposal info</div>;

  return (
    <div className="glass-card flex h-full flex-col p-6 md:p-6 lg:p-8">
      <div className="flex flex-1 flex-col items-center gap-4 sm:gap-4 md:flex-col lg:flex-row md:items-stretch">
        {/* Quorum Donut Chart */}
        <div className="flex flex-1 items-center justify-center">
          {isLoading || !votes || !proposal ? (
            <QuorumDonutSkeleton />
          ) : (
            <QuorumDonut
              forLamports={votes.forStake}
              againstLamports={votes.againstStake}
              abstainLamports={votes.abstainStake}
              totalLamports={votes.totalStake}
              quorumPercentage={proposal.quorumPercent / 100}
            />
          )}
        </div>

        {/* Vote Breakdown Section */}
        <div className="flex flex-1 flex-col">
          <div className="mb-4 space-y-2">
            <h4 className="h4 text-center font-semibold lg:text-left">
              Vote Breakdown
            </h4>
            <p className="text-center text-sm text-white/60 lg:text-left">
              Current distribution of recorded votes for this proposal.
            </p>
          </div>
          <div className="flex-1 space-y-2 md:space-y-3 lg:space-y-4 mt-1 lg:mt-0">
            {isLoading || votes === undefined ? (
              <>
                <VoteItemSkeleton label="For" color="bg-primary" />
                <VoteItemSkeleton label="Against" color="bg-destructive" />
                <VoteItemSkeleton label="Abstain" color="bg-white/30" />
              </>
            ) : (
              <>
                <VoteItem
                  label="For"
                  amount={formatLamportsDisplay(votes.forStake).value}
                  percentage={formatPercentage(votes.forVotesPercentage)}
                  color="bg-primary"
                />
                <VoteItem
                  label="Against"
                  amount={formatLamportsDisplay(votes.againstStake).value}
                  percentage={formatPercentage(votes.againstVotesPercentage)}
                  color="bg-destructive"
                />
                <VoteItem
                  label="Abstain"
                  amount={formatLamportsDisplay(votes.abstainStake).value}
                  percentage={formatPercentage(votes.abstainVotesPercentage)}
                  color="bg-white/30"
                />
              </>
            )}
          </div>
          {isLoading ? (
            <div className="h-4 w-20 bg-white/10 animate-pulse rounded" />
          ) : (
            <span className="mt-auto flex items-center gap-2 pt-4 -ml-0.5">
              {hasUserVoted ? (
                <CircleCheck className="size-4 text-emerald-400" />
              ) : (
                <CircleX className="size-4 text-destructive/50" />
              )}
              <p className="text-xs lg:text-sm text-center text-white/60">
                You have {hasUserVoted ? "" : "not "}voted for this proposal.
              </p>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
