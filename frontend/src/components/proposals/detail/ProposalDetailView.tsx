"use client";

import type { ProposalRecord } from "@/types";
import ProposalBreadcrumb from "./ProposalBreadcrumb";
import ProposalDetailHeader from "./ProposalDetailHeader";
import VoteBreakdown from "./VoteBreakdown";
import CastVote from "./CastVote";
import PhaseTimeline from "./phase-timeline";
import TopVotersTable from "./TopVotersTable";

interface ProposalDetailViewProps {
  proposal: ProposalRecord;
  isLoading: boolean;
}

export default function ProposalDetailView({
  proposal,
  isLoading,
}: ProposalDetailViewProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <ProposalBreadcrumb simd={proposal.simd} isLoading={isLoading} />
      <ProposalDetailHeader proposal={proposal} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr]">
        <VoteBreakdown proposal={proposal} />
        <CastVote
          proposalSimd={proposal.simd}
          // TODO: needed?
          // userStake="1000 SOL"
        />
      </div>
      <PhaseTimeline
        proposal={proposal}
        currentPhase={proposal.lifecycleStage}
      />
      <TopVotersTable />
    </div>
  );
}
