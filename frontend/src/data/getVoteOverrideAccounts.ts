import { createProgramWitDummyWallet, VoteOverrideAccount } from "@/chain";
import { VoteOverrideAccountData } from "@/types";
import { ProgramAccount } from "@coral-xyz/anchor";

export const getVoteOverrideAccounts = async (
  endpoint: string,
  proposalPublicKey: string | undefined,
  userPubkey: string | undefined
): Promise<VoteOverrideAccountData[]> => {
  if (proposalPublicKey === undefined)
    throw new Error("Proposal public key is not loaded");

  if (userPubkey === undefined)
    throw new Error("Proposal public key is not loaded");

  const program = createProgramWitDummyWallet(endpoint);

  const voteOverrideAccs = await program.account.voteOverride.all([
    {
      memcmp: {
        // delegator is at offset 8 (discriminator) in VoteOverride account
        offset: 8,
        bytes: userPubkey,
      },
    },
  ]);

  console.log("voteOverrideAccs", voteOverrideAccs);

  // Filter out null accounts and map to DTO
  return voteOverrideAccs.map(mapVoteOverrideAccountDto);
};

/**
 * Maps raw on-chain vote account to internal type.
 */
function mapVoteOverrideAccountDto(
  rawAccount: ProgramAccount<VoteOverrideAccount>
): VoteOverrideAccountData {
  const raw = rawAccount.account;

  return {
    delegator: raw.delegator,
    stakeAccount: raw.stakeAccount,
    validator: raw.validator,
    proposal: raw.proposal,
    voteAccountValidator: raw.voteAccountValidator,
    forVotesBp: raw.forVotesBp,
    againstVotesBp: raw.againstVotesBp,
    abstainVotesBp: raw.abstainVotesBp,
    forVotesLamports: raw.forVotesLamports,
    againstVotesLamports: raw.againstVotesLamports,
    abstainVotesLamports: raw.abstainVotesLamports,
    stakeAmount: raw.stakeAmount,
    voteOverrideTimestamp: raw.voteOverrideTimestamp,
    bump: raw.bump,
  };
}
