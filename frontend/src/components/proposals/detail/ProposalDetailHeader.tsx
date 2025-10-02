"use client";

import Link from "next/link";
import type {
  ProposalRecord,
  ProposalStatus,
  ProposalLifecycleStage,
} from "@/dummy-data/proposals";
import { calculateTimeAgo, calculateVotingEndsIn } from "@/helpers";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckIcon, CopyIcon, Github } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import LifecycleIndicator from "@/components/ui/LifecycleIndicator";
import { formatAddress } from "@/lib/governance/formatters";

interface ProposalDetailHeaderProps {
  proposal: ProposalRecord;
}

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
      <p className="text-white/30 font-semibold text-xs lg:text-sm">{label}</p>
      {children}
    </div>
  );
}

export default function ProposalDetailHeader({
  proposal,
}: ProposalDetailHeaderProps) {
  const createdAgo = calculateTimeAgo(proposal.creationTimestamp);
  const endsIn = calculateVotingEndsIn(proposal.votingEndsIn);
  const { copied, copyToClipboard } = useCopyToClipboard();

  return (
    <div className="glass-card space-y-6 p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <h2 className="h2">{proposal.title}</h2>
          <div className="lg:hidden">
            <StatusBadge
              status={
                (proposal.status?.toLowerCase() || "active") as ProposalStatus
              }
              variant="pill"
            />
          </div>
          <p className=" text-sm leading-6 text-pretty text-white/60 line-clamp-3">
            {proposal.summary}
          </p>
        </div>
        <div className="hidden lg:block">
          <StatusBadge
            status={
              (proposal.status?.toLowerCase() || "active") as ProposalStatus
            }
            variant="pill"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 sm:gap-3 lg:gap-6 border-t border-white/10 pt-3 sm:pt-4 text-sm leading-none lg:leading-normal">
        <InfoItem label="ID:">
          <span className="font-mono text-white/60 text-xs lg:text-sm">
            #{proposal.simd}
          </span>
        </InfoItem>

        <InfoItem label="Author:">
          <span className="font-mono text-white/60 text-xs lg:text-sm">
            {formatAddress(proposal.author, 4)}
          </span>
          {copied ? (
            <CheckIcon className="size-3 lg:size-4 text-green-500" />
          ) : (
            <CopyIcon
              className="size-3 lg:size-4 text-white/60 hover:cursor-pointer"
              onClick={() => copyToClipboard(proposal.author)}
            />
          )}
        </InfoItem>

        <InfoItem label="Created:">
          <p className="text-white/60 text-xs lg:text-sm">{createdAgo}</p>
        </InfoItem>
        <InfoItem label="Ends:">
          <p className="text-white/60 text-xs lg:text-sm">{endsIn}</p>
        </InfoItem>
        <InfoItem label="Link to proposal:">
          <Link
            href={proposal.description}
            target="_blank"
            rel="noreferrer"
            className="hover:cursor-pointer"
          >
            <Github className="size-6 rounded-full lg:round-none lg:size-5 text-white/60 bg-white/10 p-1 lg:p-0 lg:bg-transparent hover:text-primary duration-200 transition-colors" />
          </Link>
        </InfoItem>

        <div className="hidden lg:block lg:ml-auto lg:mr-4">
          <LifecycleIndicator
            stage={
              (proposal.lifecycleStage || "voting") as ProposalLifecycleStage
            }
          />
        </div>
      </div>
    </div>
  );
}
