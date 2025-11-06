import { createProgramWitDummyWallet, VoteOverrideAccount } from "@/chain";
import { VoteOverrideAccountData } from "@/types";
import { ProgramAccount } from "@coral-xyz/anchor";
import { MemcmpFilter } from "@solana/web3.js";

interface GetVoteOverrideFilter {
  name: "delegator" | "proposal" | "validator" | "stakeAccount";
  value: string;
}

export type GetVoteOverrideFilters = GetVoteOverrideFilter[];

const filterOffsetMap = {
  delegator: 8, // 8 bytes discriminator
  stakeAccount: 40, // 8 bytes discriminator + 32 bytes delegator
  validator: 72, // 8 bytes discriminator + 32 bytes delegator + 32 bytes stakeAccount
  proposal: 104, // 8 bytes discriminator + 32 bytes delegator + 32 bytes stakeAccount + 32 bytes validator
};

export function filtersToMemcmp(
  filters: GetVoteOverrideFilters
): MemcmpFilter[] {
  return filters
    .filter((f) => typeof f.value === "string" && !!f.value)
    .map((f) => ({
      memcmp: {
        offset: filterOffsetMap[f.name],
        bytes: f.value,
      },
    }));
}

export const getVoteOverrideAccounts = async (
  endpoint: string,
  filters: GetVoteOverrideFilters
): Promise<VoteOverrideAccountData[]> => {
  if (filters.length === 0) {
    throw new Error(
      "getVoteOverrideAccounts: At least one filter is required. Cannot fetch all voteOverride accounts."
    );
  }

  const program = createProgramWitDummyWallet(endpoint);

  const memcmpFilters = filtersToMemcmp(filters);

  const voteOverrideAccs = await program.account.voteOverride.all(
    memcmpFilters
  );

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
    publicKey: rawAccount.publicKey,
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
