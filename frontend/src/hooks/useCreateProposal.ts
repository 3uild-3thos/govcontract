import { createProposalMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useCreateProposal() {
  return useMutation({
    mutationKey: ["create-proposal"],
    mutationFn: createProposalMutation,
  });
}
