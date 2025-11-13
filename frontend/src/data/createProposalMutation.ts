import {
  BlockchainParams,
  createProposal,
  CreateProposalParams,
  TransactionResult,
} from "@/chain";

export const createProposalMutation = async (
  params: CreateProposalParams,
  blockchainParams: BlockchainParams,
  slot: number | undefined
): Promise<TransactionResult> => {
  return createProposal(params, blockchainParams, slot);
};
