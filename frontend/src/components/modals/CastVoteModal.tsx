"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AppButton } from "@/components/ui/AppButton";
import ErrorMessage from "./shared/ErrorMessage";
import { VoteDistributionControls } from "./shared/VoteDistributionControls";
import {
  useCastVote,
  useVoteDistribution,
  useWalletRole,
  VoteDistribution,
} from "@/hooks";
import { toast } from "sonner";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletRole } from "@/types";
import {
  formatAddress,
  formatLamportsDisplay,
} from "@/lib/governance/formatters";

export interface CastVoteModalDataProps {
  proposalId?: string;
  ballotId?: number;
  initialVoteDist?: VoteDistribution;
}

interface CastVoteModalProps extends CastVoteModalDataProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CastVoteModal({
  proposalId: initialProposalId,
  ballotId,
  initialVoteDist,
  isOpen,
  onClose,
}: CastVoteModalProps) {
  const [proposalId, setProposalId] = React.useState(initialProposalId);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const {
    distribution,
    totalPercentage,
    isValidDistribution,
    handleOptionChange,
    handleQuickSelect,
    resetDistribution,
  } = useVoteDistribution(initialVoteDist);

  const wallet = useAnchorWallet();

  const { walletRole } = useWalletRole(wallet?.publicKey?.toBase58());
  const votingPower = 1000;
  const isLoadingVotingPower = false;

  const { mutate: castVote } = useCastVote();

  React.useEffect(() => {
    if (isOpen) {
      setProposalId(initialProposalId);
      resetDistribution();
      setError(undefined);
    }
  }, [isOpen, initialProposalId, resetDistribution]);

  const handleSuccess = () => {
    toast.success("Vote cast successfully");
    onClose();
    setIsLoading(false);
  };

  const handleError = (err: Error) => {
    console.log("error mutating cast vote:", err);
    toast.error(`Error voting for proposal ${proposalId}`);
    setError(err instanceof Error ? err.message : "Failed to cast vote");
    setIsLoading(false);
  };

  const handleVote = (voteDistribution: VoteDistribution) => {
    if (!wallet) {
      toast.error("Wallet not connected");
      return;
    }
    if (!proposalId) {
      toast.error("No proposal ID provided");
      return;
    }

    if (walletRole === WalletRole.NONE) {
      toast.error("You are not authorized to vote");
    } else if (walletRole === WalletRole.VALIDATOR) {
      castVote(
        {
          wallet,
          proposalId,
          forVotesBp: voteDistribution.for * 100,
          againstVotesBp: voteDistribution.against * 100,
          abstainVotesBp: voteDistribution.abstain * 100,
          ballotId,
        },
        {
          onSuccess: handleSuccess,
          onError: handleError,
        }
      );
    } else if (walletRole === WalletRole.STAKER) {
      toast.error("Staker can only cast an override vote");
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId || !isValidDistribution || isLoading) return;

    setIsLoading(true);
    setError(undefined);

    console.log("Casting vote:", { proposalId, distribution });
    handleVote(distribution);
  };

  const handleClose = () => {
    setProposalId("");
    resetDistribution();
    setError(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="app-modal-content"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <div className="app-modal-scroll-region">
          <div className="app-modal-body">
            {/* Mobile handle bar */}
            <div className="app-modal-handle" />

            <DialogHeader>
              <DialogTitle className="text-foreground">Cast Vote</DialogTitle>
              <DialogDescription className="sr-only">
                Cast your vote on a proposal
              </DialogDescription>
            </DialogHeader>

            <form
              id="cast-vote-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Proposal ID Input */}
              <div className="space-y-2">
                <label
                  htmlFor="proposal-id"
                  className="text-sm font-medium text-white/80"
                >
                  Proposal ID
                </label>
                <input
                  id="proposal-id"
                  type="text"
                  value={proposalId}
                  onChange={(e) => setProposalId(e.target.value)}
                  placeholder="Enter proposal public key"
                  className={cn(
                    "input",
                    "mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5",
                    "placeholder:text-sm placeholder:text-white/40"
                  )}
                  disabled={!!initialProposalId}
                />
              </div>

              {/* Voting Info */}
              <div className="rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground sm:text-sm">
                    {formatAddress(wallet?.publicKey?.toBase58() || "", 6)}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-white/60">Voting Power</p>
                    {isLoadingVotingPower && (
                      <div className="flex justify-center">
                        <div className="h-5 w-14 mt-1 animate-pulse rounded bg-white/10" />
                      </div>
                    )}
                    {!isLoadingVotingPower && votingPower && (
                      <p className="text-sm font-semibold text-foreground sm:text-base">
                        {formatLamportsDisplay(votingPower).value}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <VoteDistributionControls
                distribution={distribution}
                totalPercentage={totalPercentage}
                isValidDistribution={isValidDistribution}
                onOptionChange={handleOptionChange}
                onQuickSelect={handleQuickSelect}
                distributionLabel="Custom Vote Distribution"
                invalidTotalMessage="Total must equal 100%"
                className="space-y-3"
              />

              {/* Error Message */}
              {error && <ErrorMessage error={error} />}
            </form>
          </div>
        </div>

        <DialogFooter className="app-modal-footer">
          <AppButton
            variant="outline"
            text="Cancel"
            size="lg"
            onClick={handleClose}
            disabled={isLoading}
          />
          <AppButton
            form="cast-vote-form"
            size="lg"
            disabled={!proposalId || !isValidDistribution || isLoading}
            onClick={handleSubmit}
            variant="gradient"
            text={isLoading ? "Casting..." : "Cast Vote"}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
