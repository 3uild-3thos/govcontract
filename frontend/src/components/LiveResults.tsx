import { RealmsLink } from "./ui";

interface Props {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  undecidedVotes: number;
  forStake: number;
  againstStake: number;
  abstainStake: number;
  undecidedStake: number;
}

export const LiveResults = ({
  forVotes,
  againstVotes,
  abstainVotes,
  undecidedVotes,
  forStake,
  againstStake,
  abstainStake,
  undecidedStake,
}: Props) => {
  return (
    <div>
      <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-3">
        LIVE RESULTS
      </div>

      <div className="flex flex-col gap-y-4 md:mb-4">
        {/* Yes Vote */}
        <div className="rounded-xl bg-black border-green-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div
            style={{ width: `${forVotes}%` }}
            className={`bg-green-dark absolute left-0 h-full z-0 border-r-[1px] border-r-green-secondary`}
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-green">Yes</span>
              <span>{forVotes}%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">
              {forStake.toLocaleString()} SOL
            </div>
          </div>
        </div>

        {/* No Vote */}
        <div className="rounded-xl bg-black border-red-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div
            style={{ width: `${againstVotes}%` }}
            className={`bg-red-dark absolute left-0 h-full z-0 border-r-[1px] border-r-red-secondary`}
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-red">No</span>
              <span>{againstVotes}%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">
              {againstStake.toLocaleString()} SOL
            </div>
          </div>
        </div>

        {/* Abstain Vote */}
        <div className="rounded-xl bg-black border-orange-secondary border-[1px] py-3 px-4 md:p-4 flex items-center relative overflow-hidden">
          {/* progress */}
          <div
            style={{ width: `${abstainVotes}%` }}
            className={`bg-orange-dark absolute left-0 h-full z-0 border-r-[1px] border-r-orange-secondary`}
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-orange">Abstain</span>
              <span>{abstainVotes}%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">
              {abstainStake.toLocaleString()} SOL
            </div>
          </div>
        </div>

        {/* Undecided Vote */}
        <div className="rounded-xl bg-black border-gray-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div
            style={{ width: `${undecidedVotes}%` }}
            className={`bg-gray-dark absolute left-0 h-full z-0 border-r-[1px] border-r-gray-secondary`}
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-gray">Undecided</span>
              <span>{undecidedVotes}%</span>
            </div>
            <div className="text-dao-text-label text-sm z-1">
              {undecidedStake.toLocaleString()} SOL
            </div>
          </div>
        </div>
      </div>

      <RealmsLink className="max-md:hidden" />
    </div>
  );
};
