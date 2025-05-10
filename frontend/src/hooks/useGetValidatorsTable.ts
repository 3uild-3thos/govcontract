import { useQuery } from "@tanstack/react-query";
import { useGetValidators } from "./useGetValidators";

export const useGetValidatorsTable = () => {
  const { data: validators, isLoading: isLoadingValidators } =
    useGetValidators();

  const validatorsReady =
    !isLoadingValidators && validators && validators.length > 0;
  const enabled = validatorsReady;

  return useQuery({
    staleTime: 1000 * 120, // 2 minutes
    queryKey: ["validatorsTable"],
    enabled,
    queryFn: async () => {
      if (!validators) return null;

      return (
        validators?.map((d) => ({
          ...d,
          percentage: 0,
          voteDate: "03/26/25 12:15pm",
        })) || []
      );
    },
  });
};

// Proposal Account:  2GbFTkSmBkxWXVWa252XDTVptU4hqhP5BHvNkMKa3vL1

// Validator 1 Public Key:  AHYic562KhgtAEkb1rSesqS87dFYRcfXb4WwWus3Zc9C
// Validator 1 Vote Account:  EJU89DJtDsTb6LyYLiaU4urVxQxFGhbKshorjB3owHnr

// Validator 2 Public Key:  5WYbFiL3p2vDmFq299Lf236zkUb7VfJafXuaoS5YfV1p
// Validator 2 Vote Account:  CjnKBR9XZv2a3JgUA2GU6aJJVS1tJ5ytZcfMCCwJydBw

// Validator 3 Public Key:  E5bjdQKxNBLo6DkyDFzD3xCEyF7ZYiXq5YFHuKbo7APu
// Validator 3 Vote Account:  6yjgnHT1u1pvApccRxTybA7WLSKu1cYtS8BfmyQL9F4b
