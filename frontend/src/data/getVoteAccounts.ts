import { BlockchainParams, createProgramWitDummyWallet } from "@/chain";
import { RawVoteAccountDataAccount, VoteAccountData } from "@/types";

export const getVoteAccounts = async (
  blockchainParams: BlockchainParams
): Promise<VoteAccountData[]> => {
  const program = createProgramWitDummyWallet(blockchainParams.endpoint);

  const voteAccs = await program.account.vote.all();
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
    voteAccount: rawAccount.publicKey.toBase58(),
    activeStake: raw.stake?.toNumber() || 0,
    identity: raw.validator.toBase58(),
    commission: 0,
    lastVote: 0,
    credits: 0,
    epochCredits: 0,
    activatedStake: 0,
  };
}
