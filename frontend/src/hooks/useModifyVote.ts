import { modifyVoteMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useModifyVote() {
  return useMutation({
    mutationKey: ["modify-vote"],
    mutationFn: modifyVoteMutation,
  });
}
