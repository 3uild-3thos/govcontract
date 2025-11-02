import { Check, Clock } from "lucide-react";
import { VotingIcon } from "@/components/icons/SvgIcons";
import { cn } from "@/lib/utils";
import type { PhaseIconKey, PhaseState } from "./types";

interface PhaseIconProps {
  icon: PhaseIconKey;
  state: PhaseState;
}

export function PhaseIcon({ icon, state }: PhaseIconProps) {
  if (state === "passed") {
    return <Check className="size-5" strokeWidth={3} aria-hidden="true" />;
  }

  const iconClassName = state === "active" ? "text-white/80" : "text-white/30";

  switch (icon) {
    case "voting":
      return <VotingIcon className={cn("size-6", iconClassName)} />;
    case "clock":
      return (
        <Clock
          className={cn("size-4", iconClassName)}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      );
    case "check":
    default:
      return (
        <Check
          className={cn("size-4", iconClassName)}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      );
  }
}