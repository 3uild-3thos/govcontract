"use client";

import { useMemo } from "react";
import type { ProposalRecord } from "@/dummy-data/proposals";
import { CircleCheck, CircleX } from "lucide-react";
import VoteItem from "./VoteItem";
import QuorumDonut from "./QuorumDonut";
import {
  formatLamportsDisplay,
  formatPercentage,
} from "@/lib/governance/formatters";

const HAVE_VOTED = true;

interface VoteBreakdownProps {
  proposal: ProposalRecord;
  onVoteFor?: () => void;
}

export default function VoteBreakdown({
  proposal,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVoteFor,
}: VoteBreakdownProps) {
  const votes = useMemo(() => {
    const total =
      proposal.forVotesLamports +
      proposal.againstVotesLamports +
      proposal.abstainVotesLamports;
    return {
      for: proposal.forVotesLamports,
      against: proposal.againstVotesLamports,
      abstain: proposal.abstainVotesLamports,
      total,
      forPercentage: total > 0 ? (proposal.forVotesLamports / total) * 100 : 0,
      againstPercentage:
        total > 0 ? (proposal.againstVotesLamports / total) * 100 : 0,
      abstainPercentage:
        total > 0 ? (proposal.abstainVotesLamports / total) * 100 : 0,
    };
  }, [proposal]);

  return (
    <div className="glass-card flex h-full flex-col p-6 md:p-6 lg:p-8">
      <div className="flex flex-1 flex-col items-center gap-4 sm:gap-4 md:flex-col lg:flex-row md:items-stretch">
        {/* Quorum Donut Chart */}
        <div className="flex flex-1 items-center justify-center">
          <QuorumDonut
            forLamports={votes.for}
            againstLamports={votes.against}
            abstainLamports={votes.abstain}
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
              amount={formatLamportsDisplay(votes.for).value}
              percentage={formatPercentage(votes.forPercentage)}
              color="bg-primary"
            />
            <VoteItem
              label="Against"
              amount={formatLamportsDisplay(votes.against).value}
              percentage={formatPercentage(votes.againstPercentage)}
              color="bg-destructive"
            />
            <VoteItem
              label="Abstain"
              amount={formatLamportsDisplay(votes.abstain).value}
              percentage={formatPercentage(votes.abstainPercentage)}
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
}
