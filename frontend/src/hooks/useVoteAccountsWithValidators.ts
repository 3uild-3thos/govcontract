import { useQuery } from "@tanstack/react-query";
import { useGetValidators } from "./useGetValidators"; // your existing hook
import { PublicKey } from "@solana/web3.js";
import { useVotes } from "./useVotes";
import { program } from "@/chain/helpers";
import { Vote } from "@/chain";
import { Validator } from "@/types";

type VoteValidatorEntry = {
  votePDA: PublicKey;
  voteAccount: Vote;
  validator: Validator | undefined;
};

type VotePublicKey = string;
type VoteMap = Record<VotePublicKey, VoteValidatorEntry>; // key = vote public key

type ValidatorIdentity = string;
type ValidatorMap = Record<ValidatorIdentity, VoteValidatorEntry[]>; // key = validator.identity

/**
 * Hashmap by validator.identity key
 *  * @property {string} key - The unique identifier for the user.
 */
export interface VoteAccountsWithValidators {
  voteMap: VoteMap;
  validatorMap: ValidatorMap;
}

export const useVoteAccountsWithValidators = () => {
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();
  const { data: votes, isLoading: isLoadingVotes } = useVotes();

  const enabled =
    !!validators && !isLoadingValidators && !!votes && !isLoadingVotes;

  return useQuery({
    queryKey: ["vote-accounts-with-validators"],
    queryFn: async (): Promise<VoteAccountsWithValidators> => {
      if (validators === undefined)
        throw new Error("Unable to get validators info");
      if (votes === undefined) throw new Error("Unable to get votes info");

      if (validators.length === 0) throw new Error("No validators found");
      if (votes.length === 0) throw new Error("No votes found");

      const voteMap: VoteMap = {};
      const validatorMap: ValidatorMap = {};

      for (const vote of votes) {
        for (const validator of validators) {
          const proposal = vote.account.proposalId;

          const validatorPubkey = new PublicKey(validator.vote_identity);
          const [expectedVotePda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("vote"),
              proposal.toBuffer(),
              validatorPubkey.toBuffer(),
            ],
            program.programId
          );

          if (expectedVotePda.equals(vote.publicKey)) {
            const votePk = vote.publicKey.toBase58();

            const entry: VoteValidatorEntry = {
              votePDA: vote.publicKey,
              voteAccount: vote,
              validator,
            };

            voteMap[votePk] = entry;

            if (validator) {
              const valId = validator.identity;
              if (!validatorMap[valId]) {
                validatorMap[valId] = [];
              }
              validatorMap[valId].push(entry);
            }
          }
        }
      }

      return {
        voteMap,
        validatorMap,
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled,
  });
};
