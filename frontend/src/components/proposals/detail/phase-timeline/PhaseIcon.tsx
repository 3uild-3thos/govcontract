import { Check, Clock, Flame, MessageCircleMore, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseIconKey, PhaseState } from "./types";
import { VotingIcon } from "@/components/icons/SvgIcons";

interface PhaseIconProps {
  icon: PhaseIconKey;
  state: PhaseState;
}

export function PhaseIcon({ icon, state }: PhaseIconProps) {
  if (state === "passed") {
    return <Check className="size-5" strokeWidth={3} aria-hidden="true" />;
  }

  if (state === "failed") {
    return <X className="size-4" strokeWidth={3} aria-hidden="true" />;
  }

  const iconClassName = state === "current" ? "text-white/80" : "text-white/30";

  switch (icon) {
    case "voting":
      return <VotingIcon className={cn("size-6", iconClassName)} />;
    case "flame":
      return (
        <Flame
          className={cn("size-5", iconClassName)}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      );
    case "discussion":
      return (
        <MessageCircleMore
          className={cn(
            state === "current" ? "size-5" : "size-4",
            iconClassName
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      );
    case "clock":
    default:
      return (
        <Clock
          className={cn("size-4", iconClassName)}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      );
  }
}
