import {
  BlockchainParams,
  modifyVote,
  ModifyVoteParams,
  TransactionResult,
} from "@/chain";

export const modifyVoteMutation = async (
  params: ModifyVoteParams,
  blockchainParams: BlockchainParams,
  slot: number | undefined
): Promise<TransactionResult> => {
  return modifyVote(params, blockchainParams, slot);
};
