import { VotingRateChart } from "./ui";

export const Quorum = () => {
  return (
    <div className="grid md:grid-cols-12 gap-14">
      {/* Left Column - Quorum */}
      <div className="md:border-b-0 border-b col-span-5">
        <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-1">
          QUORUM
        </div>

        <div className="flex items-baseline gap-3 mb-1">
          <div className="text-xl font-bold text-dao-text-primary">60%</div>
          <div className="text-dao-text-secondary text-sm">2,115,564 SOL</div>
        </div>

        <p className="text-sm text-dao-text-muted leading-relaxed md:max-w-80">
          Quorum in DAO voting is the minimum percentage of members or tokens
          required to validate a proposal.
        </p>
      </div>

      {/* Right Column - Voting Rate */}
      <div className="flex flex-col md:mt-2 col-span-7">
        <div className="text-xs font-medium tracking-wider text-dao-text-secondary uppercase mb-3">
          VOTING RATE
        </div>

        {/* Stacked Bar Chart */}
        <VotingRateChart
          yesPercentage={30}
          noPercentage={10}
          abstainPercentage={10}
          requiredAmount="2,334,363 SOL"
          currentPosition={60}
        />
      </div>
    </div>
  );
};
