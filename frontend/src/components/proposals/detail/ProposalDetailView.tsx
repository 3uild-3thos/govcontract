"use client";

import type { ProposalRecord } from "@/types";
import ProposalBreadcrumb from "./ProposalBreadcrumb";
import ProposalDetailHeader from "./ProposalDetailHeader";
import VoteBreakdown from "./VoteBreakdown";
import CastVote from "./CastVote";
import PhaseTimeline from "./phase-timeline";
import TopVotersTable from "./TopVotersTable";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProposalDetailViewProps {
  proposal: ProposalRecord | undefined;
  isLoading: boolean;
}

export default function ProposalDetailView({
  proposal,
  isLoading,
}: ProposalDetailViewProps) {
  const { connected } = useWallet();

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProposalBreadcrumb />
      <ProposalDetailHeader proposal={proposal} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr]">
        <VoteBreakdown proposal={proposal} isLoading={isLoading} />
        {connected && proposal ? (
          <CastVote
            proposalPublicKey={proposal.publicKey}
            isLoading={isLoading}
            // TODO: needed?
            // userStake="1000 SOL"
          />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <CastVote
                  proposalPublicKey={proposal?.publicKey}
                  isLoading={isLoading}
                  disabled
                  // TODO: needed?
                  // userStake="1000 SOL"
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
      </div>
      <PhaseTimeline proposal={proposal} isLoading={isLoading} />
      <TopVotersTable proposal={proposal} />
    </div>
  );
}
