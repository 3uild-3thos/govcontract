import {
  getPhaseStatus,
  PHASE_STATUS_STYLES,
  PHASE_STATUS_LABELS,
} from "@/helpers";
import { ProposalStatus } from "@/types";

interface PhaseStatusBadgeProps {
  status: ProposalStatus;
}

export function PhaseStatusBadge({ status }: PhaseStatusBadgeProps) {
  const phaseStatus = getPhaseStatus(status);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/60">Status:</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${PHASE_STATUS_STYLES[phaseStatus]}`}
      >
        {PHASE_STATUS_LABELS[phaseStatus]}
      </span>
    </div>
  );
}
