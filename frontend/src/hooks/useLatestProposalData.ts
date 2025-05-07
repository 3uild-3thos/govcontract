import { useQuery } from "@tanstack/react-query";

import { getAllProposals } from "@/data";

export const useLatestProposalData = () => {
  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["latestProposalData"],
    queryFn: getData,
  });
};

const getData = async () => {
  const proposals = await getAllProposals();

  if (proposals.length === 0) return null;

  // console.log("fetched proposals:", proposals);

  const latest = proposals.sort(
    (a, b) => Number(b.account.startEpoch) - Number(a.account.startEpoch)
  )[0];

  return {
    pubkey: latest.publicKey,
    data: latest.account,
  };
};

// type ProposalAccountData = Awaited<
//   ReturnType<Program<Govcontract>["account"]["proposal"]["fetch"]>
// >;

// async function isVotingActive(
//   connection: Connection,
//   proposal: ProposalAccountData
// ): Promise<boolean> {
//   const { epoch } = await connection.getEpochInfo();

//   return (
//     proposal.voting &&
//     epoch >= Number(proposal.startEpoch) &&
//     epoch < Number(proposal.endEpoch) &&
//     !proposal.finalized
//   );
// }

// async function canTallyProposal(
//   connection: Connection,
//   proposal: ProposalAccountData
// ): Promise<boolean> {
//   const { epoch } = await connection.getEpochInfo();

//   return !proposal.finalized && epoch >= Number(proposal.endEpoch);
// }
