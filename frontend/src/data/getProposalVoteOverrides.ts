import { createProgramWitDummyWallet, VoteOverrideAccount } from "@/chain";
import { VoteOverrideAccountData } from "@/types";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

/**
 * Fetches vote overrides for a specific proposal
 * Filters by proposal public key directly on the RPC for efficient querying
 */
export const getProposalVoteOverrides = async (
  proposalPublicKey: PublicKey,
  endpoint: string
): Promise<
  Array<
    VoteOverrideAccountData & {
      voter: PublicKey;
      activeStake: number;
      identity: PublicKey;
      voteTimestamp: BN;
    }
  >
> => {
  const program = createProgramWitDummyWallet(endpoint);

  // Filter vote override accounts by proposal public key directly on RPC
  // Proposal field is at offset 72 (8 bytes discriminator + 32 bytes stakeAccount + 32 bytes validator)
  const proposalOverrides = await program.account.voteOverride.all([
    {
      memcmp: {
        offset: 72, // Offset where proposal field starts
        bytes: proposalPublicKey.toBase58(),
      },
    },
  ]);

  console.log("proposalOverrides:", proposalOverrides);

  // Map to the expected format with voter, activeStake, identity, and voteTimestamp fields
  return proposalOverrides.map((override) => {
    const mapped = mapVoteOverrideAccountDto(override.account);
    return {
      ...mapped,
      voter: override.account.stakeAccount, // Use stake account as the voter identifier
      activeStake: mapped.stakeAmount.toNumber() || 0,
      identity: mapped.validator, // Map validator to identity for consistency
      voteTimestamp: mapped.voteOverrideTimestamp, // Map voteOverrideTimestamp to voteTimestamp
    };
  });
};

/**
 * Maps raw on-chain vote override account to internal type.
 */
function mapVoteOverrideAccountDto(
  rawAccount: VoteOverrideAccount
): VoteOverrideAccountData {
  return {
    stakeAccount: rawAccount.stakeAccount,
    validator: rawAccount.validator,
    proposal: rawAccount.proposal,
    voteAccountValidator: rawAccount.voteAccountValidator,
    forVotesBp: rawAccount.forVotesBp,
    againstVotesBp: rawAccount.againstVotesBp,
    abstainVotesBp: rawAccount.abstainVotesBp,
    forVotesLamports: rawAccount.forVotesLamports,
    againstVotesLamports: rawAccount.againstVotesLamports,
    abstainVotesLamports: rawAccount.abstainVotesLamports,
    stakeAmount: rawAccount.stakeAmount,
    voteOverrideTimestamp: rawAccount.voteOverrideTimestamp,
    bump: rawAccount.bump,
  };
}
