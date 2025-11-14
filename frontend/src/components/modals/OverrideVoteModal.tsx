"use client";

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
import { VoteDistributionControls } from "./shared/VoteDistributionControls";
import {
  useCastVoteOverride,
  useWalletStakeAccounts,
  useVoteDistribution,
  useWalletRole,
  VoteDistribution,
  useVoteOverrideAccounts,
} from "@/hooks";
import { toast } from "sonner";
import { WalletRole } from "@/types";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { FormEvent, useEffect, useState } from "react";
import { GetVoteOverrideFilters } from "@/data";
import { PublicKey } from "@solana/web3.js";
import { VotingProposalsDropdown } from "../VotingProposalsDropdown";
import { StakeAccountsDropdown } from "../StakeAccountsDropdown";

interface OverrideVoteModalProps {
  proposalId?: string;
  consensusResult?: PublicKey;
  initialVoteDist?: VoteDistribution;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Builds vote override filters for a specific proposal and delegator
 */
function buildVoteOverrideFilters(
  proposalPublicKey: string | undefined,
  delegatorPublicKey: PublicKey | null
): GetVoteOverrideFilters {
  const filters: GetVoteOverrideFilters = [];

  if (proposalPublicKey) {
    filters.push({
      name: "proposal" as const,
      value: proposalPublicKey,
    });
  }

  if (delegatorPublicKey) {
    filters.push({
      name: "delegator" as const,
      value: delegatorPublicKey.toBase58(),
    });
  }

  return filters;
}

export function OverrideVoteModal({
  proposalId: initialProposalId,
  consensusResult,
  initialVoteDist,
  isOpen,
  onClose,
}: OverrideVoteModalProps) {
  const [proposalId, setProposalId] = useState(initialProposalId);
  const [selectedStakeAccount, setSelectedStakeAccount] = useState<
    string | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const {
    distribution,
    totalPercentage,
    isValidDistribution,
    handleOptionChange,
    handleQuickSelect,
    resetDistribution,
  } = useVoteDistribution(initialVoteDist);

  const wallet = useAnchorWallet();

  const { data: stakeAccounts } = useWalletStakeAccounts(
    wallet?.publicKey?.toBase58()
  );
  const voteOverrideFilters = buildVoteOverrideFilters(
    proposalId,
    wallet?.publicKey ?? null
  );

  const { data: voteOverrideAccounts = [] } =
    useVoteOverrideAccounts(voteOverrideFilters);

  const { walletRole } = useWalletRole(wallet?.publicKey?.toBase58());

  const { mutate: castVoteOverride } = useCastVoteOverride();

  const isValidStakeAccount = selectedStakeAccount !== undefined;

  useEffect(() => {
    if (isOpen) {
      setProposalId(initialProposalId);
      setSelectedStakeAccount(undefined);
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
      setIsLoading(false);
      return;
    }
    if (!proposalId) {
      toast.error("No proposal ID provided");
      setIsLoading(false);
      return;
    }

    if (walletRole === WalletRole.NONE || walletRole === WalletRole.VALIDATOR) {
      toast.error("You are not authorized to override vote");
    } else if (walletRole === WalletRole.STAKER) {
      if (stakeAccounts === undefined) {
        toast.error("No stake accounts found");
        setIsLoading(false);
        return;
      }

      const stakeAccount = selectedStakeAccount;

      const voteAccount = stakeAccounts.find(
        (sa) => sa.stakeAccount === stakeAccount
      )?.voteAccount;

      if (stakeAccount === undefined) {
        toast.error("Not able to determine stake account");
        setIsLoading(false);
        return;
      }
      if (voteAccount === undefined) {
        toast.error("Not able to determine vote account");
        return;
      }

      castVoteOverride(
        {
          wallet,
          proposalId,
          forVotesBp: voteDistribution.for * 100,
          againstVotesBp: voteDistribution.against * 100,
          abstainVotesBp: voteDistribution.abstain * 100,
          stakeAccount,
          voteAccount,
          consensusResult,
        },
        {
          onSuccess: handleSuccess,
          onError: handleError,
        }
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
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

    console.log("Overriding vote:", {
      proposalId,
      stakeAccount: selectedStakeAccount,
      distribution,
    });
    handleVote(distribution);
  };

  const handleClose = () => {
    setProposalId("");
    setSelectedStakeAccount("");
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
              <VotingProposalsDropdown
                value={proposalId}
                onValueChange={setProposalId}
                disabled={!!initialProposalId}
              />

              {/* Stake Account Selection */}
              <div className="space-y-3">
                {/* Specify Stake Account Option */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm text-white/80">
                      Select stake account
                    </p>
                    <p className="text-xs text-white/60">
                      Provide a specific stake account address
                    </p>
                  </div>
                </label>
                {/* Custom Stake Account Input */}
                <StakeAccountsDropdown
                  value={selectedStakeAccount}
                  onValueChange={setSelectedStakeAccount}
                  disabledAccounts={voteOverrideAccounts.map((voa) =>
                    voa.stakeAccount.toBase58()
                  )}
                />
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
