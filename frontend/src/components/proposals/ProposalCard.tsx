"use client";

import { WalletRole, type ProposalRecord } from "@/types";
import { Fragment, type MouseEventHandler } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { formatNumber } from "@/helpers";

import LifecycleIndicator from "@/components/ui/LifecycleIndicator";
import StatusBadge from "@/components/ui/StatusBadge";
import { useRouter } from "next/navigation";
import { ModalType, useModal } from "@/contexts/ModalContext";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletRole } from "@/hooks";

type ProposalStatus = ProposalRecord["status"];
interface VotingDetailItem {
  label: string;
  value: string;
}

interface VotingDetailsProps {
  items: VotingDetailItem[];
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

const getActionButtonText = (status: ProposalStatus) => {
  if (status === "voting") {
    return "Cast Vote";
  }

  if (status === "support") {
    return "Support";
  }

  return null;
};

const shouldShowModifyButton = (status: ProposalStatus) => status === "voting";

const VotingDetails = ({ items, layout }: VotingDetailsProps) => {
  if (items.length === 0) {
    return null;
  }

  if (layout === "mobile") {
    return (
      <div className="grid grid-cols-3 gap-4 pb-4 text-xs">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="flex flex-col gap-1"
          >
            <span className="text-white/40 text-[10px] uppercase tracking-wide">
              {item.label}
            </span>
            <span className="text-white/60 font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 text-sm text-white/60">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${item.value}`}>
          <span>
            <span className="text-white/40">{item.label}: </span>
            <span>{item.value}</span>
          </span>
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
  const { openModal } = useModal();

  const { publicKey: walletPubKey } = useWallet();
  const { walletRole } = useWalletRole(walletPubKey?.toBase58());

  const {
    status,
    quorumPercent,
    solRequired,
    title,
    simd,
    publicKey,
    endEpoch,
  } = proposal;

  const actionButtonText = getActionButtonText(status);
  const showActionButton = Boolean(actionButtonText);
  const showModifyButton = shouldShowModifyButton(status);

  const detailItems: VotingDetailItem[] = [
    { label: "Quorum", value: `${quorumPercent}%` },
    { label: "Required", value: `${formatNumber(solRequired)} SOL` },
    { label: "Voting End", value: `${endEpoch}` },
  ];

  const isStaker = walletRole === WalletRole.STAKER;

  let modalName: ModalType = "cast-vote";
  if (isStaker) {
    modalName = "override-vote";
  }

  const handleCardClick = () => {
    router.push(`/proposals/${publicKey.toBase58()}`);
  };

  const handleButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    const buttonText = (event.target as HTMLButtonElement).innerText;

    if (buttonText === "Modify Vote") {
      // TODO: Pass the actual proposal public key when available
      openModal("modify-vote", { proposalId: publicKey.toBase58() });
    } else if (buttonText === "Cast Vote") {
      // TODO: Pass the actual proposal public key when available
      openModal(modalName, { proposalId: publicKey.toBase58() });
    } else if (buttonText === "Support") {
      // TODO: Pass the actual proposal public key when available
      openModal("support-proposal", { proposalId: publicKey.toBase58() });
    }
  };

  return (
    <motion.div
      className="glass-card border p-6 transition-all cursor-pointer"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      whileTap={{ scale: 0.95, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
    >
      {/* Mobile Layout*/}
      <div className="md:hidden space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-plus-jakarta-sans font-semibold text-dao-color-gray">
                {simd || "-"}
              </span>
              <LifecycleIndicator stage={status} />
            </div>
            <StatusBadge
              status={status}
              showDot={false}
              className="bg-transparent !justify-end !px-0 !py-0 !min-w-fit"
            />
          </div>
          <h4 className="h4 font-medium text-foreground leading-tight line-clamp-3 text-balance">
            {title}
          </h4>
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
              {simd || "-"}
            </span>
            <LifecycleIndicator stage={status} />
          </div>
          <h4 className="h4 font-medium text-foreground leading-tight line-clamp-2 text-balance">
            {title}
          </h4>
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
    </motion.div>
  );
}

export const ProposalCardSkeleton = () => {
  return (
    <div className="glass-card border p-6 animate-pulse space-y-4">
      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-10 rounded bg-white/10" />
              <div className="h-3 w-3 rounded-full bg-white/10" />
            </div>
            <div className="h-4 w-12 rounded bg-white/10" />
          </div>
          <div className="h-5 w-3/4 rounded bg-white/10" />
        </div>

        <div className="flex items-center gap-5 pb-4 text-xs">
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/10" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="h-9 w-full rounded-full bg-white/10" />
          <div className="h-9 w-full rounded-full bg-white/10" />
        </div>
      </div>

      {/* Tablet / Desktop Layout */}
      <div className="hidden md:flex md:gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-12 rounded bg-white/10" />
            <div className="h-3 w-3 rounded-full bg-white/10" />
          </div>
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="flex gap-4">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/10" />
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-3 min-w-[140px]">
          <div className="h-4 w-14 rounded bg-white/10" />
          <div className="flex gap-2 w-full">
            <div className="h-9 w-full rounded-full bg-white/10" />
            <div className="h-9 w-full rounded-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
};
