// import { useLatestProposalData, useProposalsVotes } from "@/hooks";
import { LiveProposal } from "./LiveProposal";
import { LiveResults } from "./LiveResults";

export const ProposalDetails = () => {
  // const { data, isLoading } = useLatestProposalData();
  // const { data: votes, isLoading: isLoadingVotes } = useProposalsVotes();

  // console.log("data:", data);
  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-14">
      {/* Left Column - Proposal Details */}
      <LiveProposal />

      {/* Right Column - Live Results */}
      <LiveResults />
    </div>
  );
};
