import type { CSSProperties } from "react";
import type { ProposalLifecycleStage } from "@/dummy-data/proposals";
import type { PhaseDefinition, PhaseDetail, ConnectorVariant } from "./types";

export const PHASE_DETAILS: Record<
  ProposalLifecycleStage | "finalizing",
  PhaseDetail
> = {
  support: {
    title: "Current: Support Phase",
    body: "This proposal is gathering the required support. Once the threshold is met it will move into the voting phase.",
  },
  voting: {
    title: "Current: Voting Phase",
    body: "This proposal is currently in the voting phase. It will conclude in 4 days. If the quorum is met and the 'For' votes are in the majority, the proposal will be queued for execution.",
  },
  finalizing: {
    title: "Current: Finalizing",
    body: "Voting has ended and the final tally is being confirmed. Once settlement completes, the proposal will be marked finalized.",
  },
  finalized: {
    title: "Current: Finalized",
    body: "Voting has concluded and the results are finalized. Review the outcome and any follow-up actions that may be required.",
  },
};

export const PHASES: PhaseDefinition[] = [
  { key: "support", label: "Support Phase", icon: "check" },
  { key: "voting", label: "Voting Active", icon: "voting" },
  { key: "finalized", label: "Finalized", icon: "clock" },
];

export const CONNECTOR_MASK_STYLE: CSSProperties = {
  maskImage:
    "repeating-linear-gradient(90deg, #000 0, #000 12px, transparent 12px, transparent 20px)",
  WebkitMaskImage:
    "repeating-linear-gradient(90deg, #000 0, #000 12px, transparent 12px, transparent 20px)",
};

export const CONNECTOR_CLASSES: Record<ConnectorVariant, string> = {
  complete: "connector-line--complete",
  active: "connector-line--active",
  upcoming: "",
};

export const CONNECTOR_OPACITY: Record<ConnectorVariant, string> = {
  complete: "opacity-100",
  active: "opacity-100",
  upcoming: "opacity-40",
};