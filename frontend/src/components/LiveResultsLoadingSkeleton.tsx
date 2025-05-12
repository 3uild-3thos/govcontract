import { RealmsLink } from "./ui";

export const LiveResultsLoadingSkeleton = () => {
  const forVotes = 40;
  const againstVotes = 30;
  const abstainVotes = 20;
  const undecidedVotes = 10;

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
            className="bg-green-dark absolute left-0 h-full z-0 border-r-[1px] border-r-green-secondary animate-pulse"
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="flex font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-green">Yes</span>
              <span className="flex items-center gap-1 text-gray animate-pulse">
                <div className="h-4 w-8 bg-gray rounded-full" />%
              </span>
            </div>
            <div className="flex items-center gap-2 text-dao-text-label text-sm z-1">
              <div className="h-3 w-6 bg-gray animate-pulse rounded-full" />
            </div>
          </div>
        </div>

        {/* No Vote */}
        <div className="rounded-xl bg-black border-red-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div
            style={{ width: `${againstVotes}%` }}
            className="bg-red-dark absolute left-0 h-full z-0 border-r-[1px] border-r-red-secondary animate-pulse"
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="flex font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-red">No</span>
              <span className="flex items-center gap-1 text-gray animate-pulse">
                <div className="h-4 w-8 bg-gray rounded-full" />%
              </span>
            </div>
            <div className="flex items-center gap-2 text-dao-text-label text-sm z-1">
              <div className="h-3 w-6 bg-gray animate-pulse rounded-full" />
            </div>
          </div>
        </div>

        {/* Abstain Vote */}
        <div className="rounded-xl bg-black border-orange-secondary border-[1px] py-3 px-4 md:p-4 flex items-center relative overflow-hidden">
          {/* progress */}
          <div
            style={{ width: `${abstainVotes}%` }}
            className="bg-orange-dark absolute left-0 h-full z-0 border-r-[1px] border-r-orange-secondary animate-pulse"
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="flex font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-orange">Abstain</span>
              <span className="flex items-center gap-1 text-gray animate-pulse">
                <div className="h-4 w-8 bg-gray rounded-full" />%
              </span>
            </div>
            <div className="flex items-center gap-2 text-dao-text-label text-sm z-1">
              <div className="h-3 w-6 bg-gray animate-pulse rounded-full" />
            </div>
          </div>
        </div>

        {/* Undecided Vote */}
        <div className="rounded-xl bg-black border-gray-secondary border-[1px] py-3 px-4 md:p-4 flex justify-between items-center relative overflow-hidden">
          {/* progress */}
          <div
            style={{ width: `${undecidedVotes}%` }}
            className="bg-gray-dark absolute left-0 h-full z-0 border-r-[1px] border-r-gray-secondary animate-pulse"
          />
          <div className="flex flex-col md:flex-row justify-between md:items-center w-full gap-y-1.5">
            <div className="flex font-semibold text-xl text-dao-text-primary z-1 space-x-2">
              <span className="text-gray">Undecided</span>
              <span className="flex items-center gap-1 text-gray animate-pulse">
                <div className="h-4 w-8 bg-gray rounded-full" />%
              </span>
            </div>
            <div className="flex items-center gap-2 text-dao-text-label text-sm z-1">
              <div className="h-3 w-6 bg-gray animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <RealmsLink className="max-md:hidden" />
    </div>
  );
};
