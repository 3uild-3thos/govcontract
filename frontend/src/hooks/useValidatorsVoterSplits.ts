import { PublicKey } from "@solana/web3.js";
import { program } from "@/chain/helpers";
import { useGetValidators } from "./useGetValidators";
import { useVotes } from "./useVotes";
import { useQuery } from "@tanstack/react-query";

type ValidatorVoteIdentity = string;

export type VoteType = "yes" | "no" | "abstain" | "undecided";

type Analytics = Record<VoteType, number>;

export const useValidatorsVoterSplits = () => {
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();
  const { data: votes, isLoading: isLoadindVotes } = useVotes();

  const validatorsReady =
    !isLoadingValidators && validators && validators.length > 0;
  const votesReady = !isLoadindVotes && votes && votes.length > 0;
  const enabled = validatorsReady && votesReady;

  const isLoadingSubqueries = isLoadindVotes || isLoadingValidators;

  const query = useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["validatorsVoterSplits"],
    enabled,
    queryFn: async () => {
      if (!validators || !votes) return null;

      // we need to compute each validators Voter Split (average yes/no/abstain/undecided of ALL votes)
      const voteSums: Record<
        ValidatorVoteIdentity,
        { for: number; against: number; abstain: number; count: number }
      > = {};

      for (const vote of votes) {
        const votePda = vote.publicKey;
        const proposal = vote.account.proposalId;

        let matchedValidator = false;

        console.log("checking for votePda:", votePda.toBase58());

        for (const validator of validators) {
          const validatorPubkey = new PublicKey(validator.vote_identity);
          console.log("checking validator_identity:", validator.vote_identity);
          const [expectedVotePda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("vote"),
              proposal.toBuffer(),
              validatorPubkey.toBuffer(),
            ],
            program.programId
          );

          console.log("expectedVotePda:", expectedVotePda.toBase58());
          if (expectedVotePda.equals(votePda)) {
            matchedValidator = true;

            // calculate here??
            console.log(
              `Vote by: ${validator.name} (${validator.vote_identity})`
            );
            console.log("Vote data:", vote.account);

            const data = vote.account;
            const vote_identity = validator.vote_identity;
            if (!voteSums[vote_identity]) {
              voteSums[vote_identity] = {
                for: 0,
                against: 0,
                abstain: 0,
                count: 0,
              };
            }

            voteSums[vote_identity].for += data.forVotesBp;
            voteSums[vote_identity].against += data.againstVotesBp;
            voteSums[vote_identity].abstain += data.abstainVotesBp;
            voteSums[vote_identity].count += 1;

            break;
          }
        }
        if (!matchedValidator)
          console.error("found no validator for this vote", vote);
      }

      const result: Record<string, Analytics> = {};

      for (const [
        vote_identity,
        { for: f, against: a, abstain: ab, count },
      ] of Object.entries(voteSums)) {
        const avgFor = f / count;
        const avgAgainst = a / count;
        const avgAbstain = ab / count;
        const undecided = 10000 - (avgFor + avgAgainst + avgAbstain);

        result[vote_identity] = {
          yes: avgFor / 100,
          no: avgAgainst / 100,
          abstain: avgAbstain / 100,
          undecided: undecided / 100,
        };
      }
      console.log("result:", result);
      return result;
    },
  });

  return { ...query, isLoading: isLoadingSubqueries || query.isLoading };
};

// third + run:
// Proposal Account2:  AKYbEejAkCMvnqid2Wo8JTtQrykKQ4frB26ANJNnpz9X
// Validator 1 Vote Account:  HEXPB35oMZ5cug8GwbEmAfCnCumV4C6drAmXxxz4Zb1w

// Validator 1 Public Key:  9wjMBVeCd75CrWS1VXqWmcndBSagVx8tGrX1kWdbLQRW
// Validator 12 Vote Account:  9oNFascoZqtPYhtAfnYTXCdbNUZUEtkrCuDuDpKaAqv
// Validator 12 Vote Account:  3DvPi2hCVGzz1Gf5RyQfyFVuDLcjuqvfccfMgjqyLjJb

// Validator 2 Public Key:  FkfmXCyGwRfNpaTVYixwssGphP6PnRBDZJWHWurLTvMy
// Validator 2 Vote Account:  8gdpjS6fB1ZnoDGE8jzndwhyz76WnLYStSLk49va7R2A

// Validator 22 Public Key:  9QikEprykgKPwB7BenieDYLaeH4iUzfrWooykNBGyDxt
// Validator 22 Vote Account:  GUtr3pTR19maqCTebgZFxKdfuZnLCRW8nZabyzZUHhuL

// Validator 3 Public Key:  8ciJasgK6WvB5qH8eV8Zg8TqgcbfpXwdzfcgbrE9WNGr
// Validator 3 Vote Account:  4BuhzMg9m53QcRCaDdBgxn7zL3qNaGXNE8V3GdnX7CVH

// Validator 33 Public Key:  AfWJMp8XcvpWdZ73w7nWiCdZGfpTSBg9UGEGbTy7k8Z1
// Validator 33 Vote Account:  FTTDP6wxN5f4CurdqDJAuo1qsqgihvTm3ZvdSs2y23bi
