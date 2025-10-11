"use client";

import { AppButton } from "@/components/ui/AppButton";
import { useModal } from "@/contexts/ModalContext";
import { Ban, ThumbsDown, ThumbsUp } from "lucide-react";

interface CastVoteProps {
  proposalSimd: string;
}

export default function CastVote({}: CastVoteProps) {
  // TODO: CAST VOTE
  // TODO: make check if user already voted (here or in parent component)

  const { openModal } = useModal();

  const handleVoteFor = () => {
    // TODO: CAST VOTE
    // TODO: send proposal pubKey here as proposalId ?
    openModal("cast-vote", {
      proposalId: "",
      initialVoteDist: { for: 100, abstain: 0, against: 0 },
    });
  };
  const handleVoteAgainst = () => {
    // TODO: CAST VOTE
    // TODO: send proposal pubKey here as proposalId ?
    openModal("cast-vote", {
      proposalId: "",
      initialVoteDist: { against: 100, for: 0, abstain: 0 },
    });
  };
  const handleVoteAbstain = () => {
    // TODO: CAST VOTE
    // TODO: send proposal pubKey here as proposalId ?
    openModal("cast-vote", {
      proposalId: "",
      initialVoteDist: { abstain: 100, for: 0, against: 0 },
    });
  };

  return (
    <div className="glass-card h-full p-6 md:p-6 lg:p-8">
      <div className="flex flex-col h-full md:justify-center md:items-center lg:justify-start lg:items-stretch">
        <div className="md:max-w-md md:w-full">
          <div className="space-y-1 mb-6 md:mb-12 lg:mb-8 md:text-center lg:text-left">
            <h4 className="h4 font-semibold">Cast Your Vote</h4>
            <p className=" text-sm  text-white/60">
              Your vote is weighted by your SOL stake.
            </p>
          </div>

          <div className="flex-1 space-y-4">
            <AppButton
              onClick={handleVoteFor}
              variant="outline"
              text="Vote For"
              icon={<ThumbsUp className="size-4" />}
              className="w-full rounded-full bg-white/3"
              size="lg"
            />

            <AppButton
              onClick={handleVoteAgainst}
              variant="outline"
              text="Vote Against"
              icon={<ThumbsDown className="size-4" />}
              className="w-full rounded-full bg-white/3"
              size="lg"
            />

            <AppButton
              onClick={handleVoteAbstain}
              variant="outline"
              text="Abstain"
              icon={<Ban className="size-4" />}
              className="w-full rounded-full bg-white/3"
              size="lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
