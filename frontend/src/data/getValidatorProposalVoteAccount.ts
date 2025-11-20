import { createProgramWitDummyWallet, VoteAccount } from "@/chain";
import { ValidatorVoteAccountData, VoteAccountData } from "@/types";

import { PublicKey } from "@solana/web3.js";

export const getValidatorProposalVoteAccount = async (
  endpoint: string,
  proposalPublicKey: string | undefined,
  voteAccount: ValidatorVoteAccountData | undefined
): Promise<VoteAccountData | null> => {
  if (proposalPublicKey === undefined)
    throw new Error("Proposal public key is not loaded");

  if (voteAccount === undefined) throw new Error("No vote account found");

  const program = createProgramWitDummyWallet(endpoint);
  const proposalPubkey = new PublicKey(proposalPublicKey);

  const validatorPubkey = new PublicKey(voteAccount.nodePubkey);

  // Filter by validator (offset 8) and proposal (offset 40)
  // Vote account structure: 8 bytes discriminator + 32 bytes validator + 32 bytes proposal + ...
  const voteAccounts = await program.account.vote.all([
    {
      memcmp: {
        offset: 8, // Validator field offset (after 8-byte discriminator)
        bytes: validatorPubkey.toBase58(),
      },
    },
    {
      memcmp: {
        offset: 40, // Proposal field offset (8 discriminator + 32 validator)
        bytes: proposalPubkey.toBase58(),
      },
    },
  ]);

  if (voteAccounts.length === 0) {
    console.warn(
      `No program vote account found for validator ${validatorPubkey.toBase58()} and proposal ${proposalPubkey.toBase58()}`
    );
    return null;
  }

  // Should only be one result since PDA is unique per (proposal, spl_vote_account)
  if (voteAccounts.length > 1) {
    console.warn(
      `Multiple vote accounts found for validator ${validatorPubkey.toBase58()} and proposal ${proposalPubkey.toBase58()}, using first one`
    );
  }

  console.log("validator voteAccounts", voteAccounts);

  return mapVoteAccountDto(voteAccounts[0].account);
};

/**
 * Maps raw on-chain vote account to internal type.
 */
function mapVoteAccountDto(raw: VoteAccount): VoteAccountData {
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
