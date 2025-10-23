import { PHASE_DETAILS } from "./constants";
import type { PhaseKey } from "./types";

interface PhaseDetailProps {
  currentPhase: PhaseKey;
}

export function PhaseDetail({ currentPhase }: PhaseDetailProps) {
  const detail = PHASE_DETAILS[currentPhase];

  if (!detail) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center space-y-2 pt-2 lg:pt-4 text-center">
      <p className="text-sm font-semibold text-primary/70">{detail.title}</p>
      <p className="text-sm text-white/50">{detail.body}</p>
    </div>
  );
}
