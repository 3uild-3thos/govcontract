import { PhaseTimeline } from "./ui";

export const CurrentPhase = () => {
  return (
    <div className="grid md:grid-cols-12 gap-14">
      {/* Left Column - Current Phase */}
      <div className="md:border-b-0 border-b col-span-5">
        <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-1">
          CURRENT PHASE
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <div className="text-xl font-bold text-dao-text-primary">
            Snapshot
          </div>
          <div className="text-dao-text-secondary text-xl font-bold">
            23 Days
          </div>
        </div>

        <p className="text-sm text-dao-text-muted leading-relaxed md:max-w-80">
          During this period we take a snapshot of all active validators on
          Solana to make them eligible for the next vote.
        </p>
      </div>

      {/* Right Column - Timeline chart */}
      <div className="flex flex-col md:mt-2 col-span-7 justify-center">
        <PhaseTimeline />
      </div>
    </div>
  );
};
