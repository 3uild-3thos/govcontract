import { PHASE_DETAILS } from "./constants";
import type { PhaseKey } from "./types";

interface PhaseDetailProps {
  currentPhase: PhaseKey;
  isLoading?: boolean;
}

export function PhaseDetail({ currentPhase, isLoading }: PhaseDetailProps) {
  const detail = PHASE_DETAILS[currentPhase];

  if (!detail) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center space-y-2 pt-2 lg:pt-4 text-center">
      {isLoading ? (
        <div className="h-4 w-20 bg-white/10 animate-pulse rounded" />
      ) : (
        <p className="text-sm font-semibold text-primary/70">{detail.title}</p>
      )}
      {isLoading ? (
        <div className="flex flex-col gap-2 items-center justify-center mt-1">
          <div className="h-4 w-60 bg-white/10 animate-pulse rounded" />
          <div className="h-4 w-50 bg-white/10 animate-pulse rounded" />
        </div>
      ) : (
        <p className="text-sm text-white/50">{detail.body}</p>
      )}
    </div>
  );
}
