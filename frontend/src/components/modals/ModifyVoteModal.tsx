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
import RequirementItem from "./shared/RequirementItem";
import { VoteDistributionControls } from "./shared/VoteDistributionControls";
import { useModifyVote, useVoteDistribution, VoteDistribution } from "@/hooks";
import { toast } from "sonner";

export interface ModifyVoteModalDataProps {
  proposalId?: string;
  initialVoteDist?: VoteDistribution;
}

interface ModifyVoteModalProps extends ModifyVoteModalDataProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModifyVoteModal({
  proposalId: initialProposalId = "",
  initialVoteDist,
  isOpen,
  onClose,
}: ModifyVoteModalProps) {
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

  const { mutate: modifyVote } = useModifyVote();

  // TODO: Requirements state -these would be computed from actual data
  const [hasVoted] = React.useState(true);
  const [isFinalized] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setProposalId(initialProposalId);
      resetDistribution();
      setError(undefined);
    }
  }, [isOpen, initialProposalId, resetDistribution]);

  const handleSuccess = () => {
    toast.success("Vote modified successfully");
    onClose();
    setIsLoading(false);
  };
  const handleError = (err: Error) => {
    console.log("error mutating cast vote:", err);
    toast.error(`Error modifying vote for proposal ${proposalId}`);
    setError(err instanceof Error ? err.message : "Failed to modify vote");
    setIsLoading(false);
  };

  const handleModifyVote = (voteDistribution: VoteDistribution) => {
    modifyVote(
      {
        wallet: {},
        proposalId,
        forVotesBp: voteDistribution.for,
        againstVotesBp: voteDistribution.against,
        abstainVotesBp: voteDistribution.abstain,
      },
      {
        onSuccess: handleSuccess,
        onError: handleError,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalId || !isValidDistribution || isLoading) return;

    setIsLoading(true);
    setError(undefined);

    handleModifyVote(distribution);
    console.log("Modifying vote:", { proposalId, distribution });
  };

  const handleClose = () => {
    setProposalId("");
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
              <DialogTitle className="text-foreground">Modify Vote</DialogTitle>
              <DialogDescription className="sr-only">
                Modify your vote on a proposal
              </DialogDescription>
            </DialogHeader>

            <form
              id="modify-vote-form"
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
                />
                <p className="text-xs text-white/60">
                  Enter the ID of the proposal you previously voted on
                </p>
              </div>

              <VoteDistributionControls
                distribution={distribution}
                totalPercentage={totalPercentage}
                isValidDistribution={isValidDistribution}
                onOptionChange={handleOptionChange}
                onQuickSelect={handleQuickSelect}
                className="space-y-3"
              />

              {/* Requirements */}
              <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-white/80 sm:text-sm">
                  Requirements:
                </h3>
                <div className="space-y-2">
                  <RequirementItem
                    met={hasVoted}
                    text="You must have already voted on this proposal"
                  />
                  <RequirementItem
                    met={!isFinalized}
                    text="The proposal must not be finalized"
                  />
                  <RequirementItem
                    met={isValidDistribution}
                    text="New vote percentages must sum to 100%"
                  />
                </div>
              </div>

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
            form="modify-vote-form"
            size="lg"
            disabled={
              !proposalId ||
              !isValidDistribution ||
              !hasVoted ||
              isFinalized ||
              isLoading
            }
            onClick={handleSubmit}
            variant="gradient"
            text={isLoading ? "Modifying..." : "Modify Vote"}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
