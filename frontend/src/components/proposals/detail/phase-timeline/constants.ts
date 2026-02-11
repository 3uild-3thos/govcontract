import type { CSSProperties } from "react";
import type { ProposalStatus } from "@/types";
import type { PhaseDefinition, PhaseDetail, ConnectorVariant } from "./types";

// Add new phase or delete phase here, all will work as expected
export const PHASES: PhaseDefinition[] = [
  { key: "supporting", label: "Support Phase", icon: "flame" },
  { key: "discussion", label: "Discussion Phase", icon: "discussion" },
  { key: "voting", label: "Voting Active", icon: "voting" },
  { key: "finalized", label: "Finalized", icon: "clock" },
];

export const FAILED_PHASE_DETAIL: PhaseDetail = {
  title: "Support Failed",
  body: "This proposal did not receive enough support to proceed to the discussion phase. The support threshold was not met within the required timeframe.",
};

export const PHASE_DETAILS: Record<ProposalStatus, PhaseDetail> = {
  supporting: {
    title: "Current: Support Phase",
    body: "This proposal is gathering the required support. Once the threshold is met it will move into the discussion phase.",
  },
  discussion: {
    title: "Current: Discussion Phase",
    body: "This proposal is currently in the discussion phase. Once the discussion phase is complete, the proposal will move into the voting phase.",
  },
  voting: {
    title: "Current: Voting Phase",
    body: "This proposal is currently in the voting phase. If the quorum is met and the 'For' votes are in the majority, the proposal will be queued for execution.",
  },
  finalized: {
    title: "Current: Finalized",
    body: "Voting has concluded and the results are finalized. Review the outcome and any follow-up actions that may be required.",
  },
  failed: FAILED_PHASE_DETAIL,
};

export const CONNECTOR_MASK_STYLE: CSSProperties = {
  maskImage:
    "repeating-linear-gradient(90deg, #000 0, #000 6px, transparent 6px, transparent 12px)",
  WebkitMaskImage:
    "repeating-linear-gradient(90deg, #000 0, #000 6px, transparent 6px, transparent 12px)",
};

export const CONNECTOR_CLASSES: Record<ConnectorVariant, string> = {
  complete: "connector-line--complete",
  flowing: "connector-line--flowing",
  upcoming: "",
};

export const CONNECTOR_OPACITY: Record<ConnectorVariant, string> = {
  complete: "opacity-100",
  flowing: "opacity-100",
  upcoming: "opacity-40",
};

export const NODE_STATE_STYLES = {
  passed: "bg-gradient-to-r from-primary/20 to-emerald-500/20 text-primary/30",
  current: "bg-gradient-to-r from-primary to-secondary text-foreground",
  currentAnimated:
    "bg-gradient-to-r from-primary to-secondary text-foreground animate-pulse-glow",
  upcoming: "border border-white/15 bg-white/5 text-white/60",
  failed: "bg-destructive/70 text-destructive-foreground",
} as const;

export const NODE_GLOW_STYLES = {
  currentPing:
    "absolute -inset-1 rounded-full bg-gradient-to-br from-primary to-secondary animate-ping-slow",
  currentStatic:
    "absolute inset-[-8px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-30",
  failed: "absolute inset-[-8px] rounded-full bg-destructive/30",
} as const;
