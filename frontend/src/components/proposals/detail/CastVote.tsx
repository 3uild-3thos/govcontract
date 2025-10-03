/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { AppButton } from "@/components/ui/AppButton";
import { Ban, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

interface CastVoteProps {
  proposalSimd: string;
  userStake: string;
  onVote?: (vote: "for" | "against" | "abstain") => void;
}

export default function CastVote({
  proposalSimd,
  userStake,
  onVote,
}: CastVoteProps) {
  const [selectedVote, setSelectedVote] = useState<
    "for" | "against" | "abstain" | null
  >(null);

  const handleVote = (vote: "for" | "against" | "abstain") => {
    setSelectedVote(vote);
    onVote?.(vote);
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
              onClick={() => handleVote("for")}
              variant="outline"
              text="Vote For"
              icon={<ThumbsUp className="size-4" />}
              className="w-full rounded-full bg-white/3"
              size="lg"
            />

            <AppButton
              onClick={() => handleVote("against")}
              variant="outline"
              text="Vote Against"
              icon={<ThumbsDown className="size-4" />}
              className="w-full rounded-full bg-white/3"
              size="lg"
            />

            <AppButton
              onClick={() => handleVote("abstain")}
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
