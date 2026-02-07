import { createProgramWitDummyWallet } from "@/chain";
import { OldVoteAccountData, RawVoteAccountDataAccount } from "@/types";
import { PublicKey } from "@solana/web3.js";

/**
 * Fetches votes for a specific proposal
 * Filters by proposal public key directly on the RPC for efficient querying
 */
export const getProposalVotes = async (
  proposalPublicKey: PublicKey,
  endpoint: string,
): Promise<Array<OldVoteAccountData & { voter: PublicKey }>> => {
  const program = createProgramWitDummyWallet(endpoint);

  // Proposal field offset 40 (8 bytes discriminator + 32 bytes validator)
  const proposalVotes = await program.account.vote.all([
    {
      memcmp: {
        offset: 40, // Offset where proposal field starts
        bytes: proposalPublicKey.toBase58(),
      },
    },
  ]);

  console.log("proposalVotes:", proposalVotes);

  // Map to the expected format with voter field
  return proposalVotes.map((vote) => {
    const mapped = mapVoteAccountDto({
      account: vote.account,
      publicKey: vote.publicKey,
    });
    return {
      ...mapped,
      voter: vote.publicKey,
    };
  });
};

/**
 * Maps raw on-chain vote account to internal type.
 */
function mapVoteAccountDto(
  rawAccount: RawVoteAccountDataAccount,
): OldVoteAccountData {
  const raw = rawAccount.account;

  return {
    voteAccount: rawAccount.publicKey,
    proposal: raw.proposal,
    // validator data
    activeStake: raw.stake ? +raw.stake.toString() : 0,
    identity: raw.validator,
    commission: 0,
    lastVote: 0,
    credits: 0,
    epochCredits: 0,
    activatedStake: 0,
    // vote data
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
