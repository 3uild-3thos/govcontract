import { cn } from "@/lib/utils";
import { PhaseIcon } from "./PhaseIcon";
import type { PhaseDefinition, PhaseState } from "./types";

interface PhaseNodeProps {
  phase: PhaseDefinition;
  state: PhaseState;
}

export function PhaseNode({ phase, state }: PhaseNodeProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        {state === "active" && (
          <span
            className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-30"
            aria-hidden="true"
          />
        )}

        <span
          className={cn(
            "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm transition-colors duration-300",
            state === "passed" &&
              "bg-gradient-to-r from-primary/20 to-emerald-500/20 text-primary/30",
            state === "active" &&
              "bg-gradient-to-r from-primary to-secondary text-foreground",
            state === "upcoming" &&
              "border border-white/15 bg-white/5 text-white/60"
          )}
        >
          <PhaseIcon icon={phase.icon} state={state} />
        </span>
      </div>

      <span
        className={cn(
          "mt-3 text-xs text-white/50 transition-colors duration-300",
          state === "active" && "text-white"
        )}
      >
        {phase.label}
      </span>
    </div>
  );
}