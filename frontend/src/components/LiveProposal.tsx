import { Clock, ThumbsUp, VoteIcon } from "lucide-react";
import { Cell, Pill, RealmsLink } from "./ui";

export const LiveProposal = () => {
  return (
    <div>
      <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-3">
        LIVE PROPOSAL
      </div>

      <h1 className="text-2xl font-bold text-dao-text-primary mb-3 leading-tight">
        Secure the Network with v1.04.14 by Realms DAO
      </h1>

      <p className="text-sm text-dao-text-muted mb-2 md:mb-5 leading-relaxed">
        By processing transactions and participating in consensus, each
        validator helps make Solana the most censorship resistant and
        highest-performance blockchain network in the world.
      </p>

      <div className="flex flex-wrap gap-2 mb-6 max-md:hidden">
        <Pill>20% Quorum</Pill>
        <Pill>
          <Clock className="h-3.5 w-3.5" />
          <span>3 Days left</span>
        </Pill>
        <Pill>
          <VoteIcon className="h-3.5 w-3.5" />
          254 Votes
        </Pill>
        <Pill color="green">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span>Likely to pass</span>
        </Pill>
      </div>

      <RealmsLink className="md:hidden mb-6" />

      <div className="space-y-3">
        <Cell className="max-md:hidden">
          <Cell.Title>Voting Phase</Cell.Title>
          <Cell.Description>Current State</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>36hrs</Cell.Title>
          <Cell.Description>Time Remaining</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>752</Cell.Title>
          <Cell.Description>Current Epoch</Cell.Description>
        </Cell>
        <hr className="h-[1px] border-dao-border" />
        <Cell>
          <Cell.Title>3,053,636 SOL</Cell.Title>
          <Cell.Description>Quorum Required</Cell.Description>
        </Cell>
      </div>
    </div>
  );
};
