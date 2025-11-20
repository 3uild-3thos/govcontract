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
import { AppButton } from "@/components/ui/AppButton";
import ErrorMessage from "./shared/ErrorMessage";
import RequirementItem from "./shared/RequirementItem";
import { VoteDistributionControls } from "./shared/VoteDistributionControls";
import {
  useModifyVote,
  useVoteDistribution,
  useWalletRole,
  VoteDistribution,
} from "@/hooks";
import { toast } from "sonner";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { WalletRole } from "@/types";
import { VotingProposalsDropdown } from "../VotingProposalsDropdown";

export interface ModifyVoteModalDataProps {
  proposalId?: string;
  consensusResult?: PublicKey;
  initialVoteDist?: VoteDistribution;
}

interface ModifyVoteModalProps extends ModifyVoteModalDataProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModifyVoteModal({
  proposalId: initialProposalId,
  consensusResult,
  initialVoteDist,
  isOpen,
  onClose,
}: ModifyVoteModalProps) {
  const [selectedProposal, setSelectedProposal] = React.useState({
    id: initialProposalId,
    consensusResult,
  });

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

  const { mutate: modifyVote } = useModifyVote();

  // TODO: MODIFY VOTE
  // TODO: Requirements state -these would be computed from actual data
  const [hasVoted] = React.useState(true);
  const [isFinalized] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedProposal({ id: initialProposalId, consensusResult });
      resetDistribution();
      setError(undefined);
    }
  }, [isOpen, initialProposalId, resetDistribution, consensusResult]);

  const handleProposalChange = (
    proposalId: string,
    consensusResult: PublicKey
  ) => {
    setSelectedProposal({ id: proposalId, consensusResult });
  };

  const handleSuccess = () => {
    toast.success("Vote modified successfully");
    onClose();
    setIsLoading(false);
  };

  const handleError = (err: Error) => {
    console.log("error mutating cast vote:", err);
    toast.error(`Error modifying vote for proposal ${initialProposalId}`);
    setError(err instanceof Error ? err.message : "Failed to modify vote");
    setIsLoading(false);
  };

  const handleModifyVote = (voteDistribution: VoteDistribution) => {
    if (!wallet) {
      toast.error("Wallet not connected");
      return;
    }
    if (!selectedProposal.id) {
      toast.error("No proposal ID provided");
      return;
    }
    if (!selectedProposal.consensusResult) {
      toast.error("Couldn't obtain consensus result");
      return;
    }

    if (walletRole === WalletRole.NONE) {
      toast.error("You are not authorized to vote");
      return;
    } else if (
      walletRole === WalletRole.VALIDATOR ||
      walletRole === WalletRole.BOTH
    ) {
      modifyVote(
        {
          wallet,
          proposalId: selectedProposal.id,
          // convert basis points to BN, not %
          forVotesBp: voteDistribution.for * 100,
          againstVotesBp: voteDistribution.against * 100,
          abstainVotesBp: voteDistribution.abstain * 100,
          consensusResult: selectedProposal.consensusResult,
        },
        {
          onSuccess: handleSuccess,
          onError: handleError,
        }
      );
      return;
    } else if (walletRole === WalletRole.STAKER) {
      toast.error("Staker can only cast an override vote");
      setError("Staker can only cast an override vote");
      setIsLoading(false);
      return;
    }
    setError("Unknown error, unable to cast vote");
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal.id || !isValidDistribution || isLoading) return;

    setIsLoading(true);
    setError(undefined);

    console.log("Modifying vote:", {
      proposalId: selectedProposal.id,
      distribution,
    });
    handleModifyVote(distribution);
  };

  const handleClose = () => {
    setSelectedProposal({ id: undefined, consensusResult: undefined });
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
              <VotingProposalsDropdown
                value={selectedProposal.id}
                onValueChange={handleProposalChange}
                disabled={!!initialProposalId}
              />

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
              !selectedProposal.id ||
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
