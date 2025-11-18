import {
  BlockchainParams,
  SupportProposalParams,
  supportProposal,
  TransactionResult,
  ChainVoteAccountData,
} from "@/chain";

export const supportProposalMutation = async (
  params: SupportProposalParams,
  blockchainParams: BlockchainParams,
  slot: number | undefined,
  chainVoteAccount: ChainVoteAccountData | undefined
): Promise<TransactionResult> => {
  return supportProposal(params, blockchainParams, slot, chainVoteAccount);
};
