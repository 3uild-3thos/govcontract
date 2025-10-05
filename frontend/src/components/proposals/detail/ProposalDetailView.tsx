"use client";

import type { ProposalRecord } from "@/types";
import ProposalBreadcrumb from "./ProposalBreadcrumb";
import ProposalDetailHeader from "./ProposalDetailHeader";
import VoteBreakdown from "./VoteBreakdown";
import CastVote from "./CastVote";
import PhaseTimeline from "./phase-timeline";
import TopVotersTable from "./TopVotersTable";
import { toast } from "sonner";

interface ProposalDetailViewProps {
  proposal: ProposalRecord;
}

export default function ProposalDetailView({
  proposal,
}: ProposalDetailViewProps) {
  const handleVote = (vote: "for" | "against" | "abstain") => {
    toast.success(`Voted ${vote} for proposal ${proposal.simd}`);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProposalBreadcrumb simd={proposal.simd} />
      <ProposalDetailHeader proposal={proposal} />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr]">
        <VoteBreakdown proposal={proposal} />
        <CastVote
          proposalSimd={proposal.simd}
          userStake="1000 SOL"
          onVote={handleVote}
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
