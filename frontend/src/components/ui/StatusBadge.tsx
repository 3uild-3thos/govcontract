import { ProposalStatus } from "@/types";

type StatusBadgeVariant = "default" | "pill";

const STATUS_CLASSNAME: Record<
  ProposalStatus,
  Record<StatusBadgeVariant, string>
> = {
  supporting: {
    default:
      "bg-[var(--color-dao-status-supporting)]/5 text-[var(--color-dao-status-supporting)]",
    pill: "bg-[var(--color-dao-status-supporting)]/30 text-[var(--color-dao-status-supporting)]",
  },
  discussion: {
    default:
      "bg-[var(--color-dao-status-discussion)]/5 text-[var(--color-dao-status-discussion)]",
    pill: "bg-[var(--color-dao-status-discussion)]/30 text-[var(--color-dao-status-discussion)]",
  },
  voting: {
    default:
      "bg-[var(--color-dao-status-voting)]/5 text-[var(--color-dao-status-voting)]",
    pill: "bg-[var(--color-dao-status-voting)]/30 text-[var(--color-dao-status-voting)]",
  },
  finalized: {
    default:
      "bg-[var(--color-dao-status-finalized)]/5 text-[var(--color-dao-status-finalized)]",
    pill: "bg-[var(--color-dao-status-finalized)]/30 text-[var(--color-dao-status-finalized)]",
  },
  failed: {
    default: "bg-destructive/5 text-destructive",
    pill: "bg-destructive/30 text-destructive",
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
