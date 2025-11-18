"use client";

import type { ProposalRow } from "@/components/proposals/proposals-table/ProposalsTable";
import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { GitHubIcon } from "@/components/icons/SvgIcons";
import { Spade } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWallet } from "@solana/wallet-adapter-react";
import { ProposalDescription } from "../ProposalDescription";
import { ProposalStatus, WalletRole } from "@/types";
import { useWalletRole } from "@/hooks";
import { SupportButton } from "../SupportButton";

const VOTE_STATE_LABEL: Record<ProposalRow["status"], string> = {
  supporting: "Not started",
  voting: "In Progress",
  finalized: "Finished",
};

function ProposalInfo({ proposal }: { proposal: ProposalRow }) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <Link
        href={`/proposals/${proposal.publicKey.toBase58()}`}
        className="space-y-3 block"
      >
        <h3 className="h3 whitespace-pre-wrap text-lg font-semibold tracking-tight text-white sm:text-xl hover-gradient-text transition-all duration-200">
          {proposal.simd && `${proposal.simd}: `}
          {proposal.title}
        </h3>
        <ProposalDescription githubUrl={proposal.description} />
      </Link>

      <AppButton
        asChild
        variant="outline"
        size="sm"
        className="w-fit border-white/20  text-[11px] font-medium uppercase tracking-[0.1em] text-white/70 hover:bg-white/20"
      >
        <Link
          href={proposal.description}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2"
        >
          <GitHubIcon />
          Link to proposal
        </Link>
      </AppButton>
    </div>
  );
}

function LifecycleStageBar({ stage }: { stage: ProposalStatus }) {
  const stages: ProposalStatus[] = ["supporting", "voting", "finalized"];
  const activeIndex = stages.indexOf(stage);

  return (
    <div className="flex items-center gap-2">
      {stages.map((s, index) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            index <= activeIndex ? "bg-green-600" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function VoteActions({
  state,
  proposalId,
  disabled,
}: {
  state: ProposalStatus;
  proposalId: string;
  disabled?: boolean;
}) {
  const { openModal } = useModal();
  const { publicKey } = useWallet();
  const { walletRole } = useWalletRole(publicKey?.toBase58());

  const isValidator = walletRole === WalletRole.VALIDATOR;
  const isStaker = walletRole === WalletRole.STAKER;
  const isBoth = walletRole === WalletRole.BOTH;

  const isVoting = state === "voting";

  return (
    <div className="flex flex-col gap-3">
      {isVoting && (
        <>
          <AppButton
            variant="outline"
            text="Modify Vote"
            className="w-full justify-center border-white/15 bg-white/10 text-sm font-medium text-white/75 hover:text-white"
            disabled={disabled}
            onClick={() => {
              if (isValidator || isBoth) {
                openModal("modify-vote", { proposalId });
              } else if (isStaker) {
                openModal("modify-override-vote", { proposalId });
              }
            }}
          />
          <AppButton
            variant="gradient"
            text="Cast Vote"
            className="w-full justify-center text-sm font-semibold text-foreground"
            disabled={disabled}
            onClick={() => {
              if (isValidator || isBoth) {
                openModal("cast-vote", { proposalId });
              } else if (isStaker) {
                openModal("override-vote", { proposalId });
              }
            }}
          />
        </>
      )}
      <SupportButton
        proposalStatus={state}
        proposalId={proposalId}
        disabled={disabled}
      />
    </div>
  );
}

function VotingPanel({ proposal }: { proposal: ProposalRow }) {
  const { connected } = useWallet();

  const isVoting = proposal.status === "voting";
  const isSupporting = proposal.status === "supporting";

  return (
    <aside className="w-full glass-card p-6 lg:w-80 xl:w-80">
      <header className="mb-6">
        <span className="block text-[11px] uppercase tracking-[0.24em] text-white/45 mb-3">
          {proposal.status === "finalized" ? "Vote" : "Stage"}
        </span>
        <div className="flex items-center justify-between gap-4">
          <span className="text-lg font-semibold text-white">
            {VOTE_STATE_LABEL[proposal.vote.state]}
          </span>
          <div className="w-20">
            <LifecycleStageBar stage={proposal.status} />
          </div>
        </div>
      </header>

      {connected ? (
        (isSupporting || isVoting) && (
          <VoteActions
            state={proposal.status}
            proposalId={proposal.publicKey.toBase58()}
          />
        )
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              {isSupporting ||
                (isVoting && (
                  <VoteActions
                    state={proposal.status}
                    proposalId={""}
                    disabled
                  />
                ))}
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
    </aside>
  );
}

// Main component
type ExternalProposalPanelProps = {
  proposal: ProposalRow;
};

export default function ExternalProposalPanel({
  proposal,
}: ExternalProposalPanelProps) {
  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-stretch xl:gap-8">
      <div className="w-32 shrink-0 self-stretch flex items-center justify-center">
        <Spade className="size-15 text-muted/70 animate-pulse" />
      </div>
      <ProposalInfo proposal={proposal} />
      <div className="lg:ml-auto">
        <VotingPanel proposal={proposal} />
      </div>
    </div>
  );
}
