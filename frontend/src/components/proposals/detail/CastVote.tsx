"use client";

import { AppButton } from "@/components/ui/AppButton";
import { ModalType, useModal } from "@/contexts/ModalContext";
import { PublicKey } from "@solana/web3.js";
import { Ban, ThumbsDown, ThumbsUp } from "lucide-react";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProposalRecord, WalletRole } from "@/types";
import { useHasUserVoted, useWalletRole } from "@/hooks";

interface CastVoteProps {
  proposalPublicKey: PublicKey | undefined;
  isLoading: boolean;
  disabled?: boolean;
}

export function CastVoteSkeleton() {
  return (
    <div className="glass-card h-full p-6 md:p-6 lg:p-8">
      <div className="flex flex-col h-full md:justify-center md:items-center lg:justify-start lg:items-stretch">
        <div className="md:max-w-md md:w-full">
          <div className="space-y-1 mb-6 md:mb-12 lg:mb-8 md:text-center lg:text-left">
            <div className="h-7 w-32 bg-white/10 animate-pulse rounded" />
            <div className="h-5 w-48 bg-white/10 animate-pulse rounded" />
          </div>

          <div className="flex-1 space-y-4">
            <div className="h-11 w-full bg-white/10 animate-pulse rounded-full" />
            <div className="h-11 w-full bg-white/10 animate-pulse rounded-full" />
            <div className="h-11 w-full bg-white/10 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CastVote({ proposalPublicKey, disabled }: CastVoteProps) {
  const { openModal } = useModal();
  const { publicKey } = useWallet();
  const { walletRole } = useWalletRole(publicKey?.toBase58());

  const isStaker = walletRole === WalletRole.STAKER;

  let modalName: ModalType = "cast-vote";
  if (isStaker) {
    modalName = "override-vote";
  }

  const { data: hasUserVoted = false, isLoading: isLoadingHasUserVoted } =
    useHasUserVoted(proposalPublicKey?.toBase58());

  const disabledButtons =
    disabled || !proposalPublicKey || isLoadingHasUserVoted || hasUserVoted;

  const handleVoteFor = () => {
    if (proposalPublicKey) {
      openModal(modalName, {
        proposalId: proposalPublicKey.toBase58(),
        initialVoteDist: { for: 100, abstain: 0, against: 0 },
      });
    }
  };
  const handleVoteAgainst = () => {
    if (proposalPublicKey) {
      openModal(modalName, {
        proposalId: proposalPublicKey.toBase58(),
        initialVoteDist: { against: 100, for: 0, abstain: 0 },
      });
    }
  };
  const handleVoteAbstain = () => {
    if (proposalPublicKey) {
      openModal(modalName, {
        proposalId: proposalPublicKey.toBase58(),
        initialVoteDist: { abstain: 100, for: 0, against: 0 },
      });
    }
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
              disabled={disabledButtons}
            />

            <AppButton
              onClick={handleVoteAgainst}
              variant="outline"
              text="Vote Against"
              icon={<ThumbsDown className="size-4" />}
              className="w-full rounded-full bg-white/3"
              size="lg"
              disabled={disabledButtons}
            />

            <AppButton
              onClick={handleVoteAbstain}
              variant="outline"
              text="Abstain"
              icon={<Ban className="size-4" />}
              className="w-full rounded-full bg-white/3"
              size="lg"
              disabled={disabledButtons}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CastVoteWrapper({
  proposal,
  isLoading,
}: {
  proposal: ProposalRecord | undefined;
  isLoading: boolean;
}) {
  const { connected, publicKey } = useWallet();

  return (
    <>
      {connected && proposal && publicKey ? (
        <CastVote
          proposalPublicKey={proposal.publicKey}
          isLoading={isLoading}
        />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <CastVote
                proposalPublicKey={proposal?.publicKey}
                isLoading={isLoading}
                disabled
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-sm text-red-500/80">
              Wallet not connected, please connect your wallet to be able to
              perform these actions
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
