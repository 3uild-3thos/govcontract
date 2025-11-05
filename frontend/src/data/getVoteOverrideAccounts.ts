import {
  createProgramWitDummyWallet,
  deriveVoteOverridePda,
  deriveVotePda,
  GOVCONTRACT_PROGRAM_ID,
  VoteOverrideAccount,
} from "@/chain";
import { VoteOverrideAccountData } from "@/types";
import { StakeAccountData } from "@/types/stakeAccounts";
import { PublicKey } from "@solana/web3.js";

export const getVoteOverrideAccounts = async (
  endpoint: string,
  proposalPublicKey: string | undefined,
  stakeAccounts: StakeAccountData[]
): Promise<VoteOverrideAccountData[]> => {
  if (proposalPublicKey === undefined)
    throw new Error("Proposal public key is not loaded");

  const program = createProgramWitDummyWallet(endpoint);
  const proposalPubkey = new PublicKey(proposalPublicKey);

  // First, derive the validator_vote PDA for each stake account
  // Then use that to derive the vote_override PDA
  const derivedPdas = stakeAccounts
    .filter((d) => d.voteAccount !== undefined)
    .map((d) => {
      const splVoteAccount = new PublicKey(d.voteAccount!);
      // Derive validator_vote PDA (the vote account PDA, not the SPL vote account)
      const validatorVotePda = deriveVotePda(
        proposalPubkey,
        splVoteAccount,
        GOVCONTRACT_PROGRAM_ID
      );
      // Now derive vote_override PDA using the validator_vote PDA
      return deriveVoteOverridePda(
        proposalPubkey,
        new PublicKey(d.stakeAccount),
        validatorVotePda,
        GOVCONTRACT_PROGRAM_ID
      );
    });

  const voteOverrideAccs = await program.account.voteOverride.fetchMultiple(
    derivedPdas
  );

  console.log("voteOverrideAccs", voteOverrideAccs);

  // Filter out null accounts and map to DTO
  return voteOverrideAccs
    .filter((acc): acc is VoteOverrideAccount => acc !== null)
    .map(mapVoteOverrideAccountDto);
};

/**
 * Maps raw on-chain vote account to internal type.
 */
function mapVoteOverrideAccountDto(
  rawAccount: VoteOverrideAccount
): VoteOverrideAccountData {
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
