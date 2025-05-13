import { useLatestProposalData } from "@/hooks";
import { PhaseTimeline } from "./ui";
import { CurrentPhaseLoadingSkeleton } from "./CurrentPhaseLoadingSkeleton";

export const CurrentPhase = () => {
  const { data, isLoading } = useLatestProposalData();

  if (isLoading || !data) {
    return <CurrentPhaseLoadingSkeleton />;
  }

  const { voting, finalized } = data;

  let currentPhase: "Support" | "Voting" | "Finished" | undefined = undefined;
  if (!voting && !finalized) currentPhase = "Support";
  else if (voting && !finalized) currentPhase = "Voting";
  else if (!voting && finalized) currentPhase = "Finished";

  return (
    <div className="grid md:grid-cols-12 gap-14">
      {/* Left Column - Current Phase */}
      <div className="md:border-b-0 border-b col-span-6">
        <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-1">
          CURRENT PHASE
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <div className="text-xl font-bold text-dao-text-primary">
            {currentPhase}
          </div>
          {/* <div className="text-dao-text-secondary text-xl font-bold">
            23 Days
          </div> */}
        </div>

        <p className="text-sm text-dao-text-muted leading-relaxed md:max-w-80">
          During this period we take a snapshot of all active validators on
          Solana to make them eligible for the next vote.
        </p>
      </div>

      {/* Right Column - Timeline chart */}
      <div className="flex flex-col md:mt-2 col-span-6 justify-center">
        <PhaseTimeline currentPhase={currentPhase} />
      </div>
    </div>
  );
};
