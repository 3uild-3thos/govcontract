import { useMemo } from "react";
import { useGetValidators } from "./useGetValidators";

/**
 * Hook to get the total staked lamports from all validators
 * @returns The total staked lamports (sum of all validators' activated_stake)
 */
export const useValidatorsTotalStakedLamports = () => {
  const { data: validators, isLoading, error } = useGetValidators();

  const totalStakedLamports = useMemo(() => {
    if (!validators) {
      return 0;
    }

    return validators.reduce(
      (sum, validator) => sum + (validator.activated_stake || 0),
      0
    );
  }, [validators]);

  return {
    totalStakedLamports,
    isLoading,
    error,
  };
};

