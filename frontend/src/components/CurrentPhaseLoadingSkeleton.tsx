import { PhaseTimelineLoadingSkeleton } from "./ui/PhaseTimelineLoadingSkeleton";

export const CurrentPhaseLoadingSkeleton = () => {
  return (
    <div className="grid md:grid-cols-12 gap-14">
      {/* Left Column - Current Phase */}
      <div className="md:border-b-0 border-b col-span-6">
        <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-1">
          CURRENT PHASE
        </div>

        <div className="flex items-baseline gap-3 mb-1 mt-2">
          <div className="h-6 w-40 bg-gray animate-pulse rounded-full" />
          {/* <div className="text-dao-text-secondary text-xl font-bold">
            23 Days
          </div> */}
        </div>

        <div className="md:max-w-80 mt-4">
          <div className="h-3 w-30 bg-gray animate-pulse rounded-full" />
          <div className="h-3 w-40 bg-gray animate-pulse rounded-full mt-2.5" />
          <div className="h-3 w-20 bg-gray animate-pulse rounded-full mt-2.5" />
        </div>
      </div>

      {/* Right Column - Timeline chart */}
      <div className="flex flex-col md:mt-2 col-span-6 justify-center">
        <PhaseTimelineLoadingSkeleton />
      </div>
    </div>
  );
};
