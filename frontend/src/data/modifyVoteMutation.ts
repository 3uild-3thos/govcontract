import { modifyVote, ModifyVoteParams, TransactionResult } from "@/chain";

// TODO: MODIFY VOTE
// TODO: Juan, do your magic here
// probably not much to do regarding mutations, erase this once you check everything is working properly

export const modifyVoteMutation = async (
  params: ModifyVoteParams
): Promise<TransactionResult> => {
  return modifyVote(params);
};
