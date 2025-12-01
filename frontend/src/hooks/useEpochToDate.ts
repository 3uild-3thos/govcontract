import { useQuery } from "@tanstack/react-query";
import { useEndpoint } from "@/contexts/EndpointContext";
import { epochToDate } from "@/helpers/date";

/**
 * Hook to convert a Solana epoch number to a Date
 * @param epoch - The epoch number to convert
 * @returns The date when the epoch will start, or null if loading/error
 */
export function useEpochToDate(epoch: number | undefined) {
  const { endpointUrl } = useEndpoint();

  return useQuery({
    queryKey: ["epochToDate", epoch, endpointUrl],
    queryFn: async () => {
      if (epoch === undefined) return null;
      return epochToDate(epoch, endpointUrl);
    },
    enabled: epoch !== undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes - epoch info doesn't change frequently
    refetchOnWindowFocus: false,
  });
}
