import {
  BlockchainParams,
  createProposal,
  CreateProposalParams,
  TransactionResult,
} from "@/chain";

// TODO: CAST VOTE
// TODO: Juan, do your magic here
// probably not much to do regarding mutations, erase this once you check everything is working properly

export const createProposalMutation = async (
  params: CreateProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> => {
  return createProposal(params, blockchainParams);
};
