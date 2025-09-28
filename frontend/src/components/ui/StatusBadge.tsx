type ProposalStatus = "active" | "finalizing" | "finalized";

const STATUS_CLASSNAME: Record<ProposalStatus, string> = {
  active:
    "bg-[var(--color-dao-status-active)]/5 text-[var(--color-dao-status-active)]",
  finalizing:
    "bg-[var(--color-dao-status-finalizing)]/5 text-[var(--color-dao-status-finalizing)]",
  finalized:
    "bg-[var(--color-dao-status-finalized)]/5 text-[var(--color-dao-status-finalized)]",
};

type StatusBadgeProps = {
  status: ProposalStatus;
  children?: React.ReactNode;
  className?: string;
  showDot?: boolean;
};

export default function StatusBadge({
  status,
  children,
  className,
  showDot = true,
}: StatusBadgeProps) {
  const content = children ?? status.toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-3 py-1 text-xs font-medium min-w-[120px] ${
        STATUS_CLASSNAME[status]
      } ${className ?? ""}`}
    >
      {showDot ? (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      ) : null}
      {content}
    </span>
  );
}
