import { Clock, VoteIcon } from "lucide-react";
import { Cell, Pill, RealmsLink } from "./ui";

export const LiveProposalLoadingSkeleton = () => {
  return (
    <div>
      <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-3">
        LIVE PROPOSAL
      </div>

      <h1 className="text-2xl font-bold text-dao-text-primary mb-3 leading-tight">
        <div className="h-6 w-30 bg-gray animate-pulse rounded-full" />
      </h1>

      <div className="text-sm text-dao-text-muted mb-2 md:mb-5 leading-relaxed">
        <div className="h-3 w-40 bg-gray animate-pulse rounded-full mb-1" />
        <div className="h-3 w-60 bg-gray animate-pulse rounded-full" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6 max-md:hidden">
        <Pill>
          <div className="h-3 w-20 bg-gray animate-pulse rounded-full" />
        </Pill>
        <Pill>
          <Clock className="h-3.5 w-3.5" />
          <div className="h-3 w-16 bg-gray animate-pulse rounded-full" />
        </Pill>
        <Pill>
          <VoteIcon className="h-3.5 w-3.5" />
          <div className="h-3 w-10 bg-gray animate-pulse rounded-full" />
        </Pill>
      </div>

      <RealmsLink className="md:hidden mb-6" />

      <div className="space-y-3">
        <Cell className="max-md:hidden">
          <Cell.Title>
            <div className="h-3 w-23 bg-gray animate-pulse rounded-full" />
          </Cell.Title>
          <Cell.Description>Current State</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>
            <div className="h-3 w-10 bg-gray animate-pulse rounded-full" />
          </Cell.Title>
          <Cell.Description>Time Remaining</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>
            <div className="h-3 w-8 bg-gray animate-pulse rounded-full" />
          </Cell.Title>
          <Cell.Description>Current Epoch</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>
            <div className="h-3 w-28 bg-gray animate-pulse rounded-full" />
          </Cell.Title>
          <Cell.Description>Quorum Required</Cell.Description>
        </Cell>
      </div>
    </div>
  );
};
