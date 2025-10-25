import { BlockchainParams } from "@/chain";
import { StakeAccountData, StakeAccountState } from "@/types/stakeAccounts";
import {
  AccountInfo,
  Connection,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";

// TODO: feel free to create a new file for the blockchain fetching logic, and rename this one to proposalsMapper or smth like that

export const getStakeAccounts = async (
  { endpoint }: BlockchainParams,
  userPubkey: string
): Promise<StakeAccountData[]> => {
  const connection = new Connection(endpoint, "confirmed");

  // Fetch all stake accounts owned by this wallet
  const stakeAccounts = await connection.getParsedProgramAccounts(
    new PublicKey("Stake11111111111111111111111111111111111111"), // Stake Program
    {
      filters: [
        { dataSize: 200 }, // optional: typical size of stake accounts
        { memcmp: { offset: 44, bytes: userPubkey } }, // owner filter
        // { memcmp: { offset: 8, bytes: "staker pub key" } }, // staker filter
      ],
    }
  );

  console.log("stakeAccs:", stakeAccounts);

  return stakeAccounts.map(mapStakeAccountDto);
};

interface RawStakeAccount {
  pubkey: PublicKey;
  account: AccountInfo<Buffer | ParsedAccountData>;
}

export function mapStakeAccountDto(raw: RawStakeAccount): StakeAccountData {
  if (!isParsedStakeAccount(raw.account)) {
    throw new Error("Account is not a parsed stake account");
  }

  const parsed = (raw.account.data as ParsedStakeAccountInfo).parsed;
  const delegation = parsed.info?.stake?.delegation;
  const activeStake = delegation?.stake ? parseFloat(delegation.stake) : 0;
  return {
    voteAccount: delegation?.voter ?? undefined,
    activeStake,
    stakeAccount: raw.pubkey.toBase58(),
    state: parsed.type as StakeAccountState,
  };
}

function isParsedStakeAccount(
  account: AccountInfo<Buffer | ParsedAccountData> | null
): account is AccountInfo<ParsedAccountData> & {
  data: { parsed: ParsedStakeAccountInfo };
} {
  return (
    !!account && typeof account.data === "object" && "parsed" in account.data
  );
}

interface ParsedStakeAccountInfo {
  program: "stake";
  space: number;
  parsed: {
    type: string;
    info: {
      meta?: { authorized: { staker: string; withdrawer: string } };
      stake?: {
        delegation?: { voter: string; stake: string };
        creditsObserved?: number;
      };
    };
  };
}
