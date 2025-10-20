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
import { toast } from "sonner";

interface OverrideVoteModalProps {
  proposalId?: string;
  isOpen: boolean;
  onClose: () => void;
}



type StakeAccountOption = "primary" | "specify";

export function OverrideVoteModal({
  proposalId: initialProposalId = "",
  isOpen,
  onClose,
}: OverrideVoteModalProps) {
  const [proposalId, setProposalId] = React.useState(initialProposalId);
  const [stakeAccountOption, setStakeAccountOption] =
    React.useState<StakeAccountOption>("primary");
  const [customStakeAccount, setCustomStakeAccount] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
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
      setStakeAccountOption("primary");
      setCustomStakeAccount("");
      resetDistribution();
      setError(undefined);
    }
  }, [isOpen, initialProposalId, resetDistribution]);

  const isValidStakeAccount =
    stakeAccountOption === "primary" || customStakeAccount.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !proposalId ||
      !isValidDistribution ||
      !isValidStakeAccount ||
      isLoading
    )
      return;

    setIsLoading(true);
    setError(undefined);

    try {
      // TODO: Implement actual vote override logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Overriding vote:", {
        proposalId,
        stakeAccount:
          stakeAccountOption === "primary" ? "primary" : customStakeAccount,
        usePrimaryStake: stakeAccountOption === "primary",
        distribution,
      });

      toast.success("Vote cast successfully");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to override vote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProposalId("");
    setStakeAccountOption("primary");
    setCustomStakeAccount("");
    resetDistribution();
    setError(undefined);
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
                Cast your vote on a proposal as a staker
              </DialogDescription>
            </DialogHeader>

            <form
              id="cast-vote-staker-form"
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

              {/* Stake Account Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80">
                  Stake Account
                </label>

                {/* Primary Stake Account Option */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="stake-account"
                    value="primary"
                    checked={stakeAccountOption === "primary"}
                    onChange={() => setStakeAccountOption("primary")}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white/80">
                      Use primary stake account
                    </p>
                    <p className="text-xs text-white/60">
                      Automatically use your first stake account
                    </p>
                  </div>
                </label>

                {/* Specify Stake Account Option */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="stake-account"
                    value="specify"
                    checked={stakeAccountOption === "specify"}
                    onChange={() => setStakeAccountOption("specify")}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-white/80">
                      Specify stake account
                    </p>
                    <p className="text-xs text-white/60">
                      Provide a specific stake account address
                    </p>
                  </div>
                </label>

                {/* Custom Stake Account Input */}
                {stakeAccountOption === "specify" && (
                  <input
                    type="text"
                    value={customStakeAccount}
                    onChange={(e) => setCustomStakeAccount(e.target.value)}
                    placeholder="Enter stake account address"
                    className={cn(
                      "input",
                      "w-full rounded-md border bg-white/5 px-3 py-1.5",
                      "placeholder:text-sm placeholder:text-white/40",
                    )}
                  />
                )}
              </div>

              <VoteDistributionControls
                distribution={distribution}
                totalPercentage={totalPercentage}
                isValidDistribution={isValidDistribution}
                onOptionChange={handleOptionChange}
                onQuickSelect={handleQuickSelect}
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
            form="cast-vote-staker-form"
            size="lg"
            disabled={
              !proposalId ||
              !isValidDistribution ||
              !isValidStakeAccount ||
              isLoading
            }
            onClick={handleSubmit}
            variant="gradient"
            text={isLoading ? "Casting..." : "Cast Vote"}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
