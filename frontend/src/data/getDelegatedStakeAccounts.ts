import { BlockchainParams } from "@/chain";
import { Connection, PublicKey, StakeProgram } from "@solana/web3.js";

interface ParsedStakeAccount {
  stakeAccount: string;
  voter: string | undefined;
  amountSOL: number;
  staker: string | undefined;
  withdrawer: string | undefined;
  state: string;
}

// TODO: PEDRO remove this after proper testing
// this vote acc: A7MXYCmYhjMfn4D6tsPn6aA3eqR9Gg5k7Bi8PpTooHoY
// belongs to this validator identity: ftvo8MRM5AtDtLJRKbGYveyYTGL84zraqe4E3qGD2aF
// which has 2 of my stake accounts delegated to it: 95FVVbEVScVhvP16F9K6AkoUecU43AJCqDDRPv9H2oFi and CBzw3NaL4PxiX3yyyf1YFw6bAYBpcAa9itG9SNvvqxAo
// this function correctly returns the delegated stake accs
export const getDelegatedStakeAccounts = async (
  { endpoint }: BlockchainParams,
  validatorIdentityPubKey: string | undefined
): Promise<ParsedStakeAccount[]> => {
  const connection = new Connection(endpoint, "confirmed");

  if (!validatorIdentityPubKey) {
    throw new Error("Validator identity public key is required");
  }

  const { current, delinquent } = await connection.getVoteAccounts();
  const allVotes = [...current, ...delinquent];

  // Filter only this validator’s vote accounts by validator identity
  const validatorVotes = allVotes.filter(
    (v) => v.nodePubkey === validatorIdentityPubKey
  );

  if (validatorVotes.length === 0) {
    console.log(
      "No vote accounts found for validator identity",
      validatorIdentityPubKey
    );
    return [];
  }

  // Fetch all stake accounts referencing any of those vote accounts
  const STAKE_PROGRAM_ID = StakeProgram.programId;
  const allStakeAccounts: ParsedStakeAccount[] = [];

  for (const vote of validatorVotes) {
    const voterPubkey = new PublicKey(vote.votePubkey);

    // Stake account data has delegation.voter pubkey at byte offset 124
    const accounts = await connection.getParsedProgramAccounts(
      STAKE_PROGRAM_ID,
      {
        filters: [
          { dataSize: 200 },
          { memcmp: { offset: 124, bytes: voterPubkey.toBase58() } },
        ],
      }
    );

    const parsed = accounts.map((acc) => {
      const parsedData = (acc.account.data as ParsedStakeAccountInfo).parsed;
      const stakeInfo = parsedData?.info?.stake?.delegation;
      const meta = parsedData?.info?.meta;
      return {
        stakeAccount: acc.pubkey.toBase58(),
        voter: stakeInfo?.voter,
        amountSOL: Number(stakeInfo?.stake || 0) / 1e9,
        staker: meta?.authorized?.staker,
        withdrawer: meta?.authorized?.withdrawer,
        state: parsedData?.type,
      };
    });

    allStakeAccounts.push(...parsed);
  }

  return allStakeAccounts;
};

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
