import { castVoteMutation } from "@/data";
import { useMutation } from "@tanstack/react-query";

export function useCastVote() {
  return useMutation({
    mutationKey: ["cast-vote"],
    mutationFn: castVoteMutation,
    //   onSuccess: async () => {
    //     client.resetQueries({
    //       queryKey: ['get-token-record', { tokenOwner: wallet?.publicKey }],
    //     })

    //     await client.invalidateQueries({
    //       queryKey: ['get-token-record', { tokenOwner: wallet?.publicKey }],
    //     })
    //     await client.invalidateQueries({
    //       queryKey: ['get-tokens-holding', { publicKey: wallet?.publicKey }],
    //     })
    //     await client.invalidateQueries({
    //       queryKey: ['get-voter-weight', { tokenOwner: wallet?.publicKey }],
    //     })
    //   },
  });
}
