import { cn } from "@/lib/utils";
import { PhaseIcon } from "./PhaseIcon";
import type { PhaseDefinition, PhaseState } from "./types";
import { NODE_GLOW_STYLES, NODE_STATE_STYLES } from "./constants";

interface PhaseNodeProps {
  phase: PhaseDefinition;
  state: PhaseState;
  isLoading?: boolean;
}

export function PhaseNode({ phase, state, isLoading }: PhaseNodeProps) {
  const isFinalized = phase.key === "finalized";
  const isFailed = state === "failed";
  const isCurrent = state === "current";

  return (
    <div
      className={cn("flex flex-col items-center relative", {
        "animate-pulse": isLoading,
      })}
    >
      <div className="relative flex items-center justify-center scale-75 sm:scale-85 md:scale-90 lg:scale-100">
        {isCurrent && !isFinalized && (
          <span className={NODE_GLOW_STYLES.currentPing} aria-hidden="true" />
        )}
        {isCurrent && isFinalized && (
          <span className={NODE_GLOW_STYLES.currentStatic} aria-hidden="true" />
        )}
        {isFailed && (
          <span className={NODE_GLOW_STYLES.failed} aria-hidden="true" />
        )}

        <span
          className={cn(
            "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm transition-colors duration-300",
            state === "passed" && NODE_STATE_STYLES.passed,
            isCurrent && !isFinalized && NODE_STATE_STYLES.currentAnimated,
            isCurrent && isFinalized && NODE_STATE_STYLES.current,
            state === "upcoming" && NODE_STATE_STYLES.upcoming,
            isFailed && NODE_STATE_STYLES.failed
          )}
        >
          <PhaseIcon icon={phase.icon} state={state} />
        </span>
      </div>

      <span
        className={cn(
          "absolute top-full mt-2 lg:mt-3 text-xs text-white/50 transition-colors duration-300 text-center",
          "whitespace-normal sm:whitespace-nowrap",
          "max-w-[80px] sm:max-w-none",
          isCurrent && "text-white font-semibold",
          isFailed && "text-destructive font-semibold"
        )}
      >
        {isFailed ? "Support Failed" : phase.label}
      </span>
    </div>
  );
}
