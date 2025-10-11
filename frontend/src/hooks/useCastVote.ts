import { castVoteMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useCastVote() {
  return useMutation({
    mutationKey: ["cast-vote"],
    mutationFn: castVoteMutation,
  });
}
