import { useMemo } from "react";
import { useStakeAccounts } from "./useStakeAccounts";

export function useStakerVotingPower(
  userPubKey: string | undefined,
  enabled = true
) {
  const { data: stakeAccounts, isLoading } = useStakeAccounts(
    userPubKey,
    enabled
  );

  const votingPower = useMemo(
    () => stakeAccounts?.reduce((acc, curr) => acc + curr.activeStake, 0),
    [stakeAccounts]
  );

  return { votingPower, isLoading: isLoading };
}
