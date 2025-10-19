import {
  BlockchainParams,
  castVote,
  CastVoteParams,
  TransactionResult,
} from "@/chain";

// TODO: CAST VOTE
// TODO: Juan, do your magic here
// probably not much to do regarding mutations, erase this once you check everything is working properly

export const castVoteMutation = async (
  params: CastVoteParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> => {
  return castVote(params, blockchainParams);
};
