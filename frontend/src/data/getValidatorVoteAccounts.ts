import { ValidatorVoteAccountData } from "@/types";
import { Connection, VoteAccountInfo } from "@solana/web3.js";
import { BN } from "bn.js";

export const getValidatorVoteAccounts = async (
  endpoint: string,
  validatorPubkey: string | undefined
) => {
  const connection = new Connection(endpoint, "confirmed");

  if (!validatorPubkey) {
    throw new Error("User public key is required");
  }

  const voteAccounts = await connection.getVoteAccounts();
  const validatorVoteAccount = voteAccounts.current.find(
    (acc) => acc.nodePubkey === validatorPubkey
  );

  if (!validatorVoteAccount) {
    throw new Error(
      `No SPL vote account found for validator identity ${validatorPubkey}`
    );
  }
  return mapValidatorVoteAccountDto(validatorVoteAccount);
};

function mapValidatorVoteAccountDto(
  raw: VoteAccountInfo
): ValidatorVoteAccountData {
  return {
    voteAccount: raw.votePubkey,
    activeStake: new BN(`${raw.activatedStake}`),
    nodePubkey: raw.nodePubkey,
  };
}
