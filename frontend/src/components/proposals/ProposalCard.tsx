/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type { ProposalRecord } from "@/dummy-data/proposals";
import { Fragment, type MouseEventHandler } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { calculateVotingEndsIn } from "@/helpers";
import { formatNumber } from "@/helpers";
import { useMounted } from "@/hooks/useMounted";

import LifecycleIndicator from "@/components/ui/LifecycleIndicator";
import StatusBadge from "@/components/ui/StatusBadge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ProposalStatus = ProposalRecord["status"];
type ProposalLifecycleStage = ProposalRecord["lifecycleStage"];
interface VotingDetailsProps {
  items: string[];
  layout: "mobile" | "tablet";
}
interface ActionButtonsProps {
  layout: "mobile" | "tablet";
  showModifyButton: boolean;
  showActionButton: boolean;
  actionButtonText: string | null;
  onButtonClick?: MouseEventHandler<HTMLButtonElement>;
}
interface ProposalCardProps {
  proposal: ProposalRecord;
}

const STATUS_LABEL_FOR_ENDED = "Ended";

const getVotingStatusText = (
  status: ProposalStatus,
  votingEndsInText: string | null,
) => {
  if (status === "finalized" || votingEndsInText === STATUS_LABEL_FOR_ENDED) {
    return "Voting Ended";
  }
  if (votingEndsInText) {
    return `Voting Ends in ${votingEndsInText}`;
  }
  return "Voting Not Started Yet";
};

const getActionButtonText = (
  lifecycleStage: ProposalLifecycleStage,
  status: ProposalStatus,
) => {
  if (lifecycleStage === "voting") {
    return "Cast Vote";
  }

  if (lifecycleStage === "support") {
    return "Support";
  }

  return null;
};

const shouldShowModifyButton = (
  lifecycleStage: ProposalLifecycleStage,
  status: ProposalStatus,
) => lifecycleStage === "voting";

const VotingDetails = ({ items, layout }: VotingDetailsProps) => {
  if (items.length === 0) {
    return null;
  }

  if (layout === "mobile") {
    return (
      <div className="inline-flex items-center text-white/60 text-xs gap-5 pb-4">
        {items.map((item, index) => (
          <Fragment key={`${item}-${index}`}>
            <span>{item}</span>
            {index < items.length - 1 && (
              <span className="w-[1px] h-3 bg-dao-color-gray/30" />
            )}
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 text-sm">
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          <span className="text-white/60">{item}</span>
          {index < items.length - 1 && <span className="text-white/20">|</span>}
        </Fragment>
      ))}
    </div>
  );
};

const ActionButtons = ({
  layout,
  showModifyButton,
  showActionButton,
  actionButtonText,
  onButtonClick,
}: ActionButtonsProps) => {
  if (!showModifyButton && !showActionButton) {
    return null;
  }

  const isMobile = layout === "mobile";
  const hasBothButtons = showModifyButton && showActionButton;
  const containerClassName = isMobile
    ? `flex flex-col ${hasBothButtons ? "gap-4" : "gap-2"}`
    : `flex ${hasBothButtons ? "flex-row gap-4" : "flex-col gap-2"}`;
  const buttonClassName = isMobile ? "w-full rounded-full" : "rounded-full";

  return (
    <div className={containerClassName}>
      {showModifyButton && (
        <AppButton
          text="Modify Vote"
          variant="outline"
          size="default"
          className={buttonClassName}
          onClick={onButtonClick}
        />
      )}
      {showActionButton && actionButtonText && (
        <AppButton
          text={actionButtonText}
          variant="gradient"
          size="default"
          className={buttonClassName}
          onClick={onButtonClick}
        />
      )}
    </div>
  );
};

export default function ProposalCard({ proposal }: ProposalCardProps) {
  const router = useRouter();
  const mounted = useMounted();
  const {
    status,
    lifecycleStage,
    quorumPercent,
    solRequired,
    title,
    simd,
    votingEndsIn: votingEndsInValue,
  } = proposal;

  const votingEndsIn = mounted
    ? calculateVotingEndsIn(votingEndsInValue)
    : null;
  const votingStatusText = getVotingStatusText(status, votingEndsIn);
  const actionButtonText = getActionButtonText(lifecycleStage, status);
  const showActionButton = Boolean(actionButtonText);
  const showModifyButton = shouldShowModifyButton(lifecycleStage, status);

  const detailItems = [
    `Quorum ${quorumPercent}%`,
    `Required ${formatNumber(solRequired)} SOL`,
    votingStatusText,
  ];

  const handleCardClick = () => {
    router.push(`/proposals/${simd.toLowerCase()}`);
  };

  const handleButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    toast.success(
      (event.target as HTMLButtonElement).innerText + " Successfully",
    );
  };

  return (
    <div
      className="glass-card border p-6 transition-all cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
    >
      {/* Mobile Layout*/}
      <div className="md:hidden space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-plus-jakarta-sans font-semibold text-dao-color-gray">
                {simd}
              </span>
              <LifecycleIndicator stage={lifecycleStage} />
            </div>
            <StatusBadge
              status={status}
              showDot={false}
              className="bg-transparent !justify-end !px-0 !py-0 !min-w-fit"
            />
          </div>
          <h5 className="h5 font-medium text-foreground leading-tight line-clamp-3 text-balance">
            {title}
          </h5>
        </div>

        <VotingDetails items={detailItems} layout="mobile" />

        <ActionButtons
          layout="mobile"
          showModifyButton={showModifyButton}
          showActionButton={showActionButton}
          actionButtonText={actionButtonText}
          onButtonClick={handleButtonClick}
        />
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:flex md:gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-plus-jakarta-sans font-semibold text-white/60">
              {simd}
            </span>
            <LifecycleIndicator stage={lifecycleStage} />
          </div>
          <h5 className="h5 font-medium text-foreground leading-tight line-clamp-2 text-balance">
            {title}
          </h5>
          <VotingDetails items={detailItems} layout="tablet" />
        </div>

        <div className="flex flex-col items-end justify-between gap-3 min-w-[140px]">
          <StatusBadge
            status={status}
            showDot={false}
            className="bg-transparent !justify-end px-0 py-0 !min-w-fit"
          />
          <ActionButtons
            layout="tablet"
            showModifyButton={showModifyButton}
            showActionButton={showActionButton}
            actionButtonText={actionButtonText}
            onButtonClick={handleButtonClick}
          />
        </div>
      </div>
    </div>
  );
}
