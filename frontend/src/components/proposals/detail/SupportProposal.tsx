"use client";

import { PublicKey } from "@solana/web3.js";
import { SupportButton } from "../SupportButton";
import { ProposalStatus } from "@/types";

interface CastVoteProps {
  proposalPublicKey: PublicKey | undefined;
  proposalStatus?: ProposalStatus;
  isLoading: boolean;
  disabled?: boolean;
}

export default function SupportProposal({
  proposalPublicKey,
  proposalStatus,
  isLoading,
  disabled,
}: CastVoteProps) {
  const disabledButtons = disabled || isLoading;

  const isSupporting = proposalStatus === "supporting";

  if (!isSupporting) {
    return null;
  }

  return (
    <div className="glass-card h-full p-6 md:p-6 lg:p-8">
      <div className="flex flex-col h-full md:justify-center md:items-center lg:justify-start lg:items-stretch">
        <div className="md:max-w-md md:w-full flex flex-col justify-between h-full">
          <div className="space-y-1 mb-6 md:mb-12 lg:mb-8 md:text-center lg:text-left">
            <h4 className="h4 font-semibold">Support this proposal</h4>
            <p className=" text-sm mt-4 text-white/60">
              During this period we take a snapshot of all active validators on
              Solana to make them eligible for the next vote.
            </p>
          </div>

          <SupportButton
            proposalId={proposalPublicKey?.toBase58()}
            proposalStatus={proposalStatus}
            disabled={disabledButtons}
          />
        </div>
      </div>
    </div>
  );
}
