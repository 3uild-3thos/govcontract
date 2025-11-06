"use client";

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
  useVoteDistribution,
  useWalletRole,
  VoteDistribution,
  useWalletVoteOverrideAccounts,
  useWalletStakeAccounts,
} from "@/hooks";
import { toast } from "sonner";
import { WalletRole } from "@/types";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { FormEvent, useEffect, useState } from "react";
import { useModifyVoteOverride } from "@/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui";
import {
  formatAddress,
  formatLamportsDisplay,
} from "@/lib/governance/formatters";

interface OverrideVoteModalProps {
  proposalId?: string;
  ballotId?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ModifyOverrideVoteModal({
  proposalId: initialProposalId,
  ballotId,
  isOpen,
  onClose,
}: OverrideVoteModalProps) {
  const [proposalId, setProposalId] = useState(initialProposalId);

  const [customStakeAccount, setCustomStakeAccount] = useState<
    string | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // TODO: PEDRO initialize this after getting previously casted vote info
  const initialVoteDist: VoteDistribution | undefined = undefined;

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

  const { walletRole } = useWalletRole(wallet?.publicKey?.toBase58());

  const { data: voteOverrideAccounts = [] } = useWalletVoteOverrideAccounts(
    proposalId,
    wallet?.publicKey.toBase58()
  );

  const { mutate: modifyVoteOverride } = useModifyVoteOverride();

  const isValidStakeAccount = customStakeAccount !== undefined;

  useEffect(() => {
    if (isOpen) {
      setProposalId(initialProposalId);
      setCustomStakeAccount(undefined);
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
    console.log("error mutating modify vote:", err);
    toast.error(`Error modifying for proposal ${proposalId}`);
    setError(err instanceof Error ? err.message : "Failed to modify vote");
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

      const stakeAccount = customStakeAccount;

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

      modifyVoteOverride(
        {
          wallet,
          proposalId,
          forVotesBp: voteDistribution.for * 100,
          againstVotesBp: voteDistribution.against * 100,
          abstainVotesBp: voteDistribution.abstain * 100,
          stakeAccount,
          voteAccount,
          ballotId,
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
      stakeAccount: customStakeAccount,
      distribution,
    });
    handleVote(distribution);
  };

  const handleClose = () => {
    setProposalId("");
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
              <DialogTitle className="text-foreground">Modify Vote</DialogTitle>
              <DialogDescription className="sr-only">
                Modify your vote on a proposal as a staker
              </DialogDescription>
            </DialogHeader>

            <form
              id="modify-vote-staker-form"
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
                  disabled={initialProposalId !== undefined}
                />
              </div>

              {/* Stake Account Selection */}
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm text-white/80">Select stake account</p>
                  <p className="text-xs text-white/60">
                    Select the stake account you want to modify the vote for
                  </p>
                </div>
              </label>

              {/* Custom Stake Account Input */}
              <Select
                value={customStakeAccount}
                onValueChange={(v) => setCustomStakeAccount(v)}
              >
                <SelectTrigger className="text-white w-full">
                  <div className="flex gap-1">
                    <span className="text-dao-text-secondary">
                      Stake account:
                    </span>
                    <SelectValue placeholder="-" />
                  </div>
                </SelectTrigger>
                <SelectContent className="text-white bg-background/40 backdrop-blur">
                  {stakeAccounts?.map((stakeAcc) => (
                    <SelectItem
                      key={stakeAcc.stakeAccount}
                      value={stakeAcc.stakeAccount}
                      disabled={
                        !voteOverrideAccounts.some(
                          (voa) =>
                            voa.stakeAccount.toBase58() ===
                            stakeAcc.stakeAccount
                        )
                      }
                    >
                      {formatAddress(stakeAcc.stakeAccount)} -&nbsp;
                      {formatLamportsDisplay(stakeAcc.activeStake).value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
