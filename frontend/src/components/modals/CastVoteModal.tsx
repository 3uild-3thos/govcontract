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
import { useVoteDistribution } from "@/hooks";

interface CastVoteModalProps {
  proposalId?: string;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit?: (data: CastVoteData) => void | Promise<void>;
}

interface CastVoteData {
  proposalId: string;
  distribution: {
    for: number;
    against: number;
    abstain: number;
  };
}

export function CastVoteModal({
  proposalId: initialProposalId = "",
  isOpen,
  isLoading = false,
  error,
  onSubmit,
  onClose,
}: CastVoteModalProps) {
  const [proposalId, setProposalId] = React.useState(initialProposalId);
  const [voterAccount] = React.useState("4aD...bC2"); // TODO: This would come from wallet
  const [votingPower] = React.useState(20000); // TODO: This would come from API
  const {
    distribution,
    totalPercentage,
    isValidDistribution,
    handleOptionChange,
    handleQuickSelect,
    resetDistribution,
  } = useVoteDistribution();

  React.useEffect(() => {
    if (isOpen) {
      setProposalId(initialProposalId);
      resetDistribution();
    }
  }, [isOpen, initialProposalId, resetDistribution]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId || !isValidDistribution || isLoading) return;

    await onSubmit?.({
      proposalId,
      distribution,
    });
  };

  const handleClose = () => {
    setProposalId("");
    resetDistribution();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
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
                    "placeholder:text-sm placeholder:text-white/40",
                  )}
                />
              </div>

              {/* Voting Info */}
              <div className="rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground sm:text-sm">
                    {voterAccount}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-white/60">Voting Power</p>
                    <p className="text-sm font-semibold text-foreground sm:text-base">
                      {votingPower.toLocaleString()}
                    </p>
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
