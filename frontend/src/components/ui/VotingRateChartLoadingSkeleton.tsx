import { ToPassIcon } from "./ToPassIcon";

const yesPercentage = 25;
const noPercentage = 15;
const abstainPercentage = 5;
const currentPosition = 60;

export const VotingRateChartLoadingSkeleton = () => {
  return (
    <div className="opacity-60">
      <div className="relative w-full h-8">
        {/* Main progress bar container */}
        <div className="absolute w-full h-full overflow-hidden flex">
          <div className="absolute w-full h-full rounded-sm bg-gradient-to-b from-[#323232] to-[#0C0C0C] border-[1px] flex justify-end items-center text-right text-dao-text-secondary text-xs border-[#252525] z-0 animate-pulse" />

          {/* Yes section - Green gradient */}
          <div
            className="h-full bg-gradient-to-r from-green-dark to-green border-[1px] border-green rounded-l-sm z-1 animate-pulse"
            style={{ width: `${yesPercentage}%` }}
          />

          {/* No section - Red */}
          <div
            className="h-full bg-gradient-to-r from-red-dark to-red border-[1px] border-red z-1 animate-pulse"
            style={{ width: `${noPercentage}%` }}
          />

          {/* Abstain section - Gold/Yellow */}
          <div
            className="h-full bg-gradient-to-r from-orange-dark to-yellow border-[1px] border-yellow rounded-r-sm z-1 animate-pulse"
            style={{ width: `${abstainPercentage}%` }}
          />
        </div>

        {/* Indicator triangle */}
        <div
          className="absolute -top-5 z-2"
          style={{
            left: `${currentPosition - 0.5}%`,
            transform: `translateX(${-currentPosition}%)`,
          }}
        >
          <ToPassIcon />
        </div>

        {/* Required amount text */}
        {/* <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dao-text-secondary text-xs z-2">
          {requiredAmount} REQUIRED
        </div> */}
      </div>

      {/* Labels */}
      <div className="relative w-full mt-2.5 animate-pulse">
        {/* Yes label - positioned at start of Yes section */}
        <div className="absolute left-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <div className="h-4 w-6 bg-gray rounded-full" />%
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
            <span className="text-xs text-dao-text-secondary">Yes</span>
          </div>
        </div>
        {/* No label - positioned at start of No section */}
        <div className="absolute" style={{ left: `${yesPercentage}%` }}>
          <div className="flex items-center gap-1">
            <div className="h-4 w-6 bg-gray rounded-full" />%
          </div>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2" />
            <span className="text-xs text-dao-text-secondary">No</span>
          </div>
        </div>

        {/* Abstain label - positioned at start of Abstain section */}
        <div
          className="absolute "
          style={{ left: `${yesPercentage + noPercentage}%` }}
        >
          <div className="flex items-center gap-1">
            <div className="h-4 w-6 bg-gray rounded-full" />%
          </div>

          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
            <span className="text-xs text-dao-text-secondary">Abstain</span>
          </div>
        </div>

        {/* To Pass label - positioned at start of To Pass section */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${currentPosition}%`,
            transform: `translateX(${-currentPosition}%)`,
          }}
        >
          <span className="text-sm">{currentPosition}%</span>
          <span className="text-xs text-dao-text-secondary">To Pass</span>
        </div>
      </div>
    </div>
  );
};
