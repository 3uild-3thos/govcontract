import { castVote, CastVoteParams, TransactionResult } from "@/chain";

// TODO: Juan, do your magic here
// probably not much to do regarding mutations, erase this once you check everything is working properly

export const castVoteMutation = async (
  params: CastVoteParams
): Promise<TransactionResult> => {
  return castVote(params);
};
