import {
  BlockchainParams,
  createProgramWitDummyWallet,
  deriveVoteOverridePda,
  GOVCONTRACT_PROGRAM_ID,
  VoteOverrideAccount,
} from "@/chain";
import { VoteOverrideAccountData } from "@/types";
import { StakeAccountData } from "@/types/stakeAccounts";
import { PublicKey } from "@solana/web3.js";

export const getVoteOverrideAccounts = async (
  blockchainParams: BlockchainParams,
  proposalPublicKey: string | undefined,
  stakeAccounts: StakeAccountData[]
): Promise<VoteOverrideAccountData[]> => {
  if (proposalPublicKey === undefined)
    throw new Error("Proposal public key is not loaded");

  const program = createProgramWitDummyWallet(blockchainParams.endpoint);

  const derivedPdas = stakeAccounts
    .filter((d) => d.voteAccount !== undefined)
    .map((d) =>
      deriveVoteOverridePda(
        new PublicKey(proposalPublicKey),
        new PublicKey(d.stakeAccount),
        new PublicKey(d.voteAccount!),
        GOVCONTRACT_PROGRAM_ID
      )
    );

  console.log("derivedPdas", derivedPdas);

  const voteOverrideAccs = await program.account.voteOverride.fetchMultiple(
    derivedPdas
  );
  console.log("voteOverrideAccs:", voteOverrideAccs);

  const voteOverrideCacheAccs =
    await program.account.voteOverrideCache.fetchMultiple(derivedPdas);
  console.log("voteOverrideCacheAccs:", voteOverrideCacheAccs);

  // if value is null, needs cast override
  // if value exists, modify override

  return voteOverrideAccs.map(mapVoteOverrideAccountDto);
};

/**
 * Maps raw on-chain vote account to internal type.
 */
function mapVoteOverrideAccountDto(
  rawAccount: VoteOverrideAccount | null
): VoteOverrideAccountData {
  // TODO filter nulls before
  if (rawAccount === null) throw new Error("null??");

  const raw = rawAccount;

  return {
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
