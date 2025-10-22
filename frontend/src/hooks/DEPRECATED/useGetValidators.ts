import { RPC_URLS, useEndpoint } from "@/contexts/EndpointContext";
import { getStakeWizValidators } from "@/data";
import { Validator, Validators } from "@/types";
import { Connection } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";

export const useGetValidators = () => {
  const { endpointUrl: endpoint } = useEndpoint();

  return useQuery({
    queryKey: ["validators", endpoint],
    staleTime: 1000 * 120, // 2 minutes
    queryFn: () => getValidators(endpoint),
  });
};

const getValidators = async (endpoint: string): Promise<Validators> => {
  // const voteAccounts = await connection.getVoteAccounts();
  const rpcEndpoint = endpoint || RPC_URLS.devnet;
  const connection = new Connection(rpcEndpoint, "confirmed");

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

    // for each vote account, check if there is info from stake wiz validator data
    let unknownCount = 0;
    const validators = allVotes.map((vote) => {
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
        epoch_credits: vote.epochCredits?.[0]?.[0] || 0,
        last_vote: vote.lastVote,
      };
      return unknownValidator;
    });
    return validators;
  }

  return [];
};
