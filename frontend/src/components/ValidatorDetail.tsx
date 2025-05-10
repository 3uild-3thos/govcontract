import { VoteIcon } from "lucide-react";
import { Cell, Pill } from "./ui";
import { cn } from "@/lib/utils";
import { VotesBubbleChart } from "./VotesBubbleChart";

const voterSplit = [
  {
    name: "Yes",
    split: 50,
    color: "bg-green-icon-active",
  },
  {
    name: "No",
    split: 35,
    color: "bg-red",
  },
  {
    name: "Abstain",
    split: 15,
    color: "bg-orange",
  },
  {
    name: "Undecided",
    split: 0,
    color: "bg-gray",
  },
];

export const ValidatorDetail = () => {
  return (
    <div className="grid md:grid-cols-2 gap-14">
      {/* Left Column - Detail */}
      <div className="md:border-b-0 border-b col-span-1">
        <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-1">
          VALIDATOR DETAIL
        </div>

        <h1 className="text-2xl font-bold text-dao-text-primary mb-3 leading-tight">
          Coinbase 02
        </h1>

        <p className="text-sm text-dao-text-muted mb-2 md:mb-5 leading-relaxed">
          Coinbase maintains world-class, enterprise-grade staking
          infrastructure across multiple networks with zero slashing events and
          a 99% uptime guarantee.
        </p>

        <div className="flex flex-wrap gap-2 mb-6 max-md:hidden">
          <Pill>
            <VoteIcon className="h-3.5 w-3.5" />
            254 Votes
          </Pill>
        </div>

        <div className="space-y-3 mb-7">
          <Cell className="max-md:hidden">
            <Cell.Title>8%</Cell.Title>
            <Cell.Description>Comission</Cell.Description>
          </Cell>
          <hr className="h-[1px] border-dao-border" />
          <Cell>
            <Cell.Title>396356 - Latitude.sh</Cell.Title>
            <Cell.Description>ASN</Cell.Description>
          </Cell>
          <hr className="h-[1px] border-dao-border" />
          <Cell>
            <Cell.Title>3,053,636 SOL</Cell.Title>
            <Cell.Description>Total Staked</Cell.Description>
          </Cell>
          <hr className="h-[1px] border-dao-border" />
        </div>

        <div className="text-md font-medium tracking-wider text-dao-text-secondary uppercase mb-5">
          VOTER SPLIT
        </div>
        <div className="flex justify-between">
          {voterSplit.map((split) => (
            <div
              key={split.name}
              className="flex flex-col p-3 gradient-bg !border-none !rounded-lg max-w-[117px] w-full"
            >
              <div className="font-medium">{split.split}%</div>
              <div className="flex items-center text-sm gap-x-1">
                <div className={cn("w-2 h-2 rounded-full", split.color)}></div>
                <span className="text-dao-text-secondary">{split.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Bubble chart */}
      <div className="flex md:mt-2 col-span-1 justify-center items-center">
        <VotesBubbleChart />
      </div>
    </div>
  );
};
