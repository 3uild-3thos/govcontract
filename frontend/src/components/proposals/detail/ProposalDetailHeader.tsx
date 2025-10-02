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
    <div className="flex items-center gap-2">
      <p className="text-white/30 font-semibold">{label}</p>
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <h2 className="h2">{proposal.title}</h2>
          <p className=" text-sm leading-6 text-pretty text-white/60 line-clamp-3">
            {proposal.summary}
          </p>
        </div>
        <StatusBadge
          status={
            (proposal.status?.toLowerCase() || "active") as ProposalStatus
          }
          variant="pill"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-4 text-sm">
        <InfoItem label="ID:">
          <span className="font-mono text-white/60">#{proposal.simd}</span>
        </InfoItem>

        <InfoItem label="Author:">
          <span className="font-mono text-white/60">
            {formatAddress(proposal.author, 4)}
          </span>
          {copied ? (
            <CheckIcon className="size-4 text-green-500" />
          ) : (
            <CopyIcon
              className="size-4 text-white/60 hover:cursor-pointer"
              onClick={() => copyToClipboard(proposal.author)}
            />
          )}
        </InfoItem>

        <InfoItem label="Created:">
          {" "}
          <p className="text-white/60">{createdAgo}</p>
        </InfoItem>
        <InfoItem label="Ends:">
          <p className="text-white/60">{endsIn}</p>
        </InfoItem>
        <InfoItem label="Link to proposal:">
          <Link
            href={proposal.description}
            target="_blank"
            rel="noreferrer"
            className="hover:cursor-pointer"
          >
            <Github className="size-5 text-white/60 hover:text-primary duration-200 transition-colors" />
          </Link>
        </InfoItem>

        <div className="ml-auto mr-4">
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
