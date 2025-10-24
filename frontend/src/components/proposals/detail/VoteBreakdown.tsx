"use client";

import type { ProposalRecord } from "@/types";
import { CircleCheck, CircleX } from "lucide-react";
import VoteItem from "./VoteItem";
import QuorumDonut from "./QuorumDonut";
import {
  formatLamportsDisplay,
  formatPercentage,
} from "@/lib/governance/formatters";
import { useProposalVoteBreakdown } from "@/hooks";

interface VoteBreakdownWrapperProps {
  proposal: ProposalRecord | undefined;
  isLoading: boolean;
}
interface VoteBreakdownProps {
  proposal: ProposalRecord;
}

export default function VoteBreakdownWrapper({
  proposal,
  isLoading,
}: VoteBreakdownWrapperProps) {
  // TODO: PEDRO check proper loading skeletongs
  if (isLoading) return <div>Loading</div>;
  if (!proposal) return <div>No proposal data...</div>;

  return <VoteBreakdown proposal={proposal} />;
}

const VoteBreakdown = ({ proposal }: VoteBreakdownProps) => {
  const { data: votes, isLoading } = useProposalVoteBreakdown(
    proposal.publicKey
  );

  // TODO: PEDRO check if user has votes here
  const HAVE_VOTED = true;

  if (isLoading) {
    // TODO: PEDRO fix this loading state, create skeletons
    return <div>Loading</div>;
  }

  // TODO: PEDRO show data with "0" values here? empty donut?
  if (!votes) return <div>No vote breakdown</div>;

  return (
    <div className="glass-card flex h-full flex-col p-6 md:p-6 lg:p-8">
      <div className="flex flex-1 flex-col items-center gap-4 sm:gap-4 md:flex-col lg:flex-row md:items-stretch">
        {/* Quorum Donut Chart */}
        <div className="flex flex-1 items-center justify-center">
          <QuorumDonut
            forLamports={votes.forStake}
            againstLamports={votes.againstStake}
            abstainLamports={votes.abstainStake}
            quorumPercentage={proposal.quorumPercent / 100}
          />
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
          </div>
          <span className="mt-auto flex items-center gap-2 pt-4 -ml-0.5">
            {HAVE_VOTED ? (
              <CircleCheck className="size-4 text-emerald-400" />
            ) : (
              <CircleX className="size-4 text-destructive/50" />
            )}
            <p className="text-xs lg:text-sm text-center text-white/60">
              You have {HAVE_VOTED ? "" : "not "}voted for this proposal.
            </p>
          </span>
        </div>
      </div>
    </div>
  );
};
