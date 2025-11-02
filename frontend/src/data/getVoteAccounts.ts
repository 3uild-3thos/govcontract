import { BlockchainParams, createProgramWitDummyWallet } from "@/chain";
import { RawVoteAccountDataAccount, VoteAccountData } from "@/types";

export const getVoteAccounts = async (
  blockchainParams: BlockchainParams
): Promise<VoteAccountData[]> => {
  const program = createProgramWitDummyWallet(blockchainParams.endpoint);

  const voteAccs = await program.account.vote.all();
  console.log("voteAccs:", voteAccs);
  return voteAccs.map(mapVoteAccountDto);
};

/**
 * Maps raw on-chain vote account to internal type.
 */
export function mapVoteAccountDto(
  rawAccount: RawVoteAccountDataAccount
): VoteAccountData {
  const raw = rawAccount.account;

  return {
    voteAccount: rawAccount.publicKey,
    proposal: raw.proposal,
    // validator data
    activeStake: raw.stake?.toNumber() || 0,
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
