"use client";

import type { ProposalRow } from "@/components/proposals/proposals-table/ProposalsTable";
import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { GitHubIcon } from "@/components/icons/SvgIcons";
import { Spade } from "lucide-react";
import { toast } from "sonner";
const VOTE_STATE_LABEL: Record<ProposalRow["vote"]["state"], string> = {
  "in-progress": "In Progress",
  finished: "Finished",
};

function ProposalInfo({ proposal }: { proposal: ProposalRow }) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <Link
        href={`/proposals/${proposal.simd.toLowerCase()}`}
        className="space-y-3 block"
      >
        <h3 className="h3 whitespace-pre-wrap text-lg font-semibold tracking-tight text-white sm:text-xl hover-gradient-text transition-all duration-200">
          {proposal.simd}: {proposal.title}
        </h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--basic-color-gray)] line-clamp-3">
          {proposal.summary}
        </p>
      </Link>

      <AppButton
        asChild
        variant="outline"
        size="sm"
        className="w-fit border-white/20  text-[11px] font-medium uppercase tracking-[0.1em] text-white/70 hover:bg-white/20"
      >
        <Link
          href={proposal.description}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2"
        >
          <GitHubIcon />
          Link to proposal
        </Link>
      </AppButton>
    </div>
  );
}

function LifecycleStageBar({
  stage,
}: {
  stage: ProposalRow["lifecycleStage"];
}) {
  const stages: ProposalRow["lifecycleStage"][] = [
    "support",
    "voting",
    "finalized",
  ];
  const activeIndex = stages.indexOf(stage);

  return (
    <div className="flex items-center gap-2">
      {stages.map((s, index) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            index <= activeIndex ? "bg-green-600" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function VoteActions({ state }: { state: ProposalRow["lifecycleStage"] }) {
  return (
    <div className="flex flex-col gap-3">
      {state === "voting" && (
        <AppButton
          variant="outline"
          text="Modify Vote"
          className="w-full justify-center border-white/15 bg-white/10 text-sm font-medium text-white/75 hover:text-white"
          onClick={() => toast.success("Modify Vote Successfully")}
        />
      )}
      <AppButton
        variant="gradient"
        text={state === "voting" ? "Cast Vote" : "Support"}
        className="w-full justify-center text-sm font-semibold text-foreground"
        onClick={() =>
          toast.success(
            state === "voting"
              ? "Cast Vote Successfully"
              : "Support Proposal Successfully",
          )
        }
      />
    </div>
  );
}

function VotingPanel({ proposal }: { proposal: ProposalRow }) {
  return (
    <aside className="w-full glass-card p-6 lg:w-80 xl:w-80">
      <header className="mb-6">
        <span className="block text-[11px] uppercase tracking-[0.24em] text-white/45 mb-3">
          {proposal.lifecycleStage === "finalized" ? "Vote" : "Stage"}
        </span>
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-semibold text-white">
            {VOTE_STATE_LABEL[proposal.vote.state]}
          </span>
          <div className="w-20">
            <LifecycleStageBar stage={proposal.lifecycleStage} />
          </div>
        </div>
      </header>

      {(proposal.lifecycleStage === "support" ||
        proposal.lifecycleStage === "voting") && (
        <VoteActions state={proposal.lifecycleStage} />
      )}
    </aside>
  );
}

// Main component
type ExternalProposalPanelProps = {
  proposal: ProposalRow;
};

export default function ExternalProposalPanel({
  proposal,
}: ExternalProposalPanelProps) {
  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch xl:gap-8">
      <div className="w-32 shrink-0 self-stretch flex items-center justify-center">
        <Spade className="size-15 text-muted/70 animate-pulse" />
      </div>
      <ProposalInfo proposal={proposal} />
      <div className="lg:ml-auto">
        <VotingPanel proposal={proposal} />
      </div>
    </div>
  );
}
