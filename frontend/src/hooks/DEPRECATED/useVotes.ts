import { useQuery } from "@tanstack/react-query";

import { program } from "@/chain/helpers";

export const useVotes = () => {
  return useQuery({
    queryKey: ["proposalsVotes"],
    queryFn: getAllVotes,
    select: (data) => data || [],
  });
};

const getAllVotes = async () => {
  const votes = await program.account.vote.all();
  if (votes.length === 0) return null;

  return votes;
};
