import { ValidatorVoteAccountData } from "@/types";
import { Connection, VoteAccountInfo } from "@solana/web3.js";

export const getValidatorVoteAccounts = async (
  endpoint: string,
  validatorPubkey: string | undefined
) => {
  const connection = new Connection(endpoint, "confirmed");

  if (!validatorPubkey) {
    throw new Error("User public key is required");
  }

  // TODO: use get validator hook already fetches this info, so we don't need to fetch it here. use that hook instead
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
    activeStake: raw.activatedStake,
    nodePubkey: raw.nodePubkey,
  };
}
