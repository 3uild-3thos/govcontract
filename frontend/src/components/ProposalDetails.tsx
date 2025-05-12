import { useLatestProposalData } from "@/hooks";
import { LiveProposal } from "./LiveProposal";
import { LiveResults } from "./LiveResults";
import { LiveProposalLoadingSkeleton } from "./LiveProposalLoadingSkeleton";
import { LiveResultsLoadingSkeleton } from "./LiveResultsLoadingSkeleton";

export const ProposalDetails = () => {
  const { data, isLoading } = useLatestProposalData();

  if (data === undefined || isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-8 md:gap-14">
        {/* Left Column - Proposal Details */}
        <LiveProposalLoadingSkeleton />

        {/* Right Column - Live Results */}
        <LiveResultsLoadingSkeleton />
      </div>
    );
  }

  const {
    title,
    description,
    forVotesPercentage,
    againstVotesPercentage,
    abstainVotesPercentage,
    undecidedVotesPercentage,
    forStake,
    againstStake,
    abstainStake,
    undecidedStake,
    votesCount,
  } = data;

  console.log("data:", data);
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-14">
      {/* Left Column - Proposal Details */}
      <LiveProposal
        title={title}
        description={description}
        votesCount={votesCount}
      />

      {/* Right Column - Live Results */}
      <LiveResults
        forVotes={forVotesPercentage}
        againstVotes={againstVotesPercentage}
        abstainVotes={abstainVotesPercentage}
        undecidedVotes={undecidedVotesPercentage}
        forStake={forStake}
        againstStake={againstStake}
        abstainStake={abstainStake}
        undecidedStake={undecidedStake}
      />
    </div>
  );
};
