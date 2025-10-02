"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ProposalLifecycleStage } from "@/dummy-data/proposals";
import { Circle, Loader } from "lucide-react";

const STAGE_ORDER: ProposalLifecycleStage[] = [
  "support",
  "voting",
  "finalized",
];

const STAGE_LABEL: Record<ProposalLifecycleStage, string> = {
  support: "Support",
  voting: "Voting",
  finalized: "Finished",
};

const STAGE_DESCRIPTION: Record<ProposalLifecycleStage, string> = {
  support:
    "During this period we take a snapshot of all active validators on Solana to make them eligible for the next vote.",
  voting:
    "Validators vote on active governance proposals. Delegators can override their validator's vote using stake account verification.",
  finalized:
    "Voting period has ended and all votes have been counted. The proposal is finalized and ready for on-chain execution.",
};

type LifecycleIndicatorProps = {
  stage: ProposalLifecycleStage;
};

export default function LifecycleIndicator({ stage }: LifecycleIndicatorProps) {
  const activeIndex = Math.max(STAGE_ORDER.indexOf(stage), 0);

  const indicators = (
    <div className="flex items-center justify-center gap-2">
      {STAGE_ORDER.map((value, index) => (
        <span
          key={value}
          className={`h-2 w-2 rounded-full transition ${
            index === activeIndex ? "bg-white" : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );

  // Only show tooltip on desktop (lg and above)
  return (
    <>
      {/* Desktop with tooltip */}
      <div className="hidden lg:block">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>{indicators}</TooltipTrigger>
            <TooltipContent
              side="top"
              className="w-[240px] rounded-xl border border-white/10 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-md"
              sideOffset={8}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {stage === "finalized" ? (
                    <Circle className="size-3 text-white" />
                  ) : (
                    <Loader className="size-4 animate-spin text-white" />
                  )}
                  <p className="mb-1 text-sm font-semibold text-white">
                    {STAGE_LABEL[stage]}
                  </p>
                </div>
                <p className="text-xs leading-[1.5] text-white whitespace-pre-wrap ">
                  {STAGE_DESCRIPTION[stage]}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Mobile/Tablet without tooltip */}
      <div className="block lg:hidden">{indicators}</div>
    </>
  );
}
