import { connection } from "@/chain/helpers";
import { getStakeWizValidators } from "@/data";
import { Validator, Validators } from "@/types";
import { useQuery } from "@tanstack/react-query";
/**
 * DEPRECATED
 * @returns
 */
export const useGetValidators = () => {
  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["validators"],
    queryFn: getValidators,
  });
};

const getValidators = async (): Promise<Validators> => {
  // const voteAccounts = await connection.getVoteAccounts();

  const [stakeWizValidators, voteAccounts] = await Promise.allSettled([
    getStakeWizValidators(),
    connection.getVoteAccounts(),
  ]);

  if (
    stakeWizValidators.status === "fulfilled" &&
    voteAccounts.status === "fulfilled"
  ) {
    const allVotes = [
      ...voteAccounts.value.current,
      ...voteAccounts.value.delinquent,
    ];

    // fpr each vote account, check if there is info from stake wiz validator data
    let unknownCount = 0;
    return allVotes.map((vote) => {
      const matchedValidator = stakeWizValidators.value.data.find(
        (v) => v.vote_identity === vote.nodePubkey
      );

      if (matchedValidator) {
        return { ...matchedValidator };
      }
      unknownCount++;
      const unknownValidator: Validator = {
        name: `Unknown validator #${unknownCount}`,
        activated_stake: vote.activatedStake,
        version: "-",
        description: "",
        asn: "-",
        vote_identity: vote.nodePubkey,
        commission: vote.commission,
      };

      return unknownValidator;
    });
  }

  return [];
};
