import { cn } from "@/lib/utils";

export type StakeAccountState = "active" | "inactive" | "activating" | "deactivating";

interface StakeAccountStatusProps {
  state: StakeAccountState;
  className?: string;
}

const stateStyles: Record<StakeAccountState, { bg: string; text: string; label: string }> = {
  active: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    label: "Active"
  },
  inactive: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    label: "Inactive"
  },
  activating: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    label: "Activating"
  },
  deactivating: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    label: "Deactivating"
  }
};

export function StakeAccountStatus({ state, className }: StakeAccountStatusProps) {
  const style = stateStyles[state];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}