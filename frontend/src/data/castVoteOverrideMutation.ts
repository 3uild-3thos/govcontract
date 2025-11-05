import {
  BlockchainParams,
  castVoteOverride,
  CastVoteOverrideParams,
  TransactionResult,
} from "@/chain";

export const castVoteOverrideMutation = async (
  params: CastVoteOverrideParams,
  blockchainParams: BlockchainParams,
  slot: number | undefined
): Promise<TransactionResult> => {
  return castVoteOverride(params, blockchainParams, slot);
};
