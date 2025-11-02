import {
  BlockchainParams,
  SupportProposalParams,
  supportProposal,
  TransactionResult,
} from "@/chain";

export const supportProposalMutation = async (
  params: SupportProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> => {
  return supportProposal(params, blockchainParams);
};
