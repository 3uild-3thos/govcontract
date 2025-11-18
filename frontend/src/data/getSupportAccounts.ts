import { createProgramWitDummyWallet, SupportAccount } from "@/chain";
import { SupportAccountData } from "@/types";
import { ProgramAccount } from "@coral-xyz/anchor";
import { MemcmpFilter } from "@solana/web3.js";

interface GetSupportFilter {
  name: "proposal" | "validator";
  value: string;
}

export type GetSupportFilters = GetSupportFilter[];

const filterOffsetMap: Record<GetSupportFilter["name"], number> = {
  proposal: 8, // 8 bytes discriminator
  validator: 40, // 8 bytes discriminator + 32 bytes proposal
};

function filtersToMemcmp(filters: GetSupportFilters): MemcmpFilter[] {
  return filters
    .filter((f) => typeof f.value === "string" && !!f.value)
    .map((f) => ({
      memcmp: {
        offset: filterOffsetMap[f.name],
        bytes: f.value,
      },
    }));
}

export const getSupportAccounts = async (
  endpoint: string,
  filters: GetSupportFilters
): Promise<SupportAccountData[]> => {
  if (filters.length === 0) {
    throw new Error(
      "getSupportAccounts: At least one filter is required. Cannot fetch all support accounts."
    );
  }

  const program = createProgramWitDummyWallet(endpoint);

  const memcmpFilters = filtersToMemcmp(filters);

  const supportAccs = await program.account.support.all(memcmpFilters);

  return supportAccs.map(mapSupportAccountDto);
};

/**
 * Maps raw on-chain support account to internal type.
 */
function mapSupportAccountDto(
  rawAccount: ProgramAccount<SupportAccount>
): SupportAccountData {
  const raw = rawAccount.account;

  return {
    publicKey: rawAccount.publicKey,
    proposal: raw.proposal,
    validator: raw.validator,
    bump: raw.bump,
  };
}
