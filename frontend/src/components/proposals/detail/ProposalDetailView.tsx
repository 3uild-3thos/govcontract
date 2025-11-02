"use client";

import type { ProposalRecord } from "@/types";
import ProposalBreadcrumb from "./ProposalBreadcrumb";
import ProposalDetailHeader from "./ProposalDetailHeader";
import VoteBreakdown from "./VoteBreakdown";
import PhaseTimeline from "./phase-timeline";
import TopVotersTable from "./TopVotersTable";
import SupportProposal from "./SupportProposal";
import CastVoteWrapper, { CastVoteSkeleton } from "./CastVote";

interface ProposalDetailViewProps {
  proposal: ProposalRecord | undefined;
  isLoading: boolean;
}

export default function ProposalDetailView({
  proposal,
  isLoading,
}: ProposalDetailViewProps) {
  const isVoting = proposal?.status === "voting";
  const isSupporting = proposal?.status === "support";

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProposalBreadcrumb />
      <ProposalDetailHeader proposal={proposal} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr]">
        <VoteBreakdown proposal={proposal} isLoading={isLoading} />
        {isLoading && <CastVoteSkeleton />}
        {!isLoading && isVoting && (
          <CastVoteWrapper proposal={proposal} isLoading={isLoading} />
        )}
        {!isLoading && isSupporting && (
          <SupportProposal
            proposalPublicKey={proposal?.publicKey}
            isLoading={isLoading}
          />
        )}
      </div>
      <PhaseTimeline proposal={proposal} isLoading={isLoading} />
      <TopVotersTable proposal={proposal} />
    </div>
  );
}
