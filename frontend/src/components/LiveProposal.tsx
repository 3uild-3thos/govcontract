import { Clock, VoteIcon } from "lucide-react";
import { Cell, Pill, RealmsLink } from "./ui";
import { getDaysLeft } from "@/helpers";

interface Props {
  title: string;
  description: string;
  votesCount: number;
  endDate: Date | undefined;
  currentEpoch: number | undefined;
  requiredQuorum: number;
  currentQuorumPct: number;
}

export const LiveProposal = ({
  title,
  description,
  votesCount,
  endDate,
  currentEpoch,
  requiredQuorum,
  currentQuorumPct,
}: Props) => {
  const timeRemaining = endDate?.toLocaleDateString() || "-";
  const daysLeft = endDate ? getDaysLeft(endDate) : "-";

  return (
    <div>
      <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-3">
        LIVE PROPOSAL
      </div>

      <h1 className="text-2xl font-bold text-dao-text-primary mb-3 leading-tight">
        {title}
      </h1>

      <p className="text-sm text-dao-text-muted mb-2 md:mb-5 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6 max-md:hidden">
        <Pill>{currentQuorumPct}% Quorum</Pill>
        <Pill>
          <Clock className="h-3.5 w-3.5" />
          <span>{daysLeft || "-"} Days left</span>
        </Pill>
        <Pill>
          <VoteIcon className="h-3.5 w-3.5" />
          {votesCount} Votes
        </Pill>
        {/* <Pill color="green">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>Likely to pass</span>
        </Pill> */}
      </div>

      <RealmsLink className="md:hidden mb-6" />

      <div className="space-y-3">
        <Cell className="max-md:hidden">
          <Cell.Title>Voting Phase</Cell.Title>
          <Cell.Description>Current State</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>{timeRemaining}</Cell.Title>
          <Cell.Description>Time Remaining</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>{currentEpoch || "-"}</Cell.Title>
          <Cell.Description>Current Epoch</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>{requiredQuorum.toLocaleString()} SOL</Cell.Title>
          <Cell.Description>Quorum Required</Cell.Description>
        </Cell>
      </div>
    </div>
  );
};
