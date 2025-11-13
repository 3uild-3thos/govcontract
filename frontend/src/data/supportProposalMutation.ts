import {
  BlockchainParams,
  SupportProposalParams,
  supportProposal,
  TransactionResult,
} from "@/chain";

export const supportProposalMutation = async (
  params: SupportProposalParams,
  blockchainParams: BlockchainParams,
  slot: number | undefined
): Promise<TransactionResult> => {
  return supportProposal(params, blockchainParams, slot);
};
