import {
  BlockchainParams,
  createProgramWitDummyWallet,
  deriveVotePda,
  GOVCONTRACT_PROGRAM_ID,
  VoteAccount,
} from "@/chain";
import { ValidatorVoteAccountData, VoteAccountData } from "@/types";

import { PublicKey } from "@solana/web3.js";

export const getValidatorProposalVoteAccount = async (
  blockchainParams: BlockchainParams,
  proposalPublicKey: string | undefined,
  voteAccount: ValidatorVoteAccountData | undefined
): Promise<VoteAccountData | undefined> => {
  if (proposalPublicKey === undefined)
    throw new Error("Proposal public key is not loaded");

  if (voteAccount === undefined) throw new Error("No vote account found");

  const program = createProgramWitDummyWallet(blockchainParams.endpoint);
  const proposalPubkey = new PublicKey(proposalPublicKey);

  const splVoteAccount = new PublicKey(voteAccount.voteAccount);
  const validatorVotePda = deriveVotePda(
    proposalPubkey,
    splVoteAccount,
    GOVCONTRACT_PROGRAM_ID
  );

  // Try to fetch. If not found, throw an error clearly showing both addresses.
  try {
    const voteAccountData = await program.account.vote.fetch(validatorVotePda);

    return mapVoteOverrideAccountDto(voteAccountData);
  } catch (error) {
    console.error(
      Error(
        `Failed to fetch vote account at PDA: ${validatorVotePda.toBase58()}\n` +
          `SPL vote account: ${splVoteAccount.toBase58()}\n` +
          `Original error: ${
            error instanceof Error ? error.message : String(error)
          }`
      )
    );

    return undefined;
  }
};

/**
 * Maps raw on-chain vote account to internal type.
 */
function mapVoteOverrideAccountDto(raw: VoteAccount): VoteAccountData {
  return {
    validator: raw.validator,
    proposal: raw.proposal,
    forVotesBp: raw.forVotesBp,
    againstVotesBp: raw.againstVotesBp,
    abstainVotesBp: raw.abstainVotesBp,
    forVotesLamports: raw.forVotesLamports,
    againstVotesLamports: raw.againstVotesLamports,
    abstainVotesLamports: raw.abstainVotesLamports,
    stake: raw.stake,
    overrideLamports: raw.overrideLamports,
    voteTimestamp: raw.voteTimestamp,
    bump: raw.bump,
  };
}
