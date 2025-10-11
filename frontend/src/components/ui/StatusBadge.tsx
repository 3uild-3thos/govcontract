import { ProposalStatus } from "@/types";

type StatusBadgeVariant = "default" | "pill";

const STATUS_CLASSNAME: Record<
  ProposalStatus,
  Record<StatusBadgeVariant, string>
> = {
  active: {
    default:
      "bg-[var(--color-dao-status-active)]/5 text-[var(--color-dao-status-active)]",
    pill: "bg-[var(--color-dao-status-active)]/30 text-[var(--color-dao-status-active)]",
  },
  finalizing: {
    default:
      "bg-[var(--color-dao-status-finalizing)]/5 text-[var(--color-dao-status-finalizing)]",
    pill: "bg-[var(--color-dao-status-finalizing)]/30 text-[var(--color-dao-status-finalizing)]",
  },
  finalized: {
    default:
      "bg-[var(--color-dao-status-finalized)]/5 text-[var(--color-dao-status-finalized)]",
    pill: "bg-[var(--color-dao-status-finalized)]/30 text-[var(--color-dao-status-finalized)]",
  },
};

type StatusBadgeProps = {
  status: ProposalStatus;
  children?: React.ReactNode;
  className?: string;
  showDot?: boolean;
  variant?: StatusBadgeVariant;
};

export default function StatusBadge({
  status,
  children,
  className,
  showDot = true,
  variant = "default",
}: StatusBadgeProps) {
  const content =
    children ??
    (variant === "pill"
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : status.toUpperCase());

  const variantClassName = STATUS_CLASSNAME[status][variant];

  if (variant === "pill") {
    return (
      <span
        className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${variantClassName} ${
          className ?? ""
        }`}
      >
        {content}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center gap-2 rounded-sm px-3 py-1 text-xs font-medium min-w-[120px] ${variantClassName} ${
        className ?? ""
      }`}
    >
      {showDot ? (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      ) : null}
      {content}
    </span>
  );
}
