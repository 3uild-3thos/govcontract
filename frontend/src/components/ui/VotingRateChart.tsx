"use client";

import { useLabelCollisions } from "@/hooks";
import { ToPassIcon } from "./ToPassIcon";

interface VotingRateProps {
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  requiredAmount: number;
  currentPosition: number; // Position of the indicator as percentage (0-100)
}

export const VotingRateChart = ({
  yesPercentage,
  noPercentage,
  abstainPercentage,
  requiredAmount,
  currentPosition,
}: VotingRateProps) => {
  const { fixedRef, movingRefs, isColliding } = useLabelCollisions(3);
  return (
    <>
      <div className="relative w-full h-8">
        {/* Main progress bar container */}
        <div className="absolute w-full h-full overflow-hidden flex">
          {/* To Pass section - Black - it just fills 100%, but behind the 3 other sections of yes/no/abstain */}
          <div className="absolute w-full h-full rounded-sm bg-gradient-to-b from-[#323232] to-[#0C0C0C] border-[1px] flex justify-end items-center text-right text-dao-text-secondary text-xs border-[#252525] z-0">
            <span className="mr-2">{requiredAmount} SOL REQUIRED</span>
          </div>

          {/* Yes section - Green gradient */}
          <div
            className="h-full bg-gradient-to-r from-green-dark to-green border-[1px] border-green rounded-l-sm z-1"
            style={{ width: `${yesPercentage}%` }}
          />

          {/* No section - Red */}
          <div
            className="h-full bg-gradient-to-r from-red-dark to-red border-[1px] border-red z-1"
            style={{ width: `${noPercentage}%` }}
          />

          {/* Abstain section - Gold/Yellow */}
          <div
            className="h-full bg-gradient-to-r from-orange-dark to-yellow border-[1px] border-yellow rounded-r-sm z-1"
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
      <div className="relative w-full mt-2.5">
        {/* Yes label - positioned at start of Yes section */}
        <div ref={movingRefs[0]} className="absolute left-0">
          <div className="flex flex-col">
            <span className="">{yesPercentage}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
            <span className="text-xs text-dao-text-secondary">Yes</span>
          </div>
        </div>
        {/* No label - positioned at start of No section */}
        <div
          ref={movingRefs[1]}
          className="absolute"
          style={{ left: `${yesPercentage}%` }}
        >
          <div className="flex flex-col">
            <span className="">{noPercentage}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2" />
            <span className="text-xs text-dao-text-secondary">No</span>
          </div>
        </div>

        {/* Abstain label - positioned at start of Abstain section */}
        <div
          ref={movingRefs[2]}
          className="absolute "
          style={{ left: `${yesPercentage + noPercentage}%` }}
        >
          <div className="flex flex-col">
            <span className="">{abstainPercentage}%</span>
          </div>

          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
            <span className="text-xs text-dao-text-secondary">Abstain</span>
          </div>
        </div>

        {/* To Pass label - positioned at start of To Pass section */}
        <div
          ref={fixedRef}
          className="absolute flex flex-col items-center"
          style={{
            left: `${currentPosition}%`,
            top: isColliding ? "-102px" : "0px",
            transform: `translateX(${-currentPosition}%)`,
          }}
        >
          <span className="text-sm">{currentPosition}%</span>
          <span className="text-xs text-dao-text-secondary">To Pass</span>
        </div>
      </div>
    </>
  );
};
