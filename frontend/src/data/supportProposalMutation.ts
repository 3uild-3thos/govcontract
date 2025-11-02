import {
  BlockchainParams,
  SupportProposalParams,
  supportProposal,
  TransactionResult,
} from "@/chain";

// TODO: CAST VOTE OVERRIDE
// TODO: Juan, do your magic here
// probably not much to do regarding mutations, erase this once you check everything is working properly

export const supportProposalMutation = async (
  params: SupportProposalParams,
  blockchainParams: BlockchainParams
): Promise<TransactionResult> => {
  return supportProposal(params, blockchainParams);
};
