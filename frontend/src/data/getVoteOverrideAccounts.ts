import { BlockchainParams, createProgramWitDummyWallet } from "@/chain";
import {
  VoteOverrideAccountData,
  RawVoteOverrideAccountDataAccount,
} from "@/types";

export const getVoteOverrideAccounts = async (
  blockchainParams: BlockchainParams
): Promise<VoteOverrideAccountData[]> => {
  const program = createProgramWitDummyWallet(blockchainParams.endpoint);
  console.log("here???");
  const voteOverrideAccs = await program.account.voteOverride.all();
  console.log("voteOverrideAccs:", voteOverrideAccs);
  return voteOverrideAccs.map(mapVoteOverrideAccountDto);
};

/**
 * Maps raw on-chain vote account to internal type.
 */
function mapVoteOverrideAccountDto(
  rawAccount: RawVoteOverrideAccountDataAccount
): VoteOverrideAccountData {
  const raw = rawAccount.account;

  return {
    voteAccount: rawAccount.publicKey,
    proposal: raw.proposal,
    // validator data
    activeStake: raw.stakeAmount?.toNumber() || 0,
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
    voteTimestamp: raw.voteOverrideTimestamp,
    bump: raw.bump,
  };
}
