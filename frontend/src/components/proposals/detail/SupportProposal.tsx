"use client";

import { AppButton } from "@/components/ui/AppButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModal } from "@/contexts/ModalContext";
import { useWalletRole } from "@/hooks";
import { WalletRole } from "@/types";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

interface CastVoteProps {
  proposalPublicKey: PublicKey | undefined;
  isLoading: boolean;
  disabled?: boolean;
}

export default function SupportProposal({
  proposalPublicKey,
  isLoading,
  disabled,
}: CastVoteProps) {
  const { openModal } = useModal();

  const { connected, publicKey } = useWallet();
  const { walletRole } = useWalletRole(publicKey?.toBase58());

  const isValidator = [WalletRole.VALIDATOR, WalletRole.BOTH].includes(
    walletRole
  );

  const disabledButtons = disabled || isLoading || !proposalPublicKey;

  const tooltipText =
    !isValidator && connected
      ? "You are not authorized to support this proposal, only validators can support proposals"
      : "Wallet not connected, please connect your wallet to be able to perform these actions";

  const handleSupport = () => {
    if (proposalPublicKey) {
      openModal("support-proposal", {
        proposalId: proposalPublicKey.toBase58(),
      });
    }
  };

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

          {connected && proposalPublicKey && publicKey && isValidator ? (
            <AppButton
              onClick={handleSupport}
              variant="gradient"
              text="Support"
              className="w-full"
              size="lg"
              disabled={disabledButtons}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <AppButton
                    onClick={handleSupport}
                    variant="gradient"
                    text="Support"
                    className="w-full"
                    size="lg"
                    disabled={true}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-sm text-red-500/80">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
